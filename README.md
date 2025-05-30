# AI Prompt Templates CLI

A command line tool for generating AI prompts from reusable templates using TypeScript, Handlebars, and interactive parameter collection.

## Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

```

## Usage

### List Available Templates

```bash
bun run cli list
```

### Generate Prompt from Template

```bash
bun run cli generate code-review
# CLI will interactively prompt for required parameters
```

### Save Generated Prompt to File

```bash
bun run cli generate bug-report --output prompt.txt
```

## Creating Templates

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

## Installing

```bash
# Build first
bun run build

bun link

# Now script is available globally
ai-prompts list
```
