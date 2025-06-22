[Read in Korean (한국어로 보기)](PRD.ko.md)

# HelloMoonklabs - Installer for Moonklabs Framework

_Version: 0.1.0_

## Overview

A minimal, `npx`-executable command-line tool to install the Moonklabs project management framework into any project. It provides a structured directory layout and command-line tools for streamlined project management, with a user interface localized in Korean.

## Core Functionality

### Installation Command

The tool is executed via `npx`:

```bash
npx hello-moonklabs
```

### Key Features

1.  **Creates Directory Structure**:

    - Initializes the `.moonklabs/` directory with standardized subdirectories for documents, requirements, sprints, and more.
    - Sets up the `.claude/commands/moonklabs/` directory for custom Claude commands.

2.  **Fetches from GitHub**:

    - Downloads the latest framework files from the `moonklabs/aiwf` repository on GitHub.
    - Specifically, it sources files from the `claude-code/moonklabs/` subdirectory.
    - Installs commands, documentation templates, and the project manifest.

3.  **Handles Existing Installations**:

    - Detects if a Moonklabs framework is already present.
    - Prompts the user to **Update**, **Skip**, or **Cancel**.
    - The update process preserves user-created files (tasks, sprints) while updating command scripts and `CLAUDE.md` documents.
    - Automatically backs up overwritten files with a `.bak` extension.

4.  **Interactive & Localized CLI**:
    - Provides clear, interactive prompts for a smooth user experience.
    - All user-facing communication is in Korean.

## Technical Approach

- **Node.js Script**: A single executable script built with Node.js.
- **Dependencies**: Uses external libraries to enhance the command-line interface:
  - `commander`: For command-line argument parsing.
  - `ora`: To display loading spinners.
  - `prompts`: For interactive user prompts.
  - `chalk`: To add color to console output.
- **GitHub Fetching**: Downloads files directly from the `raw.githubusercontent.com` source, using the GitHub API to list directory contents.

## Installation Flow

1.  A welcome message is displayed (in Korean).
2.  The script checks for an existing installation.
3.  If one exists, it prompts the user to choose an action (Update, Skip, Cancel).
4.  If proceeding, a spinner indicates that files are being fetched from GitHub.
5.  The required directory structure is created.
6.  Framework files (manifest, templates, docs, commands) are downloaded and placed in the correct locations.
7.  A success message is shown with next steps for getting started.
8.  If any step fails, an error message is displayed and existing files are restored from backups if available.

## File Structure Created

```
project-root/
├── .moonklabs/
│   ├── 00_PROJECT_MANIFEST.md
│   ├── 01_PROJECT_DOCS/
│   ├── 02_REQUIREMENTS/
│   │   └── CLAUDE.md
│   ├── 03_SPRINTS/
│   │   └── CLAUDE.md
│   ├── 04_GENERAL_TASKS/
│   │   └── CLAUDE.md
│   ├── 05_ARCHITECTURE_DECISIONS/
│   ├── 10_STATE_OF_PROJECT/
│   └── 99_TEMPLATES/
│       └── ...
└── .claude/
    └── commands/
        └── moonklabs/
            └── (all Moonklabs commands)
```
