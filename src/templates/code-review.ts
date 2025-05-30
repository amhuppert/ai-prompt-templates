import { TemplateConfig } from "@/types";

export const codeReviewConfig: TemplateConfig = {
  name: "code-review",
  description: "Generate a code review prompt for analyzing code files",
  template: `Please review this {{language}} code file:

**File:** {{file}}

{{#if changes}}
**Recent Changes:** {{changes}}

{{/if}}
Please analyze the code for:
- Code quality and best practices
- Potential bugs or security issues
- Performance considerations
- Maintainability and readability
- Adherence to {{language}} conventions

{{#if focus}}
**Focus Area:** Please pay special attention to {{focus}}
{{/if}}

Provide specific, actionable feedback with code examples where appropriate.`,
  parameters: {
    file: {
      description: "Path to the code file being reviewed",
      required: true,
      type: "string",
    },
    language: {
      description: "Programming language of the code file",
      required: true,
      type: "string",
    },
    changes: {
      description: "Description of recent changes (optional)",
      required: false,
      defaultValue: "",
      type: "string",
    },
    focus: {
      description: "Specific area to focus the review on (optional)",
      required: false,
      defaultValue: "",
      type: "string",
    },
  },
};

export default codeReviewConfig;
