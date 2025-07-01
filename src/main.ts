// This file is intended for use in the Obsidian plugin environment, where the 'obsidian' module and plugin APIs are available.
import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, MarkdownView, Editor } from "obsidian";

interface AttendeesExtractorSettings {
  heading: string;
  property: string;
  template: string;
  enableOnSave: boolean;
  directories: string[];
  showGutterMarkers: boolean;
}

const DEFAULT_SETTINGS: AttendeesExtractorSettings = {
  heading: "Attendees",
  property: "people",
  template: "[[People/{name}|{name}]]",
  enableOnSave: false,
  directories: [],
  showGutterMarkers: true,
};

export default class AttendeesExtractorPlugin extends Plugin {
  settings: AttendeesExtractorSettings;
  private originalSaveCallback: any = null;
  private statusBarItem: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();
    this.addCommand({
      id: "extract-attendees",
      name: "Extract Attendees to Frontmatter",
      callback: () => this.extractAttendees(),
    });
    this.addCommand({
      id: "extract-attendees-bulk",
      name: "Extract Attendees from All Files",
      callback: () => this.extractAttendeesBulk(),
    });
    this.addSettingTab(new AttendeesExtractorSettingTab(this.app, this));
    if (this.settings.enableOnSave) {
      this.setupSaveInterceptor();
    }
  }

  private setupSaveInterceptor() {
    const saveCommand = (this.app as any).commands.commands['editor:save-file'];
    if (!saveCommand) return;
    if (!this.originalSaveCallback) {
      this.originalSaveCallback = saveCommand.checkCallback;
      saveCommand.checkCallback = (checking: boolean) => {
        if (checking) {
          return this.originalSaveCallback(checking);
        } else {
          this.originalSaveCallback(checking);
          if (this.settings.enableOnSave) {
            const file = this.app.workspace.getActiveFile();
            if (file && file.extension === "md" && this.isFileInAllowedDirectories(file)) {
              this.extractAttendees(file);
            }
          }
        }
      };
    }
  }

  private removeSaveInterceptor() {
    const saveCommand = (this.app as any).commands.commands['editor:save-file'];
    if (saveCommand && this.originalSaveCallback) {
      saveCommand.checkCallback = this.originalSaveCallback;
      this.originalSaveCallback = null;
    }
  }

  async onSettingChange() {
    if (this.settings.enableOnSave) {
      this.setupSaveInterceptor();
    } else {
      this.removeSaveInterceptor();
    }
  }

  async onunload() {
    this.removeSaveInterceptor();
  }

  async extractAttendees(file?: TFile) {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || targetFile.extension !== "md") {
      new Notice("Please open a markdown file");
      return;
    }
    if (!this.isFileInAllowedDirectories(targetFile)) {
      return;
    }
    try {
      const content = await this.app.vault.read(targetFile);
      const attendees = this.extractAttendeesFromContent(content);
      if (attendees.length > 0) {
        await this.updateFrontmatter(targetFile, attendees);
        new Notice(`Updated ${attendees.length} attendees in frontmatter`);
      } else {
        new Notice("No attendees found");
      }
    } catch (error) {
      new Notice("Error processing file: " + error.message);
    }
  }

  async extractAttendeesBulk() {
    const files = this.app.vault.getMarkdownFiles().filter(file =>
      this.isFileInAllowedDirectories(file)
    );
    if (files.length === 0) {
      new Notice("No files found in allowed directories");
      return;
    }
    // Create status bar item
    if (!this.statusBarItem) {
      this.statusBarItem = this.addStatusBarItem();
    }
    const property = this.settings.property;
    const heading = this.settings.heading;
    let processedCount = 0;
    let updatedCount = 0;
    for (const [i, file] of files.entries()) {
      try {
        const content = await this.app.vault.read(file);
        const attendees = this.extractAttendeesFromContent(content);
        if (attendees.length > 0) {
          await this.updateFrontmatter(file, attendees);
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

  private isFileInAllowedDirectories(file: TFile): boolean {
    if (this.settings.directories.length === 0) {
      return true;
    }
    const filePath = file.path;
    return this.settings.directories.some(dir =>
      filePath.startsWith(dir + "/") || filePath === dir
    );
  }

  private extractAttendeesFromContent(content: string): string[] {
    const lines = content.split('\n');
    const attendees: string[] = [];
    let inAttendeesSection = false;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        const headingText = trimmedLine.replace(/^#+\s*/, '').trim();
        if (headingText.toLowerCase() === this.settings.heading.toLowerCase()) {
          inAttendeesSection = true;
          continue;
        } else if (inAttendeesSection && trimmedLine.startsWith('#')) {
          break;
        }
      }
      if (inAttendeesSection && /^[-*+]\s/.test(trimmedLine)) {
        const attendeeName = this.extractNameFromBulletPoint(trimmedLine);
        if (attendeeName) {
          const templatedName = this.settings.template.replaceAll('{name}', attendeeName);
          attendees.push(templatedName);
        }
      }
    }
    return attendees;
  }

  private extractNameFromBulletPoint(line: string): string | null {
    let name = line.replace(/^[-*+]\s*/, '').trim();
    const match = name.match(/^([\w\s]+?)(?:\s*[->-]\s*|$)/);
    if (match) {
      return match[1].trim();
    }
    return name || null;
  }

  private async updateFrontmatter(file: TFile, attendees: string[]) {
    const content = await this.app.vault.read(file);
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);
    let newFrontmatter: string;
    let newContent: string;
    if (match) {
      const existingFrontmatter = match[1];
      newFrontmatter = this.updateYamlProperty(existingFrontmatter, attendees);
      newContent = content.replace(match[0], `---\n${newFrontmatter}\n---\n`);
    } else {
      newFrontmatter = this.createYamlProperty(attendees);
      newContent = `---\n${newFrontmatter}\n---\n\n${content}`;
    }
    await this.app.vault.modify(file, newContent);
  }

  private updateYamlProperty(existingYaml: string, attendees: string[]): string {
    const lines = existingYaml.split('\n');
    const propertyName = this.settings.property;
    let propertyFound = false;
    let newLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith(propertyName + ':')) {
        propertyFound = true;
        newLines.push(`${propertyName}:`);
        attendees.forEach(attendee => {
          newLines.push(`  - "${attendee}"`);
        });
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
          i++;
        }
      } else {
        newLines.push(line);
      }
    }
    if (!propertyFound) {
      newLines.push(`${propertyName}:`);
      attendees.forEach(attendee => {
        newLines.push(`  - "${attendee}"`);
      });
    }
    return newLines.join('\n');
  }

  private createYamlProperty(attendees: string[]): string {
    const lines = [`${this.settings.property}:`];
    attendees.forEach(attendee => {
      lines.push(`  - "${attendee}"`);
    });
    return lines.join('\n');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class AttendeesExtractorSettingTab extends PluginSettingTab {
  plugin: AttendeesExtractorPlugin;

  constructor(app: App, plugin: AttendeesExtractorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Attendees Extractor Settings" });

    new Setting(containerEl)
      .setName("Heading Name")
      .setDesc("The heading to search for (e.g., 'Attendees')")
      .addText((text) =>
        text
          .setPlaceholder("Attendees")
          .setValue(this.plugin.settings.heading)
          .onChange(async (value) => {
            this.plugin.settings.heading = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Frontmatter Property")
      .setDesc("The YAML property to update (e.g., 'people')")
      .addText((text) =>
        text
          .setPlaceholder("people")
          .setValue(this.plugin.settings.property)
          .onChange(async (value) => {
            this.plugin.settings.property = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Template String")
      .setDesc("Template for each name (use {name} as placeholder)")
      .addText((text) =>
        text
          .setPlaceholder("[[People/{name}|{name}]]")
          .setValue(this.plugin.settings.template)
          .onChange(async (value) => {
            this.plugin.settings.template = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Enable on Save")
      .setDesc("Automatically update on file save")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableOnSave)
          .onChange(async (value) => {
            this.plugin.settings.enableOnSave = value;
            await this.plugin.saveSettings();
            await this.plugin.onSettingChange();
          })
      );

    new Setting(containerEl)
      .setName("Show Sync Indicators")
      .setDesc("Show sync status indicators next to attendee lines")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showGutterMarkers)
          .onChange(async (value) => {
            this.plugin.settings.showGutterMarkers = value;
            await this.plugin.saveSettings();
            await this.plugin.onSettingChange();
          })
      );

    new Setting(containerEl)
      .setName("Target Directories")
      .setDesc("Comma-separated list of directories to run in (leave blank for all)")
      .addText((text) =>
        text
          .setPlaceholder("Meetings,Projects")
          .setValue(this.plugin.settings.directories.join(","))
          .onChange(async (value) => {
            this.plugin.settings.directories = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          })
      );
  }
}