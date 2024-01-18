import { MarkdownView, App } from "obsidian";

export function getSelection(app: App) {

    const view = app.workspace.getActiveViewOfType(MarkdownView);
    const editor = view?.editor;

    if (editor) {
        const selection = editor.getSelection();
        if (selection) {
            return selection;
        } else {
            return "";
        }
    } else {
        throw new Error("Error: No Editor.");
    }
}
