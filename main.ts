import { RequestModal } from './ts/RequestModal';
import * as Obsidian from 'obsidian';
import { TPreset, presets } from './ts/preset';
import { MultiSuggest } from 'ts/MultiSuggest';

export interface ChatPluginSettings {
	apiKey: string;
	presets: { [key: string]: TPreset };
	saveConversation: boolean;
	saveConversationPath: string;
}

const DEFAULT_SETTINGS: ChatPluginSettings = {
	apiKey: 'default',
	presets: presets,
	saveConversation: false,
	saveConversationPath: 'chats'
}

export default class ChatPlugin extends Obsidian.Plugin {
	settings: ChatPluginSettings;
	async onload() {
		await this.loadSettings();


		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'chat-request',
			name: 'Request',
			callback: () => {
				new RequestModal(this.app, this.settings).open();
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


export class ChatSettingTab extends Obsidian.PluginSettingTab {
	#plugin: ChatPlugin;

	constructor(app: Obsidian.App, plugin: ChatPlugin) {
		super(app, plugin);
		this.#plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const h1 = document.createElement("h1");
		h1.innerHTML = "General settings";
		containerEl.appendChild(h1);

		new Obsidian.Setting(containerEl)
			.setName('API Key')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.#plugin.settings.apiKey)
				.onChange(async (value) => {
					this.#plugin.settings.apiKey = value;
					await this.#plugin.saveSettings();
				})
			);


		let pathSetting: Obsidian.Setting;
		new Obsidian.Setting(containerEl)
			.setName('Save conversations')
			.addToggle((toggleElem) => {
				toggleElem.setValue(this.#plugin.settings.saveConversation);
				toggleElem.onChange(async (e) => {
					const saveConversation = toggleElem.getValue();
					this.#plugin.settings.saveConversation = saveConversation;
					pathSetting.settingEl.toggleVisibility(saveConversation)
					await this.#plugin.saveSettings();
				})
			})

		pathSetting = new Obsidian.Setting(containerEl)
			.setName("Path")
			.addText(text => text
				.setPlaceholder('Enter path')
				.setValue(this.#plugin.settings.saveConversationPath)
				.onChange(async (value) => {
					this.#plugin.settings.saveConversationPath = value;
					await this.#plugin.saveSettings();
				}));
		pathSetting.settingEl.toggleVisibility(this.#plugin.settings.saveConversation);

		const h2 = document.createElement("h1");
		h2.innerHTML = "Presets";
		containerEl.appendChild(h2);


		const nameSetting = new Obsidian.Setting(containerEl)
			.setName('Name')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('Pick a meaningful name')
			);
		const nameInput: HTMLInputElement = nameSetting.controlEl.children[0] as HTMLInputElement;
		nameInput.value = "";


		const temperatureSetting = new Obsidian.Setting(containerEl)
			.setName('Temperature')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('a value beween 0 and 1')
			);
		const temperatureInput: HTMLInputElement = temperatureSetting.controlEl.children[0] as HTMLInputElement;
		temperatureInput.type = "range";
		temperatureInput.step = "1";
		temperatureInput.min = "0";
		temperatureInput.max = "100";
		temperatureInput.value = "25";


		const promptSetting = new Obsidian.Setting(containerEl)
			.setName('Prompt')
			.setDesc('')
			.setClass('chat-prompt')
			.addTextArea(function (text) {
				text
					.setPlaceholder("Write your prompt here ... ")
				text.inputEl.rows = 10;
				text.inputEl.cols = 40;

			});

		const promptTextarea = promptSetting.settingEl.querySelector("textarea")!;

		let div = document.createElement('div');
		div.addClass("chat-prompt-button-cnt");
		containerEl.appendChild(div);

		const ms = new MultiSuggest(
			nameInput,
			(item: string, list: boolean) => {
				if (!list) {
					return;
				}
				nameInput.value = item;
				promptTextarea.value = this.#plugin.settings.presets[item].system;
				temperatureInput.value = "" + Math.floor((this.#plugin.settings.presets[item].temperature || 0.5) * 100);
			},
			this.app
		);

		ms.setContent(new Set(Object.keys(this.#plugin.settings.presets)));


		new Obsidian.ButtonComponent(div)
			.setButtonText("Save Preset")
			.setCta()
			.onClick(() => {
				const name = nameInput.value;
				const temperature = parseInt(temperatureInput.value || "50") / 100;
				const prompt = promptTextarea.value;
				if (!name) { return; }
				this.#plugin.settings.presets[name] = {
					temperature: temperature,
					system: prompt
				}
				new Obsidian.Notice("Saved the preset " + name);
				ms.setContent(new Set(Object.keys(this.#plugin.settings.presets)));
				this.#plugin.saveSettings();

			});

		new Obsidian.ButtonComponent(div)
			.setButtonText("Delete Preset")
			.setCta()
			.setWarning()
			.onClick(() => {
				const name = nameInput.value;
				if (
					!name ||
					name === "chat conversation" ||
					!this.#plugin.settings.presets[name]
				) {
					return;
				}
				delete this.#plugin.settings.presets[name];
				nameInput.value = "";
				temperatureInput.value = "50";
				promptTextarea.value = "";
				ms.setContent(new Set(Object.keys(this.#plugin.settings.presets)));
				this.#plugin.saveSettings();
				new Obsidian.Notice("Deleted the preset " + name);
			});
	}
}