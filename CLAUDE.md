# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin that extracts attendee names from markdown headers and updates YAML frontmatter. The plugin targets users who take meeting notes in Obsidian and want to automatically populate frontmatter with templated attendee links.

## Development Commands

- `npm run dev` - Development mode with file watching using esbuild
- `npm run build` - Production build with TypeScript checking and esbuild bundling
- `npm run version` - Update version numbers in manifest.json and versions.json, then stage files for git

## Architecture

The plugin follows a modular architecture with clear separation of concerns:

### Core Components

- **main.ts**: Main plugin class that orchestrates all functionality, handles Obsidian plugin lifecycle
- **parser.ts**: AttendeeParser class that extracts names from markdown content under specified headings
- **frontmatter-manager.ts**: FrontmatterManager handles YAML frontmatter parsing and updates
- **file-utils.ts**: FileUtils provides file validation and directory filtering utilities
- **save-interceptor.ts**: SaveInterceptor enables automatic processing when files are saved
- **settings.ts**: Settings management and UI configuration tab

### Key Data Flow

1. User triggers extraction via command palette or auto-save
2. Parser extracts names from bullet points under configured heading (default: "Attendees")
3. Names are processed through template system (default: `[[People/{name}|{name}]]`)
4. FrontmatterManager updates the specified YAML property (default: "people")

### Plugin Configuration

Settings are stored in `AttendeesExtractorSettings` interface:

- `heading`: Target heading to search for attendees
- `property`: Frontmatter property name to update
- `template`: Template string for formatting names (uses `{name}` placeholder)
- `directories`: Array of allowed directories for processing
- `enableOnSave`: Boolean for auto-processing on file save

## Building and Distribution

The plugin uses esbuild for bundling TypeScript source into `main.js`. The build process:

1. TypeScript compilation with type checking
2. esbuild bundling with Obsidian externals
3. Output to `main.js` for Obsidian plugin loading

Version management uses `version-bump.mjs` to sync versions across `package.json`, `manifest.json`, and `versions.json`.

## Name Extraction Logic

The parser handles various bullet point formats:

- `- Name` → extracts "Name"
- `- Name -> Role` → extracts "Name"
- `- Name - Role` → extracts "Name"
- Extraction stops at first non-word character followed by dash or arrow

## Important Notes

- Plugin is designed for personal workflow and is intentionally opinionated
- No test framework is configured
- Uses Obsidian plugin API extensively
- Directory filtering restricts operation to specified paths only
