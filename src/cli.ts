#!/usr/bin/env bun

import { Command } from "commander";
import {
  discoverTemplates,
  getTemplate,
  getTemplateNames,
} from "./utils/template-discovery.js";
import { collectParameters } from "./utils/parameter-collection.js";
import { generatePrompt } from "./utils/template-generation.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const program = new Command();

program
  .name("ai-prompts")
  .description("CLI tool for generating AI prompts from templates")
  .version("1.0.0");

// List templates command
program
  .command("list")
  .alias("ls")
  .description("List all available prompt templates")
  .action(async () => {
    try {
      const result = await discoverTemplates();

      if (result.errors.length > 0) {
        console.error("❌ Template discovery errors:");
        result.errors.forEach((error) => {
          console.error(`  - ${error.filePath}: ${error.message}`);
        });
        console.log(); // Add spacing
      }

      const templateNames = getTemplateNames(result.templates);
      if (templateNames.length === 0) {
        console.log("📭 No templates found in src/templates/");
        return;
      }

      console.log(
        `📝 Found ${templateNames.length} template${
          templateNames.length === 1 ? "" : "s"
        }:\n`
      );

      for (const templateName of templateNames) {
        const template = getTemplate(result.templates, templateName);
        if (!template) continue;

        const config = template.config;
        const parameterCount = Object.keys(config.parameters).length;
        const requiredParams = Object.values(config.parameters).filter(
          (p) => p.required
        );
        const optionalParams = Object.values(config.parameters).filter(
          (p) => !p.required
        );

        console.log(`🎯 ${config.name}`);
        console.log(`   ${config.description}`);
        console.log(
          `   Parameters: ${parameterCount} total (${requiredParams.length} required, ${optionalParams.length} optional)`
        );

        console.log();
      }
    } catch (error) {
      console.error(
        "❌ Failed to discover templates:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

// Generate prompt command
program
  .command("generate")
  .alias("gen")
  .description("Generate a prompt from a template")
  .argument("<template-name>", "Name of the template to use")
  .option(
    "-o, --output <file>",
    "Save output to file instead of printing to console"
  )
  .option(
    "--no-interactive",
    "Skip interactive parameter collection (use defaults only)"
  )
  .action(
    async (
      templateName: string,
      options: { output?: string; interactive: boolean }
    ) => {
      try {
        // Discover and load the template
        const result = await discoverTemplates();
        const template = getTemplate(result.templates, templateName);

        if (!template) {
          const available = getTemplateNames(result.templates);
          console.error(`❌ Template '${templateName}' not found.`);
          if (available.length > 0) {
            console.error(`   Available templates: ${available.join(", ")}`);
          } else {
            console.error("   No templates are currently available.");
          }
          process.exit(1);
        }

        console.log(`🎯 Using template: ${template.config.name}`);
        console.log(`📝 ${template.config.description}\n`);

        // Collect parameters
        let parameters: Record<string, any> = {};

        if (
          options.interactive &&
          Object.keys(template.config.parameters).length > 0
        ) {
          console.log("📋 Collecting parameters...\n");
          const collectionResult = await collectParameters(template.config, {
            showDescriptions: true,
            useColors: true,
          });

          if (!collectionResult.success) {
            console.error(
              `❌ Parameter collection failed: ${collectionResult.error}`
            );
            process.exit(1);
          }

          parameters = collectionResult.parameters;
          console.log(); // Add spacing after parameter collection
        } else if (
          Object.values(template.config.parameters).some((p) => p.required)
        ) {
          // Check if we have required parameters but no interactive mode
          const requiredParams = Object.entries(template.config.parameters)
            .filter(([, p]) => p.required)
            .map(([name]) => name);
          console.error(
            `❌ Template requires ${requiredParams.length} parameter(s), but interactive mode is disabled.`
          );
          console.error("   Required parameters:", requiredParams.join(", "));
          console.error(
            "   Use without --no-interactive flag to provide parameters interactively."
          );
          process.exit(1);
        }

        // Generate the prompt
        console.log("⚡ Generating prompt...");
        const generationResult = await generatePrompt(
          template.config,
          parameters
        );

        if (!generationResult.success) {
          console.error(
            `❌ Prompt generation failed: ${generationResult.error}`
          );
          process.exit(1);
        }

        // Output the result
        if (options.output) {
          const outputPath = join(process.cwd(), options.output);
          await writeFile(outputPath, generationResult.output, "utf-8");
          console.log(`✅ Prompt saved to: ${outputPath}`);
          console.log(
            `📊 Length: ${generationResult.output.length} characters`
          );
        } else {
          console.log("\n" + "=".repeat(60));
          console.log("📄 GENERATED PROMPT");
          console.log("=".repeat(60) + "\n");
          console.log(generationResult.output);
          console.log("\n" + "=".repeat(60));
          console.log(
            `📊 Length: ${generationResult.output.length} characters`
          );
        }
      } catch (error) {
        console.error(
          "❌ Failed to generate prompt:",
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  );

// Show template details command
program
  .command("info")
  .description("Show detailed information about a template")
  .argument("<template-name>", "Name of the template to inspect")
  .action(async (templateName: string) => {
    try {
      const result = await discoverTemplates();
      const template = getTemplate(result.templates, templateName);

      if (!template) {
        const available = getTemplateNames(result.templates);
        console.error(`❌ Template '${templateName}' not found.`);
        if (available.length > 0) {
          console.error(`   Available templates: ${available.join(", ")}`);
        }
        process.exit(1);
      }

      const config = template.config;
      console.log(`🎯 Template: ${config.name}`);
      console.log(`📝 Description: ${config.description}\n`);

      const parameterEntries = Object.entries(config.parameters);
      if (parameterEntries.length > 0) {
        console.log("📋 Parameters:");
        parameterEntries.forEach(([name, param]) => {
          const required = param.required ? "(required)" : "(optional)";
          const defaultValue = param.defaultValue
            ? ` [default: ${param.defaultValue}]`
            : "";
          console.log(
            `   • ${name} (${param.type}) ${required}${defaultValue}`
          );
          if (param.description) {
            console.log(`     ${param.description}`);
          }
          console.log();
        });
      } else {
        console.log("📋 Parameters: None\n");
      }
    } catch (error) {
      console.error(
        "❌ Failed to get template info:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

// Enhanced help
program.on("--help", () => {
  console.log("");
  console.log("Examples:");
  console.log(
    "  $ ai-prompts list                    # List all available templates"
  );
  console.log("  $ ai-prompts info code-review        # Show template details");
  console.log(
    "  $ ai-prompts generate code-review    # Generate prompt interactively"
  );
  console.log("  $ ai-prompts gen code-review -o prompt.txt  # Save to file");
  console.log("");
});

// Parse arguments and execute
program.parse();
