import { Chat, TUtterance } from "ts/Chat";
import { MultiSuggest } from "./MultiSuggest";
import { md2html } from "./md2html";
import { Modal, App, ButtonComponent, Notice, MarkdownView } from "obsidian";
import { getSelection } from "./getSelection";
import { getFileName } from "./getFileName";
import { ChatPluginSettings } from "main";
import { saveConversation } from "./saveConversation";

export class RequestModal extends Modal {

    #chat: Chat;
    #resultCnt: HTMLDivElement;
    #promptInput: HTMLInputElement;
    #copiedToClipboard = false;

    #selection: string;
    #fileName: string;
    #settings: ChatPluginSettings
    #fileContent: string;

    constructor(app: App, settings: ChatPluginSettings) {
        super(app);

        this.#settings = settings;
        this.#chat = new Chat({
            apiKey: settings.apiKey,
            system: "Be a helpful assistent.",
            temperature: 0.3
        })
        try{
            this.#selection = getSelection(app)
        } catch (error) {
            // console.error(error)
        }

        try {
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				const editor = view?.editor;
                this.#fileContent = editor?.getValue() as string;
        } catch (error) {
            // console.error(error)
        }


        this.#fileName = getFileName(app);

        this.titleEl.innerHTML = "Chat conversation";
        this.modalEl.addClass("chat-request-modal");

        // Prompt input
        this.#promptInput = document.createElement("input");
        this.#promptInput.addClass("prompt-input");
        this.#promptInput.setAttribute("placeholder", "Type your request here ...")
        const ms = new MultiSuggest(this.#promptInput, this.onRequest.bind(this), app);
        ms.setContent(new Set(Object.keys(settings.presets)));
        this.contentEl.appendChild(this.#promptInput);

        // Placeholder
        const placeholderList = ["filename", "selection", "note"]
        const placeholder = document.createElement("div");
        placeholder.addClass('placeholder');
        for (let i = 0; i < placeholderList.length; i++) {
            const span = document.createElement("span");
            span.innerHTML = placeholderList[i];

            span.addEventListener("click", (e) => {
                const ph = (e.target! as HTMLElement).getText();
                this.#promptInput.value = this.#promptInput.value + " {" + ph + "} ";
                this.#promptInput.focus();
            })

            placeholder.appendChild(span);
        }
        this.contentEl.appendChild(placeholder);

        // Result
        this.#resultCnt = document.createElement("div");
        this.#resultCnt.addClass("chat-result-container");
        this.contentEl.appendChild(this.#resultCnt)

        // Buttons
        const buttonCnt = document.createElement("div");
        buttonCnt.addClass("chat-button-container");
        this.contentEl.appendChild(buttonCnt);

        new ButtonComponent(buttonCnt).setButtonText("Stop").setClass("chat-stop-button").onClick(() => {
            this.#chat.abort();
            this.#promptInput.focus();
        })

        new ButtonComponent(buttonCnt).setButtonText("Clear Conversation").setClass("chat-clear-button").onClick(() => {
            this.#chat.reset();
            this.#resultCnt.empty();
            this.#promptInput.focus();
        })

        new ButtonComponent(buttonCnt).setButtonText("Copy Response").setClass("chat-copy-button").onClick(() => {
            saveConversation(
                [...this.#chat.conversation],
                this.#settings,
                this.app
            );
            const value = this.#chat.conversation.pop()?.content;
            navigator.clipboard.writeText(value || "");
            this.#copiedToClipboard = true;
            this.close();
            new Notice("Copied response to clipboard.");
        })

        new ButtonComponent(buttonCnt).setButtonText("Copy Conversation").setClass("chat-copy-all-button").onClick(() => {
            saveConversation(
                [...this.#chat.conversation],
                this.#settings,
                this.app
            );
            const lines: string[] = [];
            const c = this.#chat.conversation;
            for (let i = 0; i < c.length; i++) {
                const u: TUtterance = c[i];
                if (u.role === "assistant") {
                    lines.push(u.content);
                } else if (u.role === "user") {
                    lines.push(`**${u.content}**`);
                }
            }
            const value = lines.join("\n")
            navigator.clipboard.writeText(value || "");
            this.#copiedToClipboard = true;
            this.close();
            new Notice("Copied conversation to clipboard.");
        })

    }

    #scrollDown() {
        this.#resultCnt.scrollTo(0, this.#resultCnt.scrollHeight);
    }

    onRequest(prompt: string, list: boolean) {
        this.#promptInput.value = "";

        if (list && this.#settings.presets[prompt]) {
            const preset = this.#settings.presets[prompt];
            this.#chat = new Chat({
                temperature: preset.temperature || 0.5,
                apiKey: this.#settings.apiKey,
                system: preset.system
            })
            this.titleEl.innerHTML = prompt;
            this.#resultCnt.empty();
            this.#promptInput.focus();
            return;
        }

        const h = document.createElement("div");
        h.addClass("cm-strong");
        h.innerHTML = prompt.replaceAll("{filename}", this.#fileName);
        this.#resultCnt.appendChild(h);

        const responseDiv = document.createElement("div");
        responseDiv.addClass("response");
        this.#resultCnt.appendChild(responseDiv);

        this.#chat
			.stream(
				prompt
					.replaceAll("{selection}", this.#selection)
					.replaceAll("{filename}", this.#fileName)
					.replaceAll("{note}", "```\n"+this.#fileContent+"\n```\n"),
				{
					partHandler: (part) => {
						responseDiv.innerHTML = md2html(part);
						this.#scrollDown();
					},
				}
			)
			.then(
				(result) => {
					responseDiv.innerHTML = md2html(result);
					this.#scrollDown();
					this.#promptInput.focus();
				},
				(error: Error) => {
					responseDiv.innerHTML = error.message;
					this.#scrollDown();
					this.#promptInput.focus();
				}
			);
    }

    onOpen() {

    }

    onClose() {
        if (!this.#copiedToClipboard) {
            saveConversation(
                [...this.#chat.conversation],
                this.#settings,

                this.app
            );
            const value = this.#chat.conversation.pop()?.content;
            navigator.clipboard.writeText(value || "");
        }
        this.contentEl.empty();
    }
}