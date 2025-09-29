import { z } from 'zod';

// Story evaluation structure
const storySchema = z.object({
  text: z.string().describe('The story content'),
  creativity: z
    .number()
    .min(1)
    .max(10)
    .describe('How original and imaginative'),
  quality: z.number().min(1).max(10).describe('Overall writing quality'),
  strengths: z.string().describe('What works well (1-2 sentences)'),
});

// Complete evaluation schema
export const evaluationSchema = z.object({
  openai: storySchema,
  google: storySchema,
  verdict: z.string().describe('Which story is better and why (2-3 sentences)'),
});

export type Evaluation = z.infer<typeof evaluationSchema>;

// Format evaluation as markdown report
export function formatReport(evaluation: Evaluation): string {
  return `## 📚 Story Evaluation Report

### Generated Stories

#### OpenAI (GPT-5 Nano)
${evaluation.openai.text}

---

#### Google (Gemini 2.0 Flash)
${evaluation.google.text}

---

### 📊 Evaluation Results

#### OpenAI Story
- **Creativity:** ${evaluation.openai.creativity}/10
- **Quality:** ${evaluation.openai.quality}/10
- **Strengths:** ${evaluation.openai.strengths}

#### Google Story
- **Creativity:** ${evaluation.google.creativity}/10
- **Quality:** ${evaluation.google.quality}/10
- **Strengths:** ${evaluation.google.strengths}

---

### 🏆 Verdict
${evaluation.verdict}`;
}
