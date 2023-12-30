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