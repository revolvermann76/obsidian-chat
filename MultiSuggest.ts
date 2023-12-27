import { App, AbstractInputSuggest } from 'obsidian';
export class MultiSuggest extends AbstractInputSuggest<string> {
    content: Set<string>;

    #minimalInputLength = 1;

    constructor(private inputEl: HTMLInputElement, private onSelectCb: (value: string) => void, app: App, content = new Set<string>([])) {
        super(app, inputEl);
        this.content = content;
        this.limit = 10;
        this.inputEl.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (ev.key === "Enter") {
                this.selectSuggestion(this.inputEl.value, ev);
            }
        })
    }

    setMinimalInputLength(len: number) {
        this.#minimalInputLength = Math.floor(Math.abs(len));
    }

    setContent(content: Set<string>) {
        this.content = content;
    }

    getSuggestions(inputStr: string): string[] {
        if (inputStr.length < this.#minimalInputLength) {
            return [];
        }
        const lowerCaseInputStr = inputStr.toLocaleLowerCase();
        return [...this.content].filter((content) =>
            content.toLocaleLowerCase().contains(lowerCaseInputStr)
        );
    }

    renderSuggestion(content: string, el: HTMLElement): void {
        el.setText(content);
    }

    selectSuggestion(content: string, evt: MouseEvent | KeyboardEvent): void {
        this.inputEl.value = "";
        this.onSelectCb(content);
        this.inputEl.blur()
        this.close();
    }

}