const MODEL = 'claude-sonnet-4-6';
const API_ENDPOINT = '/api/claude';

const FORMAL_LANGUAGE_INSTRUCTIONS = {
  ar: `أنت مساعد أكاديمي متخصص في الإحصاء. يجب أن تكتب دائماً بالعربية الفصحى الأكاديمية الرسمية. لا تستخدم أي لهجة عامية أو إقليمية (مصرية أو خليجية أو غيرها). استخدم المصطلحات الإحصائية العلمية الدقيقة الموجودة في الأدبيات الأكاديمية. أسلوبك يجب أن يكون مناسباً للنشر في المجلات العلمية المحكّمة.`,
  fa: `You are an academic statistical assistant. Write exclusively in formal Persian (Farsi) appropriate for scientific publications and peer-reviewed journals. Use precise statistical terminology consistent with academic literature in Persian. Never use colloquial or informal expressions.`,
  ur: `You are an academic statistical assistant. Write exclusively in formal Urdu appropriate for scientific publications and peer-reviewed journals. Use precise statistical terminology consistent with academic literature in Urdu. Never use colloquial or informal expressions.`,
  he: `You are an academic statistical assistant. Write exclusively in formal Hebrew appropriate for scientific publications and peer-reviewed journals. Use precise statistical terminology consistent with academic literature in Hebrew. Never use colloquial or informal expressions.`,
};

const DEFAULT_INSTRUCTION = `You are an academic statistical assistant. Write exclusively in formal academic language appropriate for scientific publications and peer-reviewed journals. Use precise statistical terminology consistent with international academic literature. Never use colloquial, informal, or conversational expressions. Maintain a rigorous scholarly register throughout.`;

export function buildSystemPrompt(langCode) {
  const langInstruction = FORMAL_LANGUAGE_INSTRUCTIONS[langCode] ?? DEFAULT_INSTRUCTION;

  const langName = langCode !== 'en' && !FORMAL_LANGUAGE_INSTRUCTIONS[langCode]
    ? `Respond in the language with ISO code "${langCode}". `
    : '';

  return `${langName}${langInstruction}

Core responsibilities:
- Generate statistical analysis plans with proper methodological justification
- Produce commentary that interprets results accurately and objectively
- Cite statistical indices (R², F, p-values, β coefficients) with appropriate academic context
- Distinguish between statistical significance and practical significance
- Follow APA 7th edition conventions for reporting statistical results`;
}

async function callClaude(messages, systemPrompt) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

export async function generateStatisticalPlan(uploadData, langCode) {
  const systemPrompt = buildSystemPrompt(langCode);
  const messages = [
    {
      role: 'user',
      content: `Based on the following research data, generate a comprehensive statistical analysis plan.

Research context:
- Title: ${uploadData.title || 'Not specified'}
- Hypotheses: ${uploadData.hypotheses || 'Not specified'}
- Research goals: ${uploadData.goals || 'Not specified'}
- Dataset: ${uploadData.rows || 'Unknown'} observations, ${uploadData.cols || 'Unknown'} variables
- Variables: ${JSON.stringify(uploadData.variables || [])}

Provide a structured JSON response with the following format:
{
  "methods": [
    {
      "name": "Method name",
      "hypothesis": "Related hypothesis or 'Exploratory'",
      "justification": "Why this method was selected",
      "variableRelation": "How it relates to the variables",
      "statisticalIndices": "Key statistical measures to report"
    }
  ],
  "variables": [
    {
      "nameAr": "Variable name",
      "type": "nominal|ordinal|quantitative",
      "role": "independent|dependent|mediator"
    }
  ]
}`,
    },
  ];

  const text = await callClaude(messages, systemPrompt);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // Return raw text if JSON parsing fails
  }
  return { raw: text };
}

export async function generateCommentary(analysisData, langCode) {
  const systemPrompt = buildSystemPrompt(langCode);
  const messages = [
    {
      role: 'user',
      content: `Write a concise academic commentary (2-4 sentences) interpreting the following statistical results. Use formal academic language suitable for a research publication.

Analysis type: ${analysisData.type}
Results: ${JSON.stringify(analysisData.results)}
Sample size: ${analysisData.n || 'Not specified'}

Provide only the commentary text, no additional formatting or headers.`,
    },
  ];

  return callClaude(messages, systemPrompt);
}
