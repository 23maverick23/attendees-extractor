import { App, TFile } from "obsidian";
import { AttendeesExtractorSettings } from './types';

export interface PersonSuggestion {
  name: string;
  file: TFile;
}

export class PeopleScanner {
  constructor(
    private app: App,
    private settings: AttendeesExtractorSettings
  ) {}

  async getAllPeople(): Promise<PersonSuggestion[]> {
    if (!this.settings.peopleDirectory) {
      return [];
    }

    const people: PersonSuggestion[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (this.isPersonFile(file)) {
        const name = this.extractPersonName(file);
        if (name) {
          people.push({ name, file });
        }
      }
    }

    return people.sort((a, b) => a.name.localeCompare(b.name));
  }

  filterPeople(people: PersonSuggestion[], query: string): PersonSuggestion[] {
    if (!query) {
      return people;
    }

    const lowercaseQuery = query.toLowerCase().trim();
    return people.filter(person => {
      const lowercaseName = person.name.toLowerCase();
      
      // Match if name contains the query
      if (lowercaseName.includes(lowercaseQuery)) {
        return true;
      }
      
      // Also match individual words in multi-word names
      const nameWords = lowercaseName.split(/\s+/);
      return nameWords.some(word => word.startsWith(lowercaseQuery));
    });
  }

  private isPersonFile(file: TFile): boolean {
    const peopleDir = this.settings.peopleDirectory;
    if (!peopleDir) {
      return false;
    }

    // Check if file is in the people directory (or subdirectory)
    const normalizedPeopleDir = peopleDir.endsWith('/') ? peopleDir : peopleDir + '/';
    return file.path.startsWith(normalizedPeopleDir) || 
           file.path === peopleDir.replace(/\/$/, '') + '.md';
  }

  private extractPersonName(file: TFile): string {
    // Extract basename without .md extension
    const basename = file.basename;
    
    // Remove common person file prefixes/suffixes if needed
    // For now, just return the basename as-is
    return basename;
  }
}