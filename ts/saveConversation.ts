import { App, TFile, TFolder } from "obsidian";
import { TUtterance } from "ts/Chat";
const path = require('path');

async function createFile(app: App, filePath: string, content: string) {
    let file = app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
        if (filePath.indexOf("/") !== -1) {
            let dirPath = filePath.substring(
                0,
                filePath.lastIndexOf("/")
            );
            let folder = app.vault.getAbstractFileByPath(dirPath);
            if (!(folder instanceof TFolder)) {
                await app.vault.createFolder(dirPath);
            }
        }
        file = await app.vault.create(
            filePath,
            content
        );
    }
}

function getCurrentDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = ('0' + (now.getMonth() + 1)).slice(-2);
    var day = ('0' + now.getDate()).slice(-2);
    var hours = ('0' + now.getHours()).slice(-2);
    var minutes = ('0' + now.getMinutes()).slice(-2);
    var seconds = ('0' + now.getSeconds()).slice(-2);

    return year + month + day + hours + minutes + seconds;
}

function removeNonLettersAndSpaces(str: string): string {
    return str.replace(/[^a-zA-ZäöüÄÖÜß\s]/g, '');
}

async function generateTitle(conversation: TUtterance[]): Promise<string> {

    let postFix = removeNonLettersAndSpaces(conversation[0].content.substring(0, 40));

    return getCurrentDateTime() + " " + postFix;
}

function createContent(title: string, conversation: TUtterance[]): string {
    let retVal = "# " + title + "\n\n";

    for (let i = 0; i < conversation.length; i++) {
        retVal += "## " + conversation[i].role + "\n\n";
        retVal += conversation[i].content + "\n\n";
    }

    return retVal;
}

export async function saveConversation(
    conversation: TUtterance[],
    saveConversation: boolean,
    savePath: string,
    app: App
) {
    if (!saveConversation || !conversation.length) {
        return;
    }
    const title = await generateTitle(conversation)
    const fileName = path.join(savePath, title + ".md");
    createFile(app, fileName, createContent(title, conversation));
}




