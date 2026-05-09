const MODEL = 'claude-opus-4-7';
const API_ENDPOINT = '/api/claude';

const languageMap = {
  ar: 'Arabic (Modern Standard Arabic — formal academic register only, never use Egyptian or any other dialect)',
  en: 'English (formal academic register)',
  fr: 'French (registre académique formel)',
  es: 'Spanish (registro académico formal)',
  de: 'German (formelles akademisches Register)',
  pt: 'Portuguese (registro acadêmico formal)',
  zh: 'Chinese Simplified (正式学术语体)',
  hi: 'Hindi (औपचारिक शैक्षणिक भाषा)',
  fa: 'Persian/Farsi (زبان رسمی دانشگاهی)',
  tr: 'Turkish (resmi akademik dil)',
  nl: 'Dutch (formeel academisch register)',
  ru: 'Russian (официальный академический стиль)',
};

function getLanguageName(langCode) {
  // zh-CN maps to zh in the language map
  const key = langCode === 'zh-CN' ? 'zh' : langCode;
  return languageMap[key] ?? languageMap.en;
}

const PLAN_SYSTEM_PROMPT = `You are an expert academic statistician and research methodologist with deep knowledge of quantitative research methods, statistical analysis, and academic publishing standards.

Your task is to analyze the provided research data and information, then generate a complete, structured statistical analysis plan.

LANGUAGE RULE: You must respond ENTIRELY in {language}. Every word, label, explanation, and output must be in {language}. Use formal academic register appropriate for scientific publications in that language. Never mix languages.

YOUR RESPONSE MUST INCLUDE:

1. VARIABLES CLASSIFICATION
For each variable in the dataset, identify:
- Variable name
- Type (Nominal / Ordinal / Scale / Ratio)
- Role (Independent / Dependent / Moderating / Mediating / Control)
- Measurement level

2. HYPOTHESES MAPPING
For each research hypothesis provided:
- Restate it formally
- Identify the variables involved
- Link it to the appropriate statistical test

3. STATISTICAL ANALYSIS PLAN
For each statistical method recommended:
- Method name
- Why this method was selected (justify based on variable types, data distribution, sample size, and research objectives)
- Which hypothesis it tests
- Which variables are involved
- Required statistical assumptions to verify
- Key statistical parameters to report (coefficients, p-values, effect sizes, fit indices, etc.)
- Interpretation guidelines

4. ANALYSIS SEQUENCE
Provide the recommended order of analyses.

5. DATA QUALITY NOTES
Flag any potential issues detected in the data (missing values, outliers, small sample size, distribution violations).

RULES:
- Be precise and academically rigorous
- Do not suggest methods that are inappropriate for the data
- If research objectives or hypotheses are missing, infer them from the data structure
- Output must be structured, clear, and ready for researcher review
- Never write in a colloquial or simplified style — always use formal academic language
- At the END of your response, add a JSON block in this exact format so the system can parse it:
{methods: ['method1', 'method2', ...]}`;

const ANALYSIS_SYSTEM_PROMPT = `You are an expert academic statistician specializing in quantitative data analysis and academic research reporting.

You have been provided with:
1. A dataset
2. An approved statistical analysis plan

Your task is to execute the statistical analysis plan precisely and produce professional academic outputs.

LANGUAGE RULE: You must respond ENTIRELY in {language}. Every word, label, table header, commentary, and output must be in {language}. Use formal academic register appropriate for scientific publications in that language. Never mix languages.

YOUR RESPONSE MUST INCLUDE:

For EACH analysis in the approved plan, produce in this exact order:

1. ANALYSIS TITLE
State the name of the statistical test being performed.

2. STATISTICAL TABLE
Produce a clean, properly formatted statistical table containing:
- All relevant statistical values (means, standard deviations, frequencies, percentages, correlation coefficients, regression coefficients, F-values, t-values, chi-square values, p-values, confidence intervals, effect sizes, fit indices — as appropriate for each test)
- Table must follow APA 7th edition formatting standards
- All column headers and row labels in {language}

3. FIGURE (if applicable)
Describe the appropriate visualization for this analysis (bar chart, scatter plot, path diagram, etc.) with all labels and titles in {language}.

4. ACADEMIC COMMENTARY
Write a formal academic paragraph interpreting the results, including:
- Statement of findings
- Statistical significance and effect size interpretation
- Acceptance or rejection of the related hypothesis with justification
- Brief contextual interpretation

RULES:
- Execute ONLY what is in the approved statistical analysis plan — do not add unrequested analyses
- Do not write literature review, theoretical background, or references to previous studies
- Do not write research recommendations or conclusions
- Commentary must be strictly interpretive — numbers and their meaning only
- Maintain consistent formal academic tone throughout
- Follow APA 7th edition for all statistical reporting
- Never use colloquial language
- If data is insufficient for a requested analysis, state this clearly and explain why`;

