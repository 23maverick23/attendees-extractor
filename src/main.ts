import { Plugin, TFile, Notice } from "obsidian";
import { AttendeesExtractorSettings } from './types';
import { DEFAULT_SETTINGS, PLUGIN_COMMANDS } from './constants';
import { AttendeeParser } from './parser';
import { FileUtils } from './file-utils';
import { FrontmatterManager } from './frontmatter-manager';
import { SaveInterceptor } from './save-interceptor';
import { AttendeesExtractorSettingTab, SettingsManager } from './settings';

export default class AttendeesExtractorPlugin extends Plugin implements SettingsManager {
  settings: AttendeesExtractorSettings;
  private parser: AttendeeParser;
  private frontmatterManager: FrontmatterManager;
  private saveInterceptor: SaveInterceptor;
  private statusBarItem: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();
    this.initializeComponents();
    this.registerCommands();
    this.addSettingTab(new AttendeesExtractorSettingTab(this.app, this));

    if (this.settings.enableOnSave) {
      this.saveInterceptor.setup();
    }
  }

  async onunload() {
    this.saveInterceptor.remove();
  }

  async onSettingChange() {
    // Reinitialize components with new settings
    this.initializeComponents();

    if (this.settings.enableOnSave) {
      this.saveInterceptor.setup();
    } else {
      this.saveInterceptor.remove();
    }
  }

  private initializeComponents(): void {
    this.parser = new AttendeeParser(this.settings);
    this.frontmatterManager = new FrontmatterManager(this.app, this.settings);
    this.saveInterceptor = new SaveInterceptor(
      this.app,
      this.settings,
      (file) => this.extractAttendees(file)
    );
  }

  private registerCommands(): void {
    this.addCommand({
      id: PLUGIN_COMMANDS.EXTRACT_ATTENDEES,
      name: "Extract Attendees to Frontmatter",
      callback: () => this.extractAttendees(),
    });

    this.addCommand({
      id: PLUGIN_COMMANDS.EXTRACT_ATTENDEES_BULK,
      name: "Extract Attendees from All Files",
      callback: () => this.extractAttendeesBulk(),
    });
  }

  async extractAttendees(file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();

    if (!FileUtils.isMarkdownFile(targetFile)) {
      new Notice("Please open a markdown file");
      return;
    }

    if (!FileUtils.isFileInAllowedDirectories(targetFile, this.settings)) {
      return;
    }

    try {
      const content = await this.app.vault.read(targetFile);
      const attendees = this.parser.extractFromContent(content);

      if (attendees.length > 0) {
        await this.frontmatterManager.updateFrontmatter(targetFile, attendees);
        new Notice(`Updated ${attendees.length} attendees in frontmatter`);
      } else {
        new Notice("No attendees found");
      }
    } catch (error) {
      console.error('Attendees extraction failed:', error);
      new Notice(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractAttendeesBulk(): Promise<void> {
    const files = this.app.vault.getMarkdownFiles().filter(file =>
      FileUtils.isFileInAllowedDirectories(file, this.settings)
    );

    if (files.length === 0) {
      new Notice("No files found in allowed directories");
      return;
    }

    // Create status bar item
    if (!this.statusBarItem) {
      this.statusBarItem = this.addStatusBarItem();
    }

    const { property, heading } = this.settings;
    let processedCount = 0;
    let updatedCount = 0;

    for (const file of files) {
      try {
        const content = await this.app.vault.read(file);
        const attendees = this.parser.extractFromContent(content);

        if (attendees.length > 0) {
          await this.frontmatterManager.updateFrontmatter(file, attendees);
          updatedCount++;
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing ${file.path}:`, error);
      }

      // Update status bar
      if (this.statusBarItem) {
        this.statusBarItem.setText(
          `Attendees Extractor: Updating ${property} from ${heading}: ${processedCount} / ${files.length}`
        );
      }
    }

    // Remove status bar item after a short delay
    if (this.statusBarItem) {
      this.statusBarItem.setText(
        `Updated ${updatedCount} of ${files.length} files`
      );
      setTimeout(() => {
        this.statusBarItem?.remove();
        this.statusBarItem = null;
      }, 3000);
    }

    new Notice(`Processed ${processedCount} files, updated ${updatedCount} files`);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}