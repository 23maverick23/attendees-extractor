import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
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

    const startPos = {
      line: cursor.line,
      ch: cursor.ch - trigger.length,
    };

    // Check if current text starts with trigger
    if (startPos.ch < 0) {
      return null;
    }

    const textBeforeCursor = editor.getRange(startPos, cursor);
    if (!textBeforeCursor.startsWith(trigger)) {
      return null;
    }

    // Prevent triggering within words or after certain characters
    const precedingChar = startPos.ch > 0 ? 
      editor.getRange(
        { line: startPos.line, ch: startPos.ch - 1 },
        startPos
      ) : "";
    
    if (precedingChar && /[a-zA-Z0-9]/.test(precedingChar)) {
      return null;
    }

    // Find the end of the current word (until space, punctuation, or line end)
    let endPos = cursor;
    const line = editor.getLine(cursor.line);
    let ch = cursor.ch;
    
    while (ch < line.length && /[a-zA-Z0-9\-_]/.test(line[ch])) {
      ch++;
    }
    
    endPos = { line: cursor.line, ch };

    return {
      start: startPos,
      end: endPos,
      query: editor.getRange(startPos, endPos).substring(trigger.length),
    };
  }

  getSuggestions(context: EditorSuggestContext): PersonSuggestion[] {
    const query = context.query.toLowerCase();
    
    if (!query) {
      // Return top 10 people when no query
      return this.allPeople.slice(0, 10);
    }

    const filtered = this.peopleScanner.filterPeople(this.allPeople, query);
    
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
  }
}