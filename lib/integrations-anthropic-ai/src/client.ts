import Anthropic from "@anthropic-ai/sdk";

const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

export const anthropic =
  baseURL && apiKey
    ? new Anthropic({ apiKey, baseURL })
    : null;
