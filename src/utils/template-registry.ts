import { TemplateDefinition, TemplateNotFoundError } from "@/types";
import {
  discoverTemplates,
  DiscoveryResult,
  TemplateDiscoveryError,
  getTemplate,
  getTemplateNames,
  formatDiscoveryErrors,
} from "./template-discovery";

/**
 * Registry for managing discovered templates
 */
export class TemplateRegistry {
  private templates = new Map<string, TemplateDefinition>();
  private lastDiscovery: DiscoveryResult | null = null;
  private discoveryPromise: Promise<DiscoveryResult> | null = null;

  /**
   * Discover and load all templates from the templates directory
   * Results are cached until refresh() is called
   *
   * @param force Force re-discovery even if templates are already loaded
   * @returns Promise resolving to discovery results
   */
  async discover(force = false): Promise<DiscoveryResult> {
    // Return cached result if available and not forcing refresh
    if (!force && this.lastDiscovery) {
      return this.lastDiscovery;
    }

    // Return existing discovery promise if one is in progress
    if (this.discoveryPromise) {
      return this.discoveryPromise;
    }

    // Start new discovery
    this.discoveryPromise = this._performDiscovery();

    try {
      const result = await this.discoveryPromise;
      this.lastDiscovery = result;
      this.templates = result.templates;
      return result;
    } finally {
      this.discoveryPromise = null;
    }
  }

  /**
   * Perform the actual template discovery
   */
  private async _performDiscovery(): Promise<DiscoveryResult> {
    return discoverTemplates();
  }

  /**
   * Refresh the template registry by re-discovering templates
   *
   * @returns Promise resolving to discovery results
   */
  async refresh(): Promise<DiscoveryResult> {
    this.lastDiscovery = null;
    this.templates.clear();
    return this.discover(true);
  }

  /**
   * Get a template by name
   * Automatically discovers templates if not already loaded
   *
   * @param templateName Name of the template to retrieve
   * @returns Promise resolving to template definition
   * @throws TemplateNotFoundError if template doesn't exist
   */
  async getTemplate(templateName: string): Promise<TemplateDefinition> {
    // Ensure templates are discovered
    await this.discover();

    const template = getTemplate(this.templates, templateName);
    if (!template) {
      const availableTemplates = this.getTemplateNamesSync();
      const suggestion =
        availableTemplates.length > 0
          ? ` Available templates: ${availableTemplates.join(", ")}`
          : " No templates found.";

      throw new TemplateNotFoundError(
        `Template "${templateName}" not found.${suggestion}`
      );
    }

    return template;
  }

  /**
   * Get all available template names
   * Automatically discovers templates if not already loaded
   *
   * @returns Promise resolving to array of template names
   */
  async getTemplateNames(): Promise<string[]> {
    await this.discover();
    return getTemplateNames(this.templates);
  }

  /**
   * Get all available template names synchronously
   * Only returns templates if they have already been discovered
   *
   * @returns Array of template names (empty if not discovered yet)
   */
  getTemplateNamesSync(): string[] {
    return getTemplateNames(this.templates);
  }

  /**
   * Check if a template exists by name
   * Automatically discovers templates if not already loaded
   *
   * @param templateName Name of the template to check
   * @returns Promise resolving to boolean indicating if template exists
   */
  async hasTemplate(templateName: string): Promise<boolean> {
    await this.discover();
    return this.templates.has(templateName);
  }

  /**
   * Get discovery errors from the last discovery operation
   *
   * @returns Array of discovery errors, empty if no discovery performed yet
   */
  getDiscoveryErrors(): TemplateDiscoveryError[] {
    return this.lastDiscovery?.errors ?? [];
  }

  /**
   * Get formatted error message for discovery errors
   *
   * @returns Formatted error message, empty string if no errors
   */
  getFormattedErrors(): string {
    return formatDiscoveryErrors(this.getDiscoveryErrors());
  }

  /**
   * Check if the last discovery had any errors
   *
   * @returns True if there were discovery errors
   */
  hasDiscoveryErrors(): boolean {
    return this.getDiscoveryErrors().length > 0;
  }

  /**
   * Get summary of discovery results
   *
   * @returns Summary object with counts and status
   */
  getDiscoverySummary(): DiscoverySummary {
    if (!this.lastDiscovery) {
      return {
        discovered: false,
        templateCount: 0,
        errorCount: 0,
        hasErrors: false,
      };
    }

    return {
      discovered: true,
      templateCount: this.lastDiscovery.templates.size,
      errorCount: this.lastDiscovery.errors.length,
      hasErrors: this.lastDiscovery.errors.length > 0,
    };
  }
}

/**
 * Summary of template discovery results
 */
export interface DiscoverySummary {
  /** Whether discovery has been performed */
  discovered: boolean;
  /** Number of successfully loaded templates */
  templateCount: number;
  /** Number of errors encountered */
  errorCount: number;
  /** Whether any errors were encountered */
  hasErrors: boolean;
}

/**
 * Global template registry instance
 */
export const templateRegistry = new TemplateRegistry();
