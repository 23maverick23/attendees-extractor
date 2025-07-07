import { App, TFile } from "obsidian";
import { AttendeesExtractorSettings } from "./types";
import { FileUtils } from "./file-utils";

interface ObsidianApp extends App {
	commands: {
		commands: {
			[key: string]: {
				checkCallback?: (checking: boolean) => boolean;
			};
		};
	};
}

export class SaveInterceptor {
	private originalSaveCallback: ((checking: boolean) => boolean) | null =
		null;

	constructor(
		private app: App,
		private settings: AttendeesExtractorSettings,
		private onFileSave: (file: TFile) => void
	) {}

	setup(): void {
		const obsidianApp = this.app as ObsidianApp;
		const saveCommand = obsidianApp.commands.commands["editor:save-file"];
		if (!saveCommand) return;

		if (!this.originalSaveCallback) {
			this.originalSaveCallback = saveCommand.checkCallback || null;
			saveCommand.checkCallback = (checking: boolean) => {
				if (checking) {
					return this.originalSaveCallback
						? this.originalSaveCallback(checking)
						: true;
				} else {
					if (this.originalSaveCallback) {
						this.originalSaveCallback(checking);
					}
					this.handleFileSave();
					return true;
				}
			};
		}
	}

	remove(): void {
		const obsidianApp = this.app as ObsidianApp;
		const saveCommand = obsidianApp.commands.commands["editor:save-file"];
		if (saveCommand && this.originalSaveCallback) {
			saveCommand.checkCallback = this.originalSaveCallback;
			this.originalSaveCallback = null;
		}
	}

	private handleFileSave(): void {
		if (!this.settings.enableOnSave) return;

		const file = this.app.workspace.getActiveFile();
		if (
			FileUtils.isMarkdownFile(file) &&
			FileUtils.isFileInAllowedDirectories(file, this.settings)
		) {
			this.onFileSave(file);
		}
	}
}
