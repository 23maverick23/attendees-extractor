import { AttendeesExtractorSettings } from './types';

export const DEFAULT_SETTINGS: AttendeesExtractorSettings = {
  heading: "Attendees",
  property: "people",
  template: "[[People/{name}|{name}]]",
  directories: [],
  enableOnSave: false,
  showNotifications: true,
  debugMode: false,
  enableAutocomplete: true,
  autocompleteTrigger: "@",
  peopleDirectory: "People",
};

export const PLUGIN_COMMANDS = {
  EXTRACT_ATTENDEES: "extract-attendees",
  EXTRACT_ATTENDEES_BULK: "extract-attendees-bulk",
} as const;