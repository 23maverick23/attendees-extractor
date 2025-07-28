import { AttendeesExtractorSettings } from './types';

export class DebugLogger {
  constructor(private settings: AttendeesExtractorSettings, private pluginName: string = 'AttendeesExtractor') {}

  log(message: string, ...args: any[]): void {
    if (this.settings.debugMode) {
      console.log(`[${this.pluginName}] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.settings.debugMode) {
      console.warn(`[${this.pluginName}] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.settings.debugMode) {
      console.error(`[${this.pluginName}] ${message}`, ...args);
    }
  }

  group(label: string): void {
    if (this.settings.debugMode) {
      console.group(`[${this.pluginName}] ${label}`);
    }
  }

  groupEnd(): void {
    if (this.settings.debugMode) {
      console.groupEnd();
    }
  }
}