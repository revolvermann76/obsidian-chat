import { Chat, TUtterance } from "Chat";
import { MultiSuggest } from "MultiSuggest";
import { md2html } from "md2html";
import { Modal, App, ButtonComponent } from "obsidian"

export class RequestModal extends Modal {

    #chat: Chat;
    #resultCnt: HTMLDivElement;
    #promptInput: HTMLInputElement;
    #copiedToClipboard = false;

    constructor(app: App, apiKey: string) {
        super(app);

        this.#chat = new Chat({
            apiKey: apiKey,
            system: "Be a helpful assistent.",
            temperature: 0.3
        })

        this.titleEl.innerHTML = "Chat conversation";
        this.modalEl.addClass("chat-request-modal");

        // Prompt input
        this.#promptInput = document.createElement("input");
        this.#promptInput.addClass("prompt-input");
        this.#promptInput.setAttribute("placeholder", "Type your request here ...")
        const ms = new MultiSuggest(this.#promptInput, this.onRequest.bind(this), app);
        ms.setContent(new Set(["Lirum", "Larum", "Bla blubbb"]))
        this.contentEl.appendChild(this.#promptInput);

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
            const value = this.#chat.conversation.pop()?.content;
            console.log(value);
            navigator.clipboard.writeText(value || "");
            this.#copiedToClipboard = true;
            this.close();
        })
        new ButtonComponent(buttonCnt).setButtonText("Copy Conversation").setClass("chat-copy-all-button").onClick(() => {
            let lines: string[] = [];
            const c = this.#chat.conversation;
            for (let i = 0; i < c.length; i++) {
                const u: TUtterance = c[i];
                console.log(u);
                if (u.role === "assistant") {
                    lines.push(u.content);
                } else if (u.role === "user") {
                    lines.push(`**${u.content}**`);
                }
            }
            const value = lines.join("\n")
            console.log(value);
            navigator.clipboard.writeText(value || "");
            this.#copiedToClipboard = true;
            this.close();
        })

    }

    #scrollDown() {
        this.#resultCnt.scrollTo(0, this.#resultCnt.scrollHeight);
    }

    onRequest(prompt: string) {
        const h = document.createElement("div");
        h.addClass("cm-strong");
        h.innerHTML = prompt;
        this.#resultCnt.appendChild(h);
        const div = document.createElement("div");
        div.addClass("response");
        this.#resultCnt.appendChild(div);
        this.#chat.stream(prompt, {
            partHandler: (part) => {
                div.innerHTML = md2html(part);
                this.#scrollDown();
            }
        }).then((result) => {
            div.innerHTML = md2html(result);
            this.#scrollDown();
            this.#promptInput.focus();
        })
    }

    onOpen() {

    }

    onClose() {
        if (!this.#copiedToClipboard) {
            const value = this.#chat.conversation.pop()?.content;
            navigator.clipboard.writeText(value || "");
        }
        this.contentEl.empty();
    }
}