import { ChatPluginSettings } from "main";
import { App, TFile, TFolder } from "obsidian";
import { Chat, TUtterance } from "ts/Chat";
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

async function generateTitle(conversation: TUtterance[], apiKey: string): Promise<string> {

    let postFix = ""

    try {
        const nameFinderPromt = "Find a name for the following conversation. Extract the most important words from it. Your response must be shorter than six words. The conversation is: "

        // flatten and shorten conversation
        let flattenedConversation = "";
        for (let i = 0; i < conversation.length; i++) {
            flattenedConversation += conversation[i].role + ": \n" + conversation[i].content + "\n\n";
        }
        flattenedConversation = flattenedConversation.substring(0, 200);

        let nameFinder = new Chat({
            apiKey: apiKey
        });
        postFix = await nameFinder.stream(nameFinderPromt + flattenedConversation)
    } catch (error) {
        // do nothing
    }

    return getCurrentDateTime() + " " + removeNonLettersAndSpaces(postFix);
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
    settings: ChatPluginSettings,
    app: App,
) {
    if (!settings.saveConversation || !conversation.length) {
        return;
    }
    const title = await generateTitle(conversation, settings.apiKey);
    const fileName = path.join(settings.saveConversationPath, title + ".md");
    createFile(app, fileName, createContent(title, conversation));
}




