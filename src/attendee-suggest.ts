import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
  KeymapContext,
} from "obsidian";
import { AttendeesExtractorSettings } from './types';
import { PeopleScanner, PersonSuggestion } from './people-scanner';

export class AttendeeSuggest extends EditorSuggest<PersonSuggestion> {
  private peopleScanner: PeopleScanner;
  private allPeople: PersonSuggestion[] = [];

  constructor(app: App, private settings: AttendeesExtractorSettings) {
    super(app);
    this.peopleScanner = new PeopleScanner(app, settings);
    this.initializePeople();
  }


  async initializePeople(): Promise<void> {
    this.allPeople = await this.peopleScanner.getAllPeople();
  }

  async refreshPeople(): Promise<void> {
    await this.initializePeople();
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo | null {
    if (!this.settings.enableAutocomplete) {
      return null;
    }

    const trigger = this.settings.autocompleteTrigger;
    if (!trigger) {
      return null;
    }

    // Get the current line
    const line = editor.getLine(cursor.line);
    
    // Find the trigger character by looking backwards from cursor
    let triggerPos = -1;
    for (let i = cursor.ch - 1; i >= 0; i--) {
      if (line.substring(i, i + trigger.length) === trigger) {
        // Check if there's a word boundary before the trigger
        const precedingChar = i > 0 ? line[i - 1] : "";
        if (!precedingChar || /\s|[^\w]/.test(precedingChar)) {
          triggerPos = i;
          break;
        }
      }
    }

    // No trigger found
    if (triggerPos === -1) {
      return null;
    }

    const startPos = {
      line: cursor.line,
      ch: triggerPos,
    };

    // Find the end of the current word (until space, punctuation, or line end)
    let endPos = cursor;
    let ch = cursor.ch;
    
    while (ch < line.length && /[a-zA-Z0-9\-_\s]/.test(line[ch])) {
      // Stop at space to handle multi-word names properly
      if (line[ch] === ' ' && ch > cursor.ch) {
        break;
      }
      ch++;
    }
    
    endPos = { line: cursor.line, ch };

    const fullText = editor.getRange(startPos, endPos);
    const query = fullText.substring(trigger.length);

    return {
      start: startPos,
      end: endPos,
      query: query,
    };
  }

  getSuggestions(context: EditorSuggestContext): PersonSuggestion[] {
    const query = context.query.toLowerCase();
    
    if (!query) {
      // Return top 10 people when no query
      return this.allPeople.slice(0, 10);
    }

    const filtered = this.peopleScanner.filterPeople(this.allPeople, query);
    
    // If no matches, return a special "create new" suggestion
    if (filtered.length === 0 && query.trim()) {
      return [{
        name: context.query, // Use original query (with proper casing)
        file: null as any, // Special marker for "no match" case
      }];
    }
    
    // Prioritize exact matches and prefix matches
    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match first
      if (aName === query) return -1;
      if (bName === query) return 1;
      
      // Prefix match next
      const aStartsWith = aName.startsWith(query);
      const bStartsWith = bName.startsWith(query);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;
      
      // Alphabetical otherwise
      return aName.localeCompare(bName);
    }).slice(0, 10); // Limit to 10 suggestions
  }

  renderSuggestion(person: PersonSuggestion, el: HTMLElement): void {
    // Handle the "no match" case
    if (!person.file) {
      el.createEl("div", { text: person.name, cls: "suggestion-content" });
      el.createEl("small", { 
        text: "Use as new name (removes @)", 
        cls: "suggestion-note" 
      });
      return;
    }
    
    el.createEl("div", { text: person.name, cls: "suggestion-content" });
    
    // Optionally show file path as secondary info
    if (person.file.path !== `${this.settings.peopleDirectory}/${person.name}.md`) {
      el.createEl("small", { 
        text: person.file.path, 
        cls: "suggestion-note" 
      });
    }
  }

  selectSuggestion(person: PersonSuggestion, evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) {
      return;
    }
    
    const editor = this.context.editor;
    
    // Replace the trigger and query with just the person's name
    editor.replaceRange(person.name, this.context.start, this.context.end);
    
    // Position cursor after the inserted name
    const newCursor = {
      line: this.context.start.line,
      ch: this.context.start.ch + person.name.length,
    };
    editor.setCursor(newCursor);
    
    // Close the suggestion popup
    this.close();
  }
}