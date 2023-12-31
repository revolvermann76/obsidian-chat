import { MarkdownView, App } from "obsidian";

export async function getSelection(app: App) {

    let view = app.workspace.getActiveViewOfType(MarkdownView);
    let editor = view?.editor;

    if (editor) {
        let selection = editor.getSelection();

        if (selection) {
            return selection;
        } else {
            return "";
        }
    } else {
        throw new Error("Error: No Editor.");
    }
}
