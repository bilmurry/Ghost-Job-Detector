import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeJobWithAI(jobText: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `
Analyze the following job posting and determine the likelihood it is a ghost job.

Return valid JSON in this exact format:
{
  "ghost_probability": number,
  "confidence_level": "low" | "medium" | "high",
  "red_flags": string[],
  "reasoning": string
}

Job Posting:
${jobText}
`
      }
    ],
    temperature: 0.2,
  });

  return response.choices[0].message.content;
}