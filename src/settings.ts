import { App, PluginSettingTab, Setting, Plugin } from "obsidian";
import { AttendeesExtractorSettings } from './types';

export interface SettingsManager {
  settings: AttendeesExtractorSettings;
  saveSettings(): Promise<void>;
  onSettingChange(): Promise<void>;
}

export class AttendeesExtractorSettingTab extends PluginSettingTab {
	constructor(app: App, private settingsManager: SettingsManager & Plugin) {
		super(app, settingsManager);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Attendees Extractor Settings" });

		this.addHeadingNameSetting(containerEl);
		this.addFrontmatterPropertySetting(containerEl);
		this.addTemplateSetting(containerEl);
		this.addDirectoriesSetting(containerEl);
		this.addEnableOnSaveSetting(containerEl);
	}

	private addHeadingNameSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Heading name")
			.setDesc(
				"The heading to search for, without the hash sign (e.g., 'Attendees')"
			)
			.addText((text) =>
				text
					.setPlaceholder("Attendees")
					.setValue(this.settingsManager.settings.heading)
					.onChange(async (value) => {
						this.settingsManager.settings.heading = value;
						await this.settingsManager.saveSettings();
					})
			);
	}

	private addFrontmatterPropertySetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Frontmatter property")
			.setDesc("The YAML property to update (e.g., 'people')")
			.addText((text) =>
				text
					.setPlaceholder("people")
					.setValue(this.settingsManager.settings.property)
					.onChange(async (value) => {
						this.settingsManager.settings.property = value;
						await this.settingsManager.saveSettings();
					})
			);
	}

	private addTemplateSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Template string")
			.setDesc(
				"Template to use in property for each name extracted ({name} will be replaced with the extracted name)"
			)
			.addText((text) =>
				text
					.setPlaceholder("[[People/{name}|{name}]]")
					.setValue(this.settingsManager.settings.template)
					.onChange(async (value) => {
						this.settingsManager.settings.template = value;
						await this.settingsManager.saveSettings();
					})
			);
	}

	private addDirectoriesSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Target directories")
			.setDesc(
				"Comma-separated list of directories to allow extraction from (leave blank for all)"
			)
			.addText((text) =>
				text
					.setPlaceholder("Meetings,Projects")
					.setValue(
						this.settingsManager.settings.directories.join(",")
					)
					.onChange(async (value) => {
						this.settingsManager.settings.directories = value
							.split(",")
							.map((s) => s.trim())
							.filter((s) => s.length > 0);
						await this.settingsManager.saveSettings();
					})
			);
	}

	private addEnableOnSaveSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Enable on save")
			.setDesc("Automatically extract attendees on file save")
			.addToggle((toggle) =>
				toggle
					.setValue(this.settingsManager.settings.enableOnSave)
					.onChange(async (value) => {
						this.settingsManager.settings.enableOnSave = value;
						await this.settingsManager.saveSettings();
						await this.settingsManager.onSettingChange();
					})
			);
	}
}