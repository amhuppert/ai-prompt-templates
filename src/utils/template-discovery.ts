import { resolve, join, dirname } from "path";
import { readdir, stat } from "fs/promises";
import {
  TemplateDefinition,
  TemplateConfig,
  ValidationError,
  FileSystemError,
  isTemplateConfig,
} from "@/types";
import { getTemplatesDirectory } from "./config";

/**
 * Result of template discovery operation
 */
export interface DiscoveryResult {
  /** Successfully loaded templates indexed by name */
  templates: Map<string, TemplateDefinition>;
  /** Errors encountered during discovery */
  errors: TemplateDiscoveryError[];
}

/**
 * Error that occurred during template discovery
 */
export interface TemplateDiscoveryError {
  /** Path to the file that caused the error */
  filePath: string;
  /** Type of error that occurred */
  type: "load" | "validation" | "file-system";
  /** Error message */
  message: string;
  /** Original error object if available */
  originalError?: Error;
}

/**
 * Options for template discovery
 */
export interface DiscoveryOptions {
  /** Directory to search for templates (default: from AI_PROMPTS_TEMPLATES_DIR env var or src/templates) */
  templatesDir?: string;
  /** File extension to search for (default: .ts) */
  extension?: string;
}

/**
 * Discover and load all templates from the templates directory
 *
 * @param options Discovery options
 * @returns Discovery result with templates and any errors
 */
export async function discoverTemplates(
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const { templatesDir = getTemplatesDirectory(), extension = ".ts" } = options;

  const templates = new Map<string, TemplateDefinition>();
  const errors: TemplateDiscoveryError[] = [];

  try {
    // Get absolute path to templates directory
    const templatesPath = resolve(templatesDir);

    // Find all TypeScript files in the templates directory
    const templateFiles = await findTemplateFiles(templatesPath, extension);

    // Load each template file
    for (const filePath of templateFiles) {
      try {
        const template = await loadTemplate(filePath);
        if (template) {
          templates.set(template.name, template);
        }
      } catch (error) {
        const templateError = createDiscoveryError(filePath, error);
        errors.push(templateError);
      }
    }
  } catch (error) {
    errors.push({
      filePath: templatesDir,
      type: "file-system",
      message: `Failed to access templates directory: ${
        error instanceof Error ? error.message : String(error)
      }`,
      originalError: error instanceof Error ? error : undefined,
    });
  }

  return {
    templates,
    errors,
  };
}

/**
 * Find all template files in the given directory
 *
 * @param dir Directory to search
 * @param extension File extension to look for
 * @returns Array of file paths
 */
async function findTemplateFiles(
  dir: string,
  extension: string
): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findTemplateFiles(filePath, extension);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(filePath);
      }
    }
  } catch (error) {
    throw new FileSystemError(
      `Failed to read directory ${dir}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return files;
}

/**
 * Load and validate a template from a file
 *
 * @param filePath Path to the template file
 * @returns Template definition if valid, null if invalid
 */
async function loadTemplate(
  filePath: string
): Promise<TemplateDefinition | null> {
  try {
    // Use dynamic import to load the template module
    const templateModule = await import(filePath);

    // Extract the default export or look for a config export
    const config = templateModule.default || templateModule.config;

    if (!config) {
      throw new ValidationError(
        "Template file must export a default config or named 'config' export"
      );
    }

    // Validate the template configuration
    if (!isTemplateConfig(config)) {
      throw new ValidationError(
        "Template configuration does not match required structure"
      );
    }

    // Create template definition
    const template: TemplateDefinition = {
      name: config.name,
      config,
      filePath,
    };

    return template;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error(
      `Failed to load template from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Create a discovery error from a caught error
 *
 * @param filePath Path where the error occurred
 * @param error The caught error
 * @returns Formatted discovery error
 */
function createDiscoveryError(
  filePath: string,
  error: unknown
): TemplateDiscoveryError {
  if (error instanceof ValidationError) {
    return {
      filePath,
      type: "validation",
      message: error.message,
      originalError: error,
    };
  }

  if (error instanceof FileSystemError) {
    return {
      filePath,
      type: "file-system",
      message: error.message,
      originalError: error,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    filePath,
    type: "load",
    message: `Failed to load template: ${message}`,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Get a template by name from the templates map
 *
 * @param templates Map of loaded templates
 * @param templateName Name of the template to retrieve
 * @returns Template definition or undefined if not found
 */
export function getTemplate(
  templates: Map<string, TemplateDefinition>,
  templateName: string
): TemplateDefinition | undefined {
  return templates.get(templateName);
}

/**
 * Get all template names from the templates map
 *
 * @param templates Map of loaded templates
 * @returns Array of template names
 */
export function getTemplateNames(
  templates: Map<string, TemplateDefinition>
): string[] {
  return Array.from(templates.keys()).sort();
}

/**
 * Format discovery errors for user display
 *
 * @param errors Array of discovery errors
 * @returns Formatted error message
 */
export function formatDiscoveryErrors(
  errors: TemplateDiscoveryError[]
): string {
  if (errors.length === 0) {
    return "";
  }

  const lines: string[] = [
    `Found ${errors.length} error${
      errors.length === 1 ? "" : "s"
    } while discovering templates:`,
    "",
  ];

  for (const error of errors) {
    lines.push(`• ${error.filePath}`);
    lines.push(`  ${error.type.toUpperCase()}: ${error.message}`);
    lines.push("");
  }

  return lines.join("\n");
}
