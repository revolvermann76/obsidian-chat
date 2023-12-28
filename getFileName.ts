import { App } from "obsidian";


export function getFileName(app: App): string {
    const leaf = app.workspace.getLeaf();
    app.workspace.setActiveLeaf(leaf);
    const file = app.workspace.getActiveFile();
    return file ? file.name.substring(0, file.name.length - 3) : null as unknown as string;
}