# Attendees Extractor Plugin

An Obsidian plugin that extracts attendee names from markdown files and updates the YAML frontmatter with templated links.

## Features

- **Automatic Extraction**: Extracts attendee names from a specified heading section
- **Template Support**: Uses customizable templates to format attendee names (e.g., `[[People/{name}|{name}]]`)
- **YAML Frontmatter Integration**: Updates or creates YAML frontmatter properties
- **Directory Filtering**: Restrict plugin operation to specific directories
- **Auto-save Support**: Optionally run extraction automatically when files are saved
- **Bulk Processing**: Process all files in a directory at once
- **Flexible Name Parsing**: Handles various name formats including roles (e.g., "Name -> Role")

## Usage

### Basic Usage

1. Create a markdown file with an "Attendees" section:
   ```markdown
   ---
   categories:
   - "[[Meetings]]"
   tags:
   - meetings
   people: []
   ---
   # Meeting Title

   ## Attendees

   - Ryan Morrissey -> SC Mgr
   - Jane Van Doe -> Ramp
   - John Smith

   ## Meeting Notes

   Your meeting notes here...
   ```

2. Use the command palette (`Ctrl/Cmd + Shift + P`) and run "Extract Attendees to Frontmatter"

3. The frontmatter will be updated:
   ```yaml
   ---
   categories:
   - "[[Meetings]]"
   tags:
   - meetings
   people:
     - "[[People/Ryan Morrissey|Ryan Morrissey]]"
     - "[[People/Jane Van Doe|Jan Van Doe]]"
     - "[[People/John Smith|John Smith]]"
   ---
   ```

### Bulk Processing

Use the "Extract Attendees from All Files" command to process all files in your configured directories at once.

## Settings

### Heading Name
The heading text to search for (default: "Attendees")

### Frontmatter Property
The YAML property name to update (default: "people")

### Template String
Template for formatting each name (default: `[[People/{name}|{name}]]`)
- Use `{name}` as a placeholder for the extracted name

### Enable on Save
Automatically run extraction when files are saved

### Target Directories
Comma-separated list of directories to restrict plugin operation
- Leave blank to allow all directories
- Example: "Meetings,Projects"

## Name Extraction Rules

The plugin extracts names from bullet points under the specified heading:

- **Basic format**: `- Name` → extracts "Name"
- **With role**: `- Name -> Role` → extracts "Name"
- **With dash**: `- Name - Role` → extracts "Name"
- **Multiple words**: `- First Last -> Role` → extracts "First Last"

The extraction stops at the first non-word character followed by a dash or arrow.

## Installation

1. Copy the plugin folder to your Obsidian vault's `.obsidian/plugins/` directory
2. Enable the plugin in Obsidian settings
3. Configure the settings as needed

## Development

This plugin is built with TypeScript and uses the Obsidian plugin API.

### Building

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

### Tracking Changes

There should be an entry for every single version. Versions use semantic numbered tags inside square brackets (e.g. tag v0.0.1 will be represented as `[0.0.1]` in the Changelog), are represented as a second level header, and include the date of the commit in `YYYY-MM-DD` format (e.g. ## `[1.1.1] - 2023-03-05`). There will be a single `[Unreleased]` second level header at the top of the Changelog to track upcoming changes. The latest version always comes first.

Types of changes that are tracked can be chosen from the list below. These are used as level three headers.

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

[CHANGELOG.md](CHANGELOG.md)

## License

[LICENSE](LICENSE)