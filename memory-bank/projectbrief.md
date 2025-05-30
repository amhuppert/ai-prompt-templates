# AI Prompt Templates CLI

## Project Overview

A command line application that generates AI prompts from templates using TypeScript, commander.js for CLI interface, and Handlebars for templating.

## Core Requirements

### Technology Stack

- **TypeScript**: For type safety and development experience
- **commander.js**: CLI framework for handling commands and arguments
- **Handlebars**: Template engine for prompt generation
- **Direct TypeScript execution**: No compilation step required (using Bun/Deno or similar runtime)

### Architecture

- Templates stored in configurable directory (environment variable `AI_PROMPTS_TEMPLATES_DIR` or default `src/templates/`)
- Each template file exports string as default export
- Hard-coded template approach (no external template loading)
- Type-safe template system

### Key Features

- Command line interface for prompt generation
- Template-based prompt creation
- Configurable templates directory via environment variable
- Type safety throughout the application
- Fast execution without compilation overhead
- Extensible template system

## Success Criteria

- CLI tool that can generate prompts from templates
- Type-safe implementation
- Fast startup and execution
- Clean, maintainable codebase
- Ready for immediate execution without build process
- Configurable template storage location

## Constraints

- Must prioritize type safety
- Must use specified technology stack
- Templates must be hard-coded in separate files
- No external dependencies for template loading
- Backward compatibility with default `src/templates` location