const PROFESSIONAL_KEYWORDS = ['Random Forest', 'XGBoost', 'Gradient Boosting', 'SVM', 'Support Vector', 'PCA', 'K-Means', 'Clustering', 'Anomaly Detection', 'Meta-Analysis', 'CB-SEM', 'Latent Class', 'Multi-group SEM', 'Panel Data', 'Regression Discontinuity'];
const ADVANCED_KEYWORDS = ['PLS-SEM', 'PLSc-SEM', 'CFA', 'Confirmatory Factor', 'Structural Equation', 'HTMT', 'Mediation', 'Moderation', 'Higher-Order', 'PLSPredict', 'ARIMA', 'SARIMA', 'ARDL', 'GARCH', 'Cointegration', 'Johansen', 'Unit Root', 'ADF', 'KPSS', 'Time Series'];
const INTERMEDIATE_KEYWORDS = ['Mann-Whitney', 'Kruskal-Wallis', 'Wilcoxon', 'Friedman', 'Multiple Regression', 'Logistic Regression', 'Multinomial', 'Poisson', 'Hierarchical Regression', 'EFA', 'Exploratory Factor', 'Cronbach', 'McDonald', 'Factor Analysis'];

export function detectAnalysisLevel(methods) {
  const text = methods.join(' ');
  if (PROFESSIONAL_KEYWORDS.some(k => text.includes(k))) {
    return { key: 'professional', labelKey: 'levelProfessional', price: '$275.00', rawPrice: '$275', hex: '#d97706' };
  }
  if (ADVANCED_KEYWORDS.some(k => text.includes(k))) {
    return { key: 'advanced', labelKey: 'levelAdvanced', price: '$175.00', rawPrice: '$175', hex: '#6c63ff' };
  }
  if (INTERMEDIATE_KEYWORDS.some(k => text.includes(k))) {
    return { key: 'intermediate', labelKey: 'levelMedium', price: '$100.00', rawPrice: '$100', hex: '#3b82f6' };
  }
  return { key: 'basic', labelKey: 'levelBasic', price: '$50.00', rawPrice: '$50', hex: '#10b981' };
}

function extractMethods(text) {
  const match = text.match(/\{methods:\s*\[([^\]]*)\]\}/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

async function callClaude(systemPrompt, userContent) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

export async function generateStatisticalPlan(uploadData, langCode) {
  const language = getLanguageName(langCode);
  const system = PLAN_SYSTEM_PROMPT.replaceAll('{language}', language);

  const userContent = [
    `Research Title: ${uploadData.title || 'Not specified'}`,
    `Research Hypotheses: ${uploadData.hypotheses || 'Not specified'}`,
    `Research Goals: ${uploadData.goals || 'Not specified'}`,
    `Dataset: ${uploadData.rows || 'Unknown'} rows, ${uploadData.cols || 'Unknown'} columns`,
    uploadData.fileContent ? `\nDataset sample:\n${uploadData.fileContent}` : '',
  ].join('\n');

  const planText = await callClaude(system, userContent);
  const methods = extractMethods(planText);
  const pricing = detectAnalysisLevel(methods);

  return { planText, methods, pricing };
}

export async function executeAnalysis(uploadData, planText, langCode) {
  const language = getLanguageName(langCode);
  const system = ANALYSIS_SYSTEM_PROMPT.replaceAll('{language}', language);

  const userContent = [
    `Approved Statistical Analysis Plan:\n${planText}`,
    uploadData.fileContent ? `\nDataset sample:\n${uploadData.fileContent}` : '',
    `Research Title: ${uploadData.title || 'Not specified'}`,
    `Research Hypotheses: ${uploadData.hypotheses || 'Not specified'}`,
  ].join('\n');

  return callClaude(system, userContent);
}
