import { Chat } from "Chat";
import { MultiSuggest } from "MultiSuggest";
import { Modal, App, ButtonComponent } from "obsidian"
export class RequestModal extends Modal {

    #chat: Chat;

    constructor(app: App, apiKey: string) {
        super(app);

        this.#chat = new Chat({
            apiKey: apiKey
        })

        this.titleEl.innerHTML = "Chat conversation";
        this.modalEl.addClass("chat-request-modal");


        // Prompt input
        const promptInput = document.createElement("input");
        promptInput.addClass("prompt-input");
        promptInput.setAttribute("placeholder", "Type your request here ...")
        const ms = new MultiSuggest(promptInput, this.onRequest.bind(this), app);
        ms.setContent(new Set(["Lirum", "Larum", "Bla blubbb"]))
        this.contentEl.appendChild(promptInput);

        // Result
        const resultCnt = document.createElement("div");
        resultCnt.addClass("chat-result-container");
        this.contentEl.appendChild(resultCnt)

        // Buttons
        const buttonCnt = document.createElement("div");
        buttonCnt.addClass("chat-button-container");
        this.contentEl.appendChild(buttonCnt);

        new ButtonComponent(buttonCnt).setButtonText("Stop").setClass("chat-stop-button")
        new ButtonComponent(buttonCnt).setButtonText("Copy").setClass("chat-copy-button")
        new ButtonComponent(buttonCnt).setButtonText("Copy All").setClass("chat-copy-all-button")

    }

    onRequest(prompt: string) {
        alert(prompt)
    }

    onOpen() {

    }

    onClose() {
        this.contentEl.empty();
    }
}