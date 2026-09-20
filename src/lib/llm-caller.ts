export interface LLMRequestParams {
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}

// 직접 REST API 호출 (경량화 및 모든 프로바이더 지원)
export async function callLLM({ model, apiKey, systemPrompt, userPrompt }: LLMRequestParams): Promise<string> {
  // 1. Google Gemini (기본 모델)
  if (model.includes('gemini')) {
    // 모델명 매핑 후보 (2.5 -> 2.0 -> 1.5 폴백)
    const modelCandidates = model.includes('2.5')
      ? ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
      : model.includes('pro')
      ? ['gemini-1.5-pro', 'gemini-2.0-flash']
      : ['gemini-1.5-flash', 'gemini-2.0-flash'];

    let lastError = '';

    for (const cand of modelCandidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cand}:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.2 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        const errText = await res.text();
        lastError = `Gemini (${cand}) HTTP ${res.status}: ${errText}`;
        // 404면 다음 모델 후보 시도
        if (res.status === 404) continue;
        throw new Error(lastError);
      } catch (e: any) {
        lastError = e.message;
      }
    }

    throw new Error(`Gemini API 호출 실패: ${lastError}`);
  }

  // 2. OpenAI or DeepSeek
  if (model.startsWith('gpt') || model.startsWith('deepseek')) {
    const isDeepSeek = model.startsWith('deepseek');
    const endpoint = isDeepSeek ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const actualModel = isDeepSeek ? 'deepseek-chat' : model;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: actualModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${model} API 호출 실패 (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // 3. Anthropic (Claude)
  if (model.includes('claude')) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude API 호출 실패 (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  throw new Error(`지원하지 않는 모델입니다: ${model}`);
}

// 코드 추출 유틸리티 (마크다운 ```python 태그 제거)
export function extractPythonCode(rawText: string): string {
  const match = rawText.match(/```(?:python)?\s*([\s\S]*?)\s*```/);
  if (match) return match[1].trim();
  return rawText.trim();
}
