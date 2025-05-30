# Product Context

## Why This Exists

Developer productivity tool for generating consistent, well-structured AI prompts from reusable templates. Eliminates the need to manually craft prompts each time, ensuring consistency and saving time.

## Problems It Solves

- **Prompt Inconsistency**: Manual prompt creation leads to varying quality and structure
- **Time Waste**: Recreating similar prompts repeatedly
- **Template Management**: Need for organized, reusable prompt templates
- **Context Injection**: Dynamic data insertion into prompt templates
- **Developer Experience**: Type-safe prompt generation workflow

## How It Should Work

### User Experience

```bash
# List available templates
ai-prompts list

# Generate prompt from template with interactive prompts
ai-prompts generate code-review
# Then CLI prompts:
# Enter file: src/app.ts
# Enter language: typescript
# Enter changes (optional): Added error handling

# Generate prompt and save to file
ai-prompts generate bug-report --output=prompt.txt
# Then CLI prompts for bug report parameters
```

### Interactive Parameter Collection

- CLI guides users through parameter input
- Type-safe prompts based on template parameter interface
- Optional parameters can be skipped
- Clear parameter descriptions and validation
- User-friendly error messages for invalid input

### Template System

- Templates stored as TypeScript files with co-located types
- Handlebars syntax for variable interpolation
- Simple parameter types (string, number, boolean)
- Type-safe parameter validation

### Expected Output

- Clean, formatted prompts ready for AI consumption
- Support for stdout (default) or file output via --output flag
- Context validation and error handling
- Interactive user experience for parameter collection
