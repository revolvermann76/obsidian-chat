import * as Chat from 'Chat';
import * as Obsidian from 'obsidian';

interface ChatPluginSettings {
	apiKey: string;
}

const DEFAULT_SETTINGS: ChatPluginSettings = {
	apiKey: 'default'
}

export default class ChatPlugin extends Obsidian.Plugin {
	settings: ChatPluginSettings;
	chat: Chat.Chat;
	async onload() {
		await this.loadSettings();
		this.chat = new Chat.Chat({
			apiKey: this.settings.apiKey
		});
/*

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Chat Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Obsidian.Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('chat-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Obsidian.Editor, view: Obsidian.MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(Obsidian.MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}
					
					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});
		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		*/
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'chat-request',
			name: 'Request',
			callback: () => {
				new RequestModal(this.app).open();
			}
		});


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ChatSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



class MultiSuggest extends Obsidian.AbstractInputSuggest<string> {
	content: Set<string>;

	constructor(private inputEl: HTMLInputElement, private onSelectCb: (value: string) => void, app: Obsidian.App, content = new Set<string>([])) {
		super(app, inputEl);
		this.content = content;
		this.inputEl.addEventListener("keydown", (ev: KeyboardEvent) => {
			if (ev.key === "Enter") {
				this.selectSuggestion(this.inputEl.value, ev);
			}
		})
	}

	setContent(content: Set<string>) {
		this.content = content;
	}

	getSuggestions(inputStr: string): string[] {
		const lowerCaseInputStr = inputStr.toLocaleLowerCase();
		return [...this.content].filter((content) =>
			content.toLocaleLowerCase().contains(lowerCaseInputStr)
		);
	}

	renderSuggestion(content: string, el: HTMLElement): void {
		el.setText(content);
	}

	selectSuggestion(content: string, evt: MouseEvent | KeyboardEvent): void {
		this.inputEl.value = content;
		this.onSelectCb(content);
		this.inputEl.blur()
		this.close();
	}

}

class RequestModal extends Obsidian.Modal {

	constructor(app: Obsidian.App) {
		super(app);
		this.modalEl.addClass("chat-request-modal");
		const d = document.createElement("div");
		const promptInput = document.createElement("input");
		const ms = new MultiSuggest(promptInput, (value: string) => { alert(value) }, app);
		ms.setContent(new Set<string>(["Lirum", "Larum"]))
		d.appendChild(promptInput);
		this.contentEl.appendChild(d);
	}

	onOpen() {

	}

	onClose() {
		this.contentEl.empty();
	}
}

class ChatSettingTab extends Obsidian.PluginSettingTab {
	plugin: ChatPlugin;

	constructor(app: Obsidian.App, plugin: ChatPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Obsidian.Setting(containerEl)
			.setName('ChatGPT API Key')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
