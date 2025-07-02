import { AttendeesExtractorSettings } from './types';

export const DEFAULT_SETTINGS: AttendeesExtractorSettings = {
  heading: "Attendees",
  property: "people",
  template: "[[People/{name}|{name}]]",
  directories: [],
  enableOnSave: false,
};

export const PLUGIN_COMMANDS = {
  EXTRACT_ATTENDEES: "extract-attendees",
  EXTRACT_ATTENDEES_BULK: "extract-attendees-bulk",
} as const;