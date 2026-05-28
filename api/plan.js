import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_RETRIES = 3;

// Inspect tool_result blocks for Python errors (non-zero exit, traceback, etc.)
function extractCodeError(contentBlocks) {
  for (const block of contentBlocks) {
    const isResult = block.type === 'tool_result' || block.type === 'code_execution_tool_result';
    if (!isResult) continue;
    const c = block.content;
    if (typeof c === 'string') {
      if (/error|traceback|exception/i.test(c)) return c.slice(0, 1500);
    } else if (Array.isArray(c)) {
      const text = c.map(x => x.text ?? '').join('\n');
      if (/error|traceback|exception/i.test(text)) return text.slice(0, 1500);
    } else if (c && typeof c === 'object') {
      if (c.return_code !== undefined && c.return_code !== 0) {
        return [c.stderr, c.stdout].filter(Boolean).join('\n').slice(0, 1500);
      }
      if (c.stderr?.trim()) return c.stderr.slice(0, 1500);
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { system, userMessage } = req.body;

  try {
    const messages = [{ role: 'user', content: [{ type: 'text', text: userMessage }] }];
    let response;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8096,
        betas: ['code-execution-2025-08-25'],
        tools: [{ type: 'code_execution_20250825', name: 'code_execution' }],
        system,
        messages,
      });

      const codeError = extractCodeError(response.content);
      if (!codeError) break; // success — no Python error found

      if (attempt < MAX_RETRIES - 1) {
        messages.push({ role: 'assistant', content: response.content });
        messages.push({
          role: 'user',
          content: [{ type: 'text', text: `Your code produced this error:\n\n${codeError}\n\nFix it and retry.` }],
        });
      }
    }

    return res.status(200).json({ content: response.content, stop_reason: response.stop_reason });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Plan generation failed' });
  }
}
