import { TemplateConfig } from "@/types";

const template = `\
## ❔ Instruction

You are a technical educator.  
Write a **{{audienceLevel}}-friendly** yet **comprehensive** explainer *plus* a quick-scan cheatsheet about the following topic:

<topic>
{{concept}}
</topic>

---

## 🔧 Parameters

| Name | Value | Notes |
|------|----------------------|-------|
| **Audience** | {{audienceLevel}} |  |
| **Tone** | conversational | Friendly but precise |
| **Format** | GitHub-flavored Markdown | U.S. English |
| **Use emojis** | ✅ | Only when they aid scanning |
| **Examples** | yes | Runnable snippets when valuable |

---

## 🗂️ Required Sections & Order

1. **Metadata header** (estimated reading time ⏱️, difficulty 🎚️, canonical links 🔗)  
2. **High-Level Overview** – elevator pitch & mental model  
3. **Deeper Dive** – break down core concepts  
4. **Use Cases** – when & why to choose it  
5. **Pitfalls & Gotchas** – common mistakes 😬  
6. **Best Practices** – pro tips ✅  
7. **Cheatsheet** – logically grouped, terse items (≤ 2 short sentences each) with mini-examples where helpful  

---

## 📏 Formatting Rules

- Use \`###\` for main section headings; smaller headings inside the Cheatsheet.  
- Prefer bullet lists for clarity; keep paragraphs concise.  
- Emojis must add meaning (e.g. ⚠️ for warnings, 💡 for tips).  
- **Output only the explainer + cheatsheet**—no extra commentary.

---

## 🖊️ Deliverable

Return a single Markdown document that follows everything above.

---
`;

const config: TemplateConfig = {
  name: "explain",
  description: "Create explain + cheatsheet for technical concept",
  template,
  parameters: {
    audienceLevel: {
      required: false,
      type: "string",
      description:
        "The level of audience for the explainer: beginner, intermediate, or expert",
      defaultValue: "beginner",
    },
    concept: {
      required: true,
      type: "string",
      description: "The concept to explain",
    },
  },
};

export default config;
