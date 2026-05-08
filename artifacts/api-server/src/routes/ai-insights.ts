import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/ai-insights", async (req, res) => {
  if (!anthropic) {
    res.status(503).json({ error: "AI integration not configured" });
    return;
  }

  const { question, yesProb, noProb, totalVolume, status, endTime } = req.body;

  if (!question) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  try {
    const endDate = endTime ? new Date(Number(endTime) * 1000).toLocaleDateString() : "unknown";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are an expert prediction market analyst. Analyze this prediction market and provide insights.

Market Question: "${question}"
Current YES Probability: ${yesProb}%
Current NO Probability: ${noProb}%
Total Volume: $${totalVolume}
Status: ${status}
Closes: ${endDate}

Provide a structured analysis with:
1. Probability Assessment: Is YES or NO more likely based on the current odds and your knowledge?
2. Key Factors: List 3-5 key factors that could influence this outcome
3. Recommendation: Should traders bet YES, NO, or stay NEUTRAL?
4. Confidence Level: How confident are you in this analysis? (Low/Medium/High)

Format your response as valid JSON with this exact structure:
{
  "probabilityAssessment": "string explaining which outcome is more likely and why",
  "keyFactors": ["factor 1", "factor 2", "factor 3"],
  "recommendation": "YES" | "NO" | "NEUTRAL",
  "confidence": "Low" | "Medium" | "High",
  "reasoning": "brief 1-2 sentence summary of your reasoning"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      res.status(500).json({ error: "Unexpected response format" });
      return;
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Could not parse AI response" });
      return;
    }

    const analysis = JSON.parse(jsonMatch[0]);
    res.json({ analysis });
  } catch (err: any) {
    console.error("AI insights error:", err);
    res.status(500).json({ error: err?.message ?? "Failed to generate insights" });
  }
});

export default router;
