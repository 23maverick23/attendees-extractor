import { App, TFile } from 'obsidian';
import { AttendeesExtractorSettings } from './types';
import { FileUtils } from './file-utils';

export class SaveInterceptor {
  private originalSaveCallback: ((checking: boolean) => boolean) | null = null;

  constructor(
    private app: App,
    private settings: AttendeesExtractorSettings,
    private onFileSave: (file: TFile) => void
  ) {}

  setup(): void {
    const saveCommand = (this.app as any).commands.commands['editor:save-file'];
    if (!saveCommand) return;

    if (!this.originalSaveCallback) {
      this.originalSaveCallback = saveCommand.checkCallback;
      saveCommand.checkCallback = (checking: boolean) => {
        if (checking) {
          return this.originalSaveCallback!(checking);
        } else {
          this.originalSaveCallback!(checking);
          this.handleFileSave();
        }
      };
    }
  }

  remove(): void {
    const saveCommand = (this.app as any).commands.commands['editor:save-file'];
    if (saveCommand && this.originalSaveCallback) {
      saveCommand.checkCallback = this.originalSaveCallback;
      this.originalSaveCallback = null;
    }
  }

  private handleFileSave(): void {
    if (!this.settings.enableOnSave) return;

    const file = this.app.workspace.getActiveFile();
    if (FileUtils.isMarkdownFile(file) && FileUtils.isFileInAllowedDirectories(file, this.settings)) {
      this.onFileSave(file);
    }
  }
}