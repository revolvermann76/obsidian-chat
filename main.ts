import { RequestModal } from 'RequestModal';
import * as Obsidian from 'obsidian';
import { TPreset, presets } from 'preset';

export interface ChatPluginSettings {
	apiKey: string;
	presets: { [key: string]: TPreset };
}

const DEFAULT_SETTINGS: ChatPluginSettings = {
	apiKey: 'default',
	presets: presets
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
	plugin: ChatPlugin;

	constructor(app: Obsidian.App, plugin: ChatPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const h1 = document.createElement("h1");
		h1.innerHTML = "ChatGPT";
		containerEl.appendChild(h1);

		new Obsidian.Setting(containerEl)
			.setName('API Key')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				})
			);


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
		nameInput.value = "Whatever";


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


		new Obsidian.Setting(containerEl)
			.setName('Prompt')
			.setDesc('')
			.setClass('chat-prompt')
			.addTextArea(function (text) {
				text
					.setPlaceholder("Write your prompt here ... ")
				text.inputEl.rows = 10;
				text.inputEl.cols = 40;

			});

		let div = document.createElement('div');
		div.addClass("chat-prompt-button-cnt");
		containerEl.appendChild(div);

		new Obsidian.ButtonComponent(div).setButtonText("Save Preset").setCta()
		new Obsidian.ButtonComponent(div).setButtonText("Delete Preset").setCta().setWarning()

	}
}