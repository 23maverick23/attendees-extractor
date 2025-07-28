export interface AttendeesExtractorSettings {
  heading: string;
  property: string;
  template: string;
  directories: string[];
  enableOnSave: boolean;
  showNotifications: boolean;
  // Autocomplete settings
  enableAutocomplete: boolean;
  autocompleteTrigger: string;
  peopleDirectory: string;
}