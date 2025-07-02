import { App, TFile } from 'obsidian';
import { AttendeesExtractorSettings } from './types';

export class FrontmatterManager {
  constructor(
    private app: App,
    private settings: AttendeesExtractorSettings
  ) {}

  async updateFrontmatter(file: TFile, attendees: string[]): Promise<void> {
    const content = await this.app.vault.read(file);
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    let newContent: string;

    if (match) {
      const existingFrontmatter = match[1];
      const newFrontmatter = this.updateYamlProperty(existingFrontmatter, attendees);
      newContent = content.replace(match[0], `---\n${newFrontmatter}\n---\n`);
    } else {
      const newFrontmatter = this.createYamlProperty(attendees);
      newContent = `---\n${newFrontmatter}\n---\n\n${content}`;
    }

    await this.app.vault.modify(file, newContent);
  }

  private updateYamlProperty(existingYaml: string, attendees: string[]): string {
    const lines = existingYaml.split('\n');
    const propertyName = this.settings.property;
    let propertyFound = false;
    const newLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith(propertyName + ':')) {
        propertyFound = true;
        newLines.push(`${propertyName}:`);
        attendees.forEach(attendee => {
          newLines.push(`  - "${attendee}"`);
        });

        // Skip existing array items
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
}