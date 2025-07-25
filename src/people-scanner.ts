import { App, TFile } from "obsidian";
import { AttendeesExtractorSettings } from './types';

export interface PersonSuggestion {
  name: string;
  file: TFile;
  aliases?: string[];
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
          const aliases = await this.extractAliases(file);
          people.push({ name, file, aliases });
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
      if (nameWords.some(word => word.startsWith(lowercaseQuery))) {
        return true;
      }
      
      // Match against aliases
      if (person.aliases && person.aliases.length > 0) {
        return person.aliases.some(alias => {
          const lowercaseAlias = alias.toLowerCase();
          // Check if alias contains the query or starts with it
          if (lowercaseAlias.includes(lowercaseQuery)) {
            return true;
          }
          // Also check individual words in multi-word aliases
          const aliasWords = lowercaseAlias.split(/\s+/);
          return aliasWords.some(word => word.startsWith(lowercaseQuery));
        });
      }
      
      return false;
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

  private async extractAliases(file: TFile): Promise<string[]> {
    try {
      const cache = this.app.metadataCache.getFileCache(file);
      const frontmatter = cache?.frontmatter;
      
      if (frontmatter && frontmatter.aliases) {
        const aliases = frontmatter.aliases;
        if (Array.isArray(aliases)) {
          return aliases.filter(alias => typeof alias === 'string' && alias.trim().length > 0);
        } else if (typeof aliases === 'string') {
          return [aliases.trim()].filter(alias => alias.length > 0);
        }
      }
      
      return [];
    } catch (error) {
      console.warn(`Failed to extract aliases from ${file.path}:`, error);
      return [];
    }
  }
}