import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { system, userMessage } = req.body;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      betas: ["code-execution-2025-08-25"],
      tools: [
        {
          type: 'code_execution_20250825',
          name: 'code_execution',
        },
      ],
      system,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: userMessage }],
        },
      ],
    });

    return res.status(200).json({ content: response.content, stop_reason: response.stop_reason });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Plan generation failed' });
  }
}
