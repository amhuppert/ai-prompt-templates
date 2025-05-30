import { resolve } from "path";
import { access, constants } from "fs/promises";

/**
 * Application configuration interface
 */
export interface AppConfig {
  /** Directory where templates are stored */
  templatesDirectory: string;
}

/**
 * Get the templates directory from environment variable or default
 *
 * @returns Absolute path to templates directory
 */
export function getTemplatesDirectory(): string {
  const envDir = process.env.AI_PROMPTS_TEMPLATES_DIR;
  const templatesDir = envDir || "src/templates";

  // Always return absolute path for consistency
  return resolve(templatesDir);
}

/**
 * Get complete application configuration
 *
 * @returns Application configuration object
 */
export function getAppConfig(): AppConfig {
  return {
    templatesDirectory: getTemplatesDirectory(),
  };
}

/**
 * Validate that a templates directory exists and is readable
 *
 * @param dir Directory path to validate
 * @returns Promise resolving to true if directory is valid
 */
export async function validateTemplatesDirectory(
  dir: string
): Promise<boolean> {
  try {
    // Check if directory exists and is readable
    await access(dir, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user-friendly description of templates directory source
 *
 * @returns Description of where the templates directory is configured
 */
export function getTemplatesDirectorySource(): string {
  const envDir = process.env.AI_PROMPTS_TEMPLATES_DIR;
  if (envDir) {
    return `environment variable AI_PROMPTS_TEMPLATES_DIR="${envDir}"`;
  }
  return "default location";
}
