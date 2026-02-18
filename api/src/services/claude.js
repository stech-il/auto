import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are an expert WordPress site builder. Given a user's description, you generate a complete site structure in JSON format.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "theme": "string - WordPress theme slug (e.g. twentytwentyfour)",
  "design": {
    "primary_color": "#hex",
    "secondary_color": "#hex",
    "font_heading": "string",
    "font_body": "string",
    "style": "string - minimal/modern/creative/elegant"
  },
  "pages": [
    {
      "slug": "string",
      "title": "string",
      "content": "HTML content for the page",
      "menu_order": number,
      "template": "default|full-width|etc"
    }
  ],
  "menu": {
    "name": "Primary Menu",
    "locations": ["primary"]
  }
}

Rules:
- Create 3-6 pages based on the request (Home, About, Contact, Services, etc.)
- Use realistic Hebrew or English content matching the business type
- Design colors and fonts should match the described style
- Content should be professional and relevant`;

export async function generateSiteStructure(userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const text = message.content?.[0]?.type === 'text'
    ? message.content[0].text
    : '';

  // Parse JSON from response (handle possible markdown wrappers)
  let jsonStr = text.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const data = JSON.parse(jsonStr);
  return data;
}
