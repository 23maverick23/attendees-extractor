import { TFile } from 'obsidian';
import { AttendeesExtractorSettings } from './types';

export class FileUtils {
  static isMarkdownFile(file: TFile | null): file is TFile {
    return file !== null && file.extension === "md";
  }

  static isFileInAllowedDirectories(file: TFile, settings: AttendeesExtractorSettings): boolean {
    if (settings.directories.length === 0) {
      return true;
    }

    const filePath = file.path;
    return settings.directories.some(dir =>
      filePath.startsWith(dir + "/") || filePath === dir
    );
  }
}