import Handlebars from "handlebars";
import {
  TemplateConfig,
  TemplateGenerationError,
  ValidationError,
} from "@/types";
import { CollectedParameters } from "./parameter-collection";

/**
 * Template generation context prepared from collected parameters
 */
export interface TemplateContext {
  [key: string]: any;
}

/**
 * Options for template generation
 */
export interface GenerationOptions {
  /** Whether to include helper functions in context */
  includeHelpers?: boolean;
  /** Custom Handlebars helpers to register */
  customHelpers?: Record<string, Handlebars.HelperDelegate>;
  /** Whether to use strict mode (fail on missing properties) */
  strict?: boolean;
  /** Maximum template size to prevent runaway generation */
  maxTemplateSize?: number;
  /** Whether to disable HTML escaping (default: true to preserve special characters like backticks) */
  noEscape?: boolean;
}

/**
 * Result of template generation operation
 */
export interface GenerationResult {
  /** Generated prompt text */
  output: string;
  /** Whether generation was successful */
  success: boolean;
  /** Template context used for generation */
  context: TemplateContext;
  /** Error message if generation failed */
  error?: string;
  /** Generation metadata */
  metadata: {
    templateName: string;
    parametersUsed: string[];
    generationTime: number;
  };
}

/**
 * Template generation engine for compiling and rendering Handlebars templates
 */
export class TemplateGenerator {
  private compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();
  private registeredHelpers = new Set<string>();

  constructor(private options: GenerationOptions = {}) {
    this.setupDefaultHelpers();
  }

  /**
   * Generate a prompt from a template configuration and collected parameters
   *
   * @param templateConfig Template configuration containing the template
   * @param parameters Collected parameters to use in generation
   * @param options Generation options to override defaults
   * @returns Promise resolving to generation result
   */
  async generatePrompt(
    templateConfig: TemplateConfig,
    parameters: CollectedParameters,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };

    try {
      console.log(`🔨 Generating prompt from template: ${templateConfig.name}`);

      // Compile template
      const compiledTemplate = await this.compileTemplate(
        templateConfig,
        mergedOptions
      );

      // Prepare context from parameters
      const context = this.prepareContext(
        parameters,
        templateConfig,
        mergedOptions
      );

      // Register custom helpers if provided
      if (mergedOptions.customHelpers) {
        this.registerCustomHelpers(mergedOptions.customHelpers);
      }

      // Render template
      const output = await this.renderTemplate(
        compiledTemplate,
        context,
        mergedOptions
      );

      const generationTime = Date.now() - startTime;

      console.log(`✅ Prompt generated successfully in ${generationTime}ms\n`);

      return {
        output,
        success: true,
        context,
        metadata: {
          templateName: templateConfig.name,
          parametersUsed: Object.keys(parameters),
          generationTime,
        },
      };
    } catch (error) {
      const generationTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.log(`❌ Template generation failed: ${errorMessage}\n`);

      return {
        output: "",
        success: false,
        context: {},
        error: errorMessage,
        metadata: {
          templateName: templateConfig.name,
          parametersUsed: Object.keys(parameters),
          generationTime,
        },
      };
    }
  }

  /**
   * Compile a Handlebars template from template configuration
   *
   * @param templateConfig Template configuration containing the template
   * @param options Generation options for compilation
   * @returns Compiled Handlebars template delegate
   */
  private async compileTemplate(
    templateConfig: TemplateConfig,
    options: GenerationOptions = {}
  ): Promise<HandlebarsTemplateDelegate> {
    const cacheKey = templateConfig.name;

    // Return cached template if available
    if (this.compiledTemplates.has(cacheKey)) {
      return this.compiledTemplates.get(cacheKey)!;
    }

    try {
      // Validate template content
      if (
        !templateConfig.template ||
        typeof templateConfig.template !== "string"
      ) {
        throw new TemplateGenerationError(
          `Invalid template content in '${templateConfig.name}': template must be a non-empty string`,
          templateConfig.name
        );
      }

      // Check template size limit
      const maxSize = this.options.maxTemplateSize || 100000; // 100KB default
      if (templateConfig.template.length > maxSize) {
        throw new TemplateGenerationError(
          `Template '${templateConfig.name}' is too large: ${templateConfig.template.length} characters (max: ${maxSize})`,
          templateConfig.name
        );
      }

      // Compile template
      const compiledTemplate = Handlebars.compile(templateConfig.template, {
        strict: options.strict || false,
        noEscape: options.noEscape ?? true,
      });

      // Cache compiled template
      this.compiledTemplates.set(cacheKey, compiledTemplate);

      return compiledTemplate;
    } catch (error) {
      if (error instanceof TemplateGenerationError) {
        throw error;
      }

      throw new TemplateGenerationError(
        `Failed to compile template '${templateConfig.name}': ${
          error instanceof Error ? error.message : String(error)
        }`,
        templateConfig.name
      );
    }
  }

  /**
   * Prepare template context from collected parameters
   *
   * @param parameters Collected parameters
   * @param templateConfig Template configuration for context validation
   * @param options Generation options
   * @returns Prepared template context
   */
  private prepareContext(
    parameters: CollectedParameters,
    templateConfig: TemplateConfig,
    options: GenerationOptions
  ): TemplateContext {
    const context: TemplateContext = { ...parameters };

    // Add template metadata to context
    context._template = {
      name: templateConfig.name,
      description: templateConfig.description,
    };

    // Add utility functions if requested
    if (options.includeHelpers !== false) {
      context._utils = {
        formatDate: (date: Date | string) =>
          new Date(date).toLocaleDateString(),
        toUpperCase: (str: string) => String(str).toUpperCase(),
        toLowerCase: (str: string) => String(str).toLowerCase(),
        capitalize: (str: string) => {
          const s = String(str);
          return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        },
        truncate: (str: string, length: number) => {
          const s = String(str);
          return s.length > length ? s.slice(0, length) + "..." : s;
        },
      };
    }

    // Validate that all required parameters are present
    for (const [paramName, paramConfig] of Object.entries(
      templateConfig.parameters
    )) {
      if (paramConfig.required && !(paramName in parameters)) {
        throw new ValidationError(
          `Required parameter '${paramName}' is missing from context`
        );
      }
    }

    return context;
  }

  /**
   * Render a compiled template with context
   *
   * @param compiledTemplate Compiled Handlebars template
   * @param context Template context
   * @param options Generation options
   * @returns Rendered template output
   */
  private async renderTemplate(
    compiledTemplate: HandlebarsTemplateDelegate,
    context: TemplateContext,
    options: GenerationOptions
  ): Promise<string> {
    try {
      const output = compiledTemplate(context);

      // Validate output
      if (typeof output !== "string") {
        throw new TemplateGenerationError(
          "Template rendering produced non-string output",
          context._template?.name || "unknown"
        );
      }

      // Clean up output
      return this.cleanupOutput(output);
    } catch (error) {
      throw new TemplateGenerationError(
        `Template rendering failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        context._template?.name || "unknown"
      );
    }
  }

  /**
   * Clean up template output by removing excessive whitespace
   *
   * @param output Raw template output
   * @returns Cleaned output
   */
  private cleanupOutput(output: string): string {
    return output
      .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive blank lines
      .replace(/^\s+|\s+$/g, "") // Trim leading/trailing whitespace
      .replace(/[ \t]+/g, " "); // Normalize internal whitespace
  }

  /**
   * Register custom Handlebars helpers
   *
   * @param helpers Object containing helper functions
   */
  private registerCustomHelpers(
    helpers: Record<string, Handlebars.HelperDelegate>
  ): void {
    for (const [name, helper] of Object.entries(helpers)) {
      if (!this.registeredHelpers.has(name)) {
        Handlebars.registerHelper(name, helper);
        this.registeredHelpers.add(name);
      }
    }
  }

  /**
   * Set up default Handlebars helpers
   */
  private setupDefaultHelpers(): void {
    const defaultHelpers = {
      // String manipulation helpers
      upper: (str: string) => String(str).toUpperCase(),
      lower: (str: string) => String(str).toLowerCase(),
      capitalize: (str: string) => {
        const s = String(str);
        return s.charAt(0).toUpperCase() + s.slice(1);
      },

      // Conditional helpers
      eq: (a: any, b: any) => a === b,
      ne: (a: any, b: any) => a !== b,
      gt: (a: number, b: number) => a > b,
      lt: (a: number, b: number) => a < b,

      // Utility helpers
      json: (obj: any) => JSON.stringify(obj, null, 2),
      length: (arr: any[] | string) => arr?.length || 0,
      default: (value: any, defaultValue: any) => value || defaultValue,
    };

    this.registerCustomHelpers(defaultHelpers);
  }

  /**
   * Clear compiled template cache
   */
  clearCache(): void {
    this.compiledTemplates.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { cachedTemplates: number; registeredHelpers: number } {
    return {
      cachedTemplates: this.compiledTemplates.size,
      registeredHelpers: this.registeredHelpers.size,
    };
  }
}

/**
 * Default template generator instance
 */
export const templateGenerator = new TemplateGenerator({
  includeHelpers: true,
  strict: false,
  maxTemplateSize: 100000, // 100KB
  noEscape: true, // Disable HTML escaping to preserve backticks and other characters
});

/**
 * Convenience function for generating prompts
 *
 * @param templateConfig Template configuration
 * @param parameters Collected parameters
 * @param options Generation options
 * @returns Promise resolving to generation result
 */
export async function generatePrompt(
  templateConfig: TemplateConfig,
  parameters: CollectedParameters,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  return templateGenerator.generatePrompt(templateConfig, parameters, options);
}

/**
 * Display generated prompt in a formatted way
 *
 * @param result Generation result to display
 */
export function displayGeneratedPrompt(result: GenerationResult): void {
  console.log(`\n🎯 Generated Prompt for '${result.metadata.templateName}':`);
  console.log("═".repeat(60));
  console.log(result.output);
  console.log("═".repeat(60));

  if (result.success) {
    console.log(
      `✅ Generation completed in ${result.metadata.generationTime}ms`
    );
    console.log(
      `📊 Parameters used: ${result.metadata.parametersUsed.join(", ")}`
    );
  } else {
    console.log(`❌ Generation failed: ${result.error}`);
  }

  console.log("");
}
