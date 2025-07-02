import { AttendeesExtractorSettings } from './types';

export class AttendeeParser {
  constructor(private settings: AttendeesExtractorSettings) {}

  /**
   * Extracts attendee names from markdown content
   */
  extractFromContent(content: string): string[] {
    const lines = content.split('\n');
    const attendees: string[] = [];
    let inAttendeesSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (this.isHeading(trimmedLine)) {
        const headingText = this.extractHeadingText(trimmedLine);

        if (this.isTargetHeading(headingText)) {
          inAttendeesSection = true;
          continue;
        } else if (inAttendeesSection) {
          // Found another heading, stop processing
          break;
        }
      }

      if (inAttendeesSection && this.isBulletPoint(trimmedLine)) {
        const attendeeName = this.extractNameFromBulletPoint(trimmedLine);
        if (attendeeName) {
          const templatedName = this.applyTemplate(attendeeName);
          attendees.push(templatedName);
        }
      }
    }

    return attendees;
  }

  private isHeading(line: string): boolean {
    return line.startsWith('#');
  }

  private extractHeadingText(line: string): string {
    return line.replace(/^#+\s*/, '').trim();
  }

  private isTargetHeading(headingText: string): boolean {
    return headingText.toLowerCase() === this.settings.heading.toLowerCase();
  }

  private isBulletPoint(line: string): boolean {
    return /^[-*+]\s/.test(line);
  }

  private extractNameFromBulletPoint(line: string): string | null {
    let name = line.replace(/^[-*+]\s*/, '').trim();
    const match = name.match(/^([\w\s]+?)(?:\s*[->-]\s*|$)/);
    if (match) {
      return match[1].trim();
    }
    return name || null;
  }

  private applyTemplate(name: string): string {
    return this.settings.template.replaceAll('{name}', name);
  }
}