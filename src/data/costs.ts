// What the app's paid services cost, for debug mode's confirmations (decision 204). Prices are
// list prices in US dollars as of November 2026: Anthropic's per million tokens, Pindo's per
// request (decision 162). Estimates only: the bill is what the services charge.

/** Claude list prices, per million tokens. */
export const CLAUDE_PRICES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-opus-5-5': { input: 4, output: 20 },
};

/** What Pindo charges for one text-to-speech request. */
export const PINDO_REQUEST_USD = 0.12;

/** Rough tokens for text: about 3.5 characters a token (Kinyarwanda runs higher). */
const tokensOf = (chars: number) => Math.ceil(chars / 3.5);

/**
 * A story's cost with one Claude call, and with two (the function asks again once when too
 * few words are known). Output: the Kinyarwanda and English sentences, a glossary entry per
 * word or so, three questions, and room for the model's thinking.
 */
export function storyCost(
  model: string,
  promptChars: number,
  words: number,
): { once: number; twice: number } {
  const price = CLAUDE_PRICES[model] ?? CLAUDE_PRICES['claude-opus-5-5']!;
  const input = tokensOf(promptChars) + 600;
  const output = Math.round(words * 9.5) + 1200;
  const once = (input * price.input + output * price.output) / 1_000_000;
  return { once, twice: 2 * once };
}

/** "$0.12", "$0.03", "less than $0.01". */
export function dollars(usd: number): string {
  return usd < 0.01 ? 'less than $0.01' : `$${usd.toFixed(2)}`;
}
