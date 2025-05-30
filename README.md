# AI Prompt Templates CLI

A command line tool for generating AI prompts from reusable templates using TypeScript, Handlebars, and interactive parameter collection.

## Features

- 🚀 **Fast execution** with Bun runtime (no compilation step)
- 📝 **Template-based prompts** with Handlebars syntax
- 🎯 **Interactive parameter collection** with type validation
- 🔧 **Extensible template system** with standardized configuration
- 💡 **Type-safe** template development with TypeScript
- 📤 **Flexible output** to stdout or file

## Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Make CLI available globally (optional)
bun link
```

## Usage

### List Available Templates

```bash
bun run dev list
```

### Generate Prompt from Template

```bash
bun run dev generate code-review
# CLI will interactively prompt for required parameters
```

### Save Generated Prompt to File

```bash
bun run dev generate bug-report --output prompt.txt
```

## Creating Templates

Templates follow a standardized configuration interface:

```typescript
import { TemplateConfig } from "@/types";

export const myTemplateConfig: TemplateConfig = {
  name: "my-template",
  description: "Description of what this template does",
  template: `
Your Handlebars template here with {{variables}}
{{#if conditionalParam}}
Optional content: {{conditionalParam}}
{{/if}}
`,
  parameters: {
    requiredParam: {
      description: "Description shown to user",
      required: true,
      type: "string",
    },
    optionalParam: {
      description: "Optional parameter with default",
      required: false,
      defaultValue: "default value",
      type: "string",
    },
  },
};

export default myTemplateConfig;
```

## Development

```bash
# Run in development mode
bun run dev

# Type checking
bun run type-check

# Build for production
bun run build
```

## Architecture

- **Templates**: Self-describing with standardized `TemplateConfig` interface
- **Parameters**: Type-safe with required/optional flags and defaults
- **CLI Framework**: Generic - works with any compliant template
- **Runtime**: Bun for fast TypeScript execution without compilation

## Requirements

- Bun >= 1.0.0
- TypeScript support
