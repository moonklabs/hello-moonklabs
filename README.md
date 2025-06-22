# hello-moonklabs

This project is an updated version of [Simone](https://github.com/Helmi/claude-simone).

> 🚀 Quick installer for the Moonklabs project management framework for Claude Code

## What is Moonklabs?

Moonklabs is a markdown-based project management framework designed specifically for AI-assisted development with Claude Code. It helps break down software projects into manageable chunks for effective AI handling.

## Installation

Install Moonklabs in any project directory:

```bash
npx hello-moonklabs
```

That's it! The installer will:

- Create the `.moonklabs/` directory structure for project management
- Set up `.claude/commands/moonklabs/` for custom Claude commands
- Download the latest templates and documentation

## Usage

### First Time Installation

```bash
npx hello-moonklabs
```

### Update Existing Installation

If Moonklabs is already installed, the installer will detect it and offer options to:

- Update (with automatic backup)
- Skip installation
- Cancel

### Force Installation

Skip all prompts and force installation:

```bash
npx hello-moonklabs --force
```

## What Gets Installed

```
your-project/
├── .moonklabs/
│   ├── 00_PROJECT_MANIFEST.md      # Project overview
│   ├── 01_PROJECT_DOCS/            # Documentation
│   ├── 02_REQUIREMENTS/            # Requirements & specs
│   ├── 03_SPRINTS/                 # Sprint planning
│   ├── 04_GENERAL_TASKS/           # Task management
│   ├── 05_ARCHITECTURE_DECISIONS/  # ADRs
│   ├── 10_STATE_OF_PROJECT/        # Current state
│   └── 99_TEMPLATES/               # Reusable templates
└── .claude/
    └── commands/
        └── moonklabs/                 # Claude custom commands
```

## Next Steps

After installation:

1. Open your project in Claude Code
2. Use `/project:moonklabs` commands to manage your project
3. Start with `/project:moonklabs:initialize` to set up your project

## Features

- 🎨 Beautiful CLI with colors and progress indicators
- 🔄 Smart update detection with automatic backups
- 📦 Downloads directly from the official GitHub repository
- 🚀 Works with `npx` - no global installation needed
- 💾 Creates timestamped backups when updating

## Requirements

- Node.js 14.0.0 or higher
- Internet connection to download from GitHub

## Source

This installer fetches the Moonklabs framework from:
https://github.com/moonklabs/aiwf

## License

MIT
