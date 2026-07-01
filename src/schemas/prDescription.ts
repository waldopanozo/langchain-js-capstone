import { z } from "zod";

export const PrDescriptionSchema = z.object({
  title: z.string().describe("Concise PR title, imperative mood"),
  summary: z.string().describe("2-3 sentence overview for reviewers"),
  changes: z
    .array(z.string())
    .describe("Bullet list of concrete technical changes"),
  testPlan: z
    .array(z.string())
    .describe("How a reviewer should verify the change"),
  risks: z.array(z.string()).describe("Risks, edge cases, or follow-ups"),
  ticketMapping: z
    .array(z.string())
    .describe("How each acceptance criterion is addressed in the diff"),
});

export type PrDescription = z.infer<typeof PrDescriptionSchema>;
