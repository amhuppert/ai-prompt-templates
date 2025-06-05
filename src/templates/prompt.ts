import { TemplateConfig } from "@/types";

const template = `\
# Prompt-Template Blueprint for **{{shortDescription}}**

{{#unless reasoning}}
Think step-by-step and expose your chain-of-thought before the final answer to improve reasoning quality.
{{/unless}}

## 🎯 Goal  
Craft a reusable **prompt template** that future users can fill in to generate high-quality prompts that satisfy the output prompt template description. 

Description of the output prompt template:
*{{description}}*.

## 📥 Template Inputs  
List and describe each variable your new template will accept.

## 🛠️ Instructions to the LLM  
1. **Clarify the objective** in one concise sentence.  
2. **Outline the process** the model should follow (analysis → planning → drafting → final output).  
3. **Specify the exact output format.**  
4. **Enforce all constraints** (tone, length, style, tooling, citations, etc.).  
5. **Verification step** – instruct the model to silently check that all requirements are met before responding.  

## ✅ Final Checklist  
End the template with a quick checklist the model should mentally confirm (clarity, completeness, style).

---

*Return **only** the finished prompt template in Markdown—no extra commentary.*
`;

const config: TemplateConfig = {
  name: "prompt",
  description: "Create a prompt for generating a new prompt template",
  template,
  parameters: {
    shortDescription: {
      required: true,
      type: "string",
      description: "a prompt template blueprint for {{shortDescription}}...",
    },
    description: {
      required: true,
      type: "string",
      description:
        "A detailed description of the prompt template to be generated",
    },
    reasoning: {
      required: false,
      type: "boolean",
      description: "Whether the prompt is intended for a reasoning model",
      defaultValue: "false",
    },
  },
};

export default config;
