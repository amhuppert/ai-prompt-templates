import inquirer, { Question, QuestionCollection } from "inquirer";
import {
  TemplateConfig,
  ParameterConfig,
  ParameterValidationError,
} from "@/types";

/**
 * Collected parameter values from user input
 */
export interface CollectedParameters {
  [parameterName: string]: string | number | boolean;
}

/**
 * Options for parameter collection
 */
export interface CollectionOptions {
  /** Whether to show parameter descriptions */
  showDescriptions?: boolean;
  /** Whether to use colors in prompts */
  useColors?: boolean;
  /** Custom prefix for prompts */
  promptPrefix?: string;
}

/**
 * Result of parameter collection operation
 */
export interface CollectionResult {
  /** Successfully collected parameters */
  parameters: CollectedParameters;
  /** Whether collection was completed successfully */
  success: boolean;
  /** Error message if collection failed */
  error?: string;
}

/**
 * Collect parameters for a template using interactive prompts
 *
 * @param templateConfig Template configuration containing parameter definitions
 * @param options Collection options for customizing the experience
 * @returns Promise resolving to collected parameters
 */
export async function collectParameters(
  templateConfig: TemplateConfig,
  options: CollectionOptions = {}
): Promise<CollectionResult> {
  const {
    showDescriptions = true,
    useColors = true,
    promptPrefix = "",
  } = options;

  try {
    console.log(
      `\n🎯 Collecting parameters for template: ${templateConfig.name}`
    );
    if (showDescriptions && templateConfig.description) {
      console.log(`📝 ${templateConfig.description}\n`);
    }

    const parameterEntries = Object.entries(templateConfig.parameters);

    if (parameterEntries.length === 0) {
      console.log("✅ No parameters required for this template.\n");
      return {
        parameters: {},
        success: true,
      };
    }

    const prompts = createPromptsFromParameters(parameterEntries, {
      showDescriptions,
      useColors,
      promptPrefix,
    });

    // Collect all parameters using inquirer
    const rawAnswers = await inquirer.prompt(prompts);

    // Validate and convert parameter types
    const parameters = await validateAndConvertParameters(
      rawAnswers,
      templateConfig.parameters
    );

    console.log("✅ Parameter collection completed successfully!\n");

    return {
      parameters,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`❌ Parameter collection failed: ${errorMessage}\n`);

    return {
      parameters: {},
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Create inquirer prompts from parameter configurations
 *
 * @param parameterEntries Array of [name, config] parameter entries
 * @param options Prompt creation options
 * @returns Array of inquirer prompt configurations
 */
function createPromptsFromParameters(
  parameterEntries: [string, ParameterConfig][],
  options: {
    showDescriptions: boolean;
    useColors: boolean;
    promptPrefix: string;
  }
): QuestionCollection[] {
  return parameterEntries.map(([paramName, paramConfig]) => {
    const { description, required, defaultValue, type } = paramConfig;

    // Build prompt message
    let message = `${options.promptPrefix}${paramName}`;

    if (options.showDescriptions && description) {
      message += ` (${description})`;
    }

    if (!required && defaultValue !== undefined) {
      message += ` [${defaultValue}]`;
    }

    message += required ? " *" : "";

    // Create base prompt configuration
    const basePrompt: Question = {
      name: paramName,
      message,
      validate: createValidator(paramName, paramConfig),
    };

    // Configure prompt type based on parameter type
    switch (type) {
      case "boolean":
        return {
          ...basePrompt,
          type: "confirm",
          default:
            defaultValue !== undefined ? defaultValue === "true" : undefined,
        };

      case "number":
        return {
          ...basePrompt,
          type: "input",
          default: defaultValue,
          filter: (input: string) => {
            if (input.trim() === "" && defaultValue !== undefined) {
              return defaultValue;
            }
            return input;
          },
        };

      case "string":
      default:
        return {
          ...basePrompt,
          type: "input",
          default: defaultValue,
        };
    }
  });
}

/**
 * Create a validator function for a parameter
 *
 * @param paramName Name of the parameter
 * @param paramConfig Parameter configuration
 * @returns Validation function for inquirer
 */
function createValidator(
  paramName: string,
  paramConfig: ParameterConfig
): (input: any) => boolean | string {
  return (input: any): boolean | string => {
    try {
      validateParameterValue(paramName, input, paramConfig);
      return true;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  };
}

/**
 * Validate a single parameter value against its configuration
 *
 * @param paramName Name of the parameter
 * @param value Value to validate
 * @param config Parameter configuration
 * @throws ParameterValidationError if validation fails
 */
function validateParameterValue(
  paramName: string,
  value: any,
  config: ParameterConfig
): void {
  const { required, type } = config;

  // Check if required parameter is provided
  if (required && (value === "" || value === null || value === undefined)) {
    throw new ParameterValidationError(
      `Parameter '${paramName}' is required`,
      paramName
    );
  }

  // Skip validation for empty optional parameters
  if (!required && (value === "" || value === null || value === undefined)) {
    return;
  }

  // Validate parameter type
  switch (type) {
    case "string":
      if (typeof value !== "string") {
        throw new ParameterValidationError(
          `Parameter '${paramName}' must be a string`,
          paramName
        );
      }
      break;

    case "number":
      const numValue = Number(value);
      if (isNaN(numValue)) {
        throw new ParameterValidationError(
          `Parameter '${paramName}' must be a valid number`,
          paramName
        );
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        throw new ParameterValidationError(
          `Parameter '${paramName}' must be a boolean`,
          paramName
        );
      }
      break;

    default:
      throw new ParameterValidationError(
        `Parameter '${paramName}' has unsupported type: ${type}`,
        paramName
      );
  }
}

/**
 * Validate and convert all collected parameters to their correct types
 *
 * @param rawAnswers Raw answers from inquirer prompts
 * @param parameterConfigs Parameter configurations for validation
 * @returns Validated and converted parameters
 */
async function validateAndConvertParameters(
  rawAnswers: Record<string, any>,
  parameterConfigs: Record<string, ParameterConfig>
): Promise<CollectedParameters> {
  const parameters: CollectedParameters = {};

  for (const [paramName, paramConfig] of Object.entries(parameterConfigs)) {
    const rawValue = rawAnswers[paramName];
    const { type, defaultValue, required } = paramConfig;

    // Use default value if no input provided for optional parameter
    let finalValue = rawValue;
    if (
      (rawValue === "" || rawValue === undefined) &&
      !required &&
      defaultValue !== undefined
    ) {
      finalValue = defaultValue;
    }

    // Skip empty optional parameters
    if (!required && (finalValue === "" || finalValue === undefined)) {
      continue;
    }

    // Convert value to correct type
    switch (type) {
      case "string":
        parameters[paramName] = String(finalValue);
        break;

      case "number":
        const numValue = Number(finalValue);
        if (isNaN(numValue)) {
          throw new ParameterValidationError(
            `Invalid number value for parameter '${paramName}': ${finalValue}`,
            paramName
          );
        }
        parameters[paramName] = numValue;
        break;

      case "boolean":
        if (typeof finalValue === "boolean") {
          parameters[paramName] = finalValue;
        } else if (typeof finalValue === "string") {
          const boolValue = finalValue.toLowerCase();
          if (
            boolValue === "true" ||
            boolValue === "yes" ||
            boolValue === "1"
          ) {
            parameters[paramName] = true;
          } else if (
            boolValue === "false" ||
            boolValue === "no" ||
            boolValue === "0"
          ) {
            parameters[paramName] = false;
          } else {
            throw new ParameterValidationError(
              `Invalid boolean value for parameter '${paramName}': ${finalValue}`,
              paramName
            );
          }
        } else {
          parameters[paramName] = Boolean(finalValue);
        }
        break;

      default:
        throw new ParameterValidationError(
          `Unsupported parameter type for '${paramName}': ${type}`,
          paramName
        );
    }

    // Final validation of converted value
    validateParameterValue(paramName, parameters[paramName], paramConfig);
  }

  return parameters;
}

/**
 * Display collected parameters in a formatted way
 *
 * @param parameters Collected parameters to display
 * @param templateName Name of the template these parameters are for
 */
export function displayCollectedParameters(
  parameters: CollectedParameters,
  templateName: string
): void {
  console.log(`📋 Collected parameters for template '${templateName}':`);

  if (Object.keys(parameters).length === 0) {
    console.log("  (No parameters)");
    return;
  }

  for (const [name, value] of Object.entries(parameters)) {
    const displayValue =
      typeof value === "string" && value.length > 50
        ? `${value.substring(0, 47)}...`
        : String(value);

    console.log(`  • ${name}: ${displayValue}`);
  }
  console.log("");
}
