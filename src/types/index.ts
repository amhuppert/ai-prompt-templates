/**
 * Core types for the AI Prompt Templates CLI
 */

/** Supported parameter types for template variables */
export type ParameterType = "string" | "number" | "boolean";

/** Configuration for a single template parameter */
export interface ParameterConfig {
  /** Human-readable description shown during parameter collection */
  description: string;
  /** Whether this parameter is required */
  required: boolean;
  /** Default value for optional parameters */
  defaultValue?: string;
  /** Type of the parameter for validation */
  type: ParameterType;
}

/** Complete template configuration */
export interface TemplateConfig {
  /** Unique name used to identify the template */
  name: string;
  /** Human-readable description of what the template does */
  description: string;
  /** Handlebars template string */
  template: string;
  /** Parameter definitions for this template */
  parameters: Record<string, ParameterConfig>;
}

/** Template definition loaded from a file */
export interface TemplateDefinition {
  /** Unique name of the template */
  name: string;
  /** The template configuration */
  config: TemplateConfig;
  /** Path to the template file */
  filePath: string;
}

/** Error thrown when template is not found */
export class TemplateNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateNotFoundError";
  }
}

/** Error thrown when template configuration is invalid */
export class InvalidTemplateConfigError extends Error {
  constructor(message: string, public details?: string[]) {
    super(message);
    this.name = "InvalidTemplateConfigError";
  }
}

/** Error thrown when parameter validation fails */
export class ParameterValidationError extends Error {
  constructor(message: string, public parameterName?: string) {
    super(message);
    this.name = "ParameterValidationError";
  }
}

/** Error thrown when template generation fails */
export class TemplateGenerationError extends Error {
  constructor(message: string, public templateName?: string) {
    super(message);
    this.name = "TemplateGenerationError";
  }
}

/** Error thrown when validation fails */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Error thrown when file system operations fail */
export class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemError";
  }
}

/**
 * Type guard to validate ParameterConfig objects
 */
export function isValidParameterConfig(param: any): param is ParameterConfig {
  return (
    typeof param === "object" &&
    param !== null &&
    typeof param.description === "string" &&
    typeof param.required === "boolean" &&
    ["string", "number", "boolean"].includes(param.type) &&
    (param.defaultValue === undefined || typeof param.defaultValue === "string")
  );
}

/**
 * Type guard to validate TemplateConfig objects
 */
export function isValidTemplateConfig(config: any): config is TemplateConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    typeof config.name === "string" &&
    config.name.length > 0 &&
    typeof config.description === "string" &&
    typeof config.template === "string" &&
    typeof config.parameters === "object" &&
    config.parameters !== null &&
    Object.values(config.parameters).every(isValidParameterConfig)
  );
}

/**
 * Validate a template configuration and return detailed error information
 */
export function validateTemplateConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof config !== "object" || config === null) {
    return { valid: false, errors: ["Config must be an object"] };
  }

  if (typeof config.name !== "string" || config.name.length === 0) {
    errors.push("Config must have a non-empty 'name' string");
  }

  if (typeof config.description !== "string") {
    errors.push("Config must have a 'description' string");
  }

  if (typeof config.template !== "string") {
    errors.push("Config must have a 'template' string");
  }

  if (typeof config.parameters !== "object" || config.parameters === null) {
    errors.push("Config must have a 'parameters' object");
  } else {
    for (const [paramName, paramConfig] of Object.entries(config.parameters)) {
      if (!isValidParameterConfig(paramConfig)) {
        errors.push(`Parameter '${paramName}' is invalid`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard to validate TemplateConfig objects
 * @alias for isValidTemplateConfig for consistency with discovery system
 */
export const isTemplateConfig = isValidTemplateConfig;
