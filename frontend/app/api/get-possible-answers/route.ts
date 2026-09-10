import { NextRequest, NextResponse } from 'next/server';
import { GROQ_MODEL, GROQ_URL, checkInternalAuth, corsHeaders, logAIUsage } from '@/lib/ai-support';

// `openai/gpt-oss-120b` is a reasoning model: its hidden reasoning tokens are
// billed against the completion budget, so the ceiling has to leave room for
// both the reasoning and the JSON array. Measured usage is ~120 tokens.
const MAX_TOKENS = 512;

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req.headers.get('origin'));

  const denied = checkInternalAuth(req);
  if (denied) return denied;

  try {
    const { category1, category2 } = await req.json();

    if (typeof category1 !== 'string' || typeof category2 !== 'string' || !category1 || !category2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: cors });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500, headers: cors });
    }

    logAIUsage('FETCH_POSSIBLE_ANSWERS_START', { category1, category2 });

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a creative word game assistant. Generate exactly 8-10 realistic answers that fit BOTH categories simultaneously.

Rules:
1. Answers must work for both categories literally and clearly
2. Answers should be common, realistic items/concepts (not obscure)
3. Include variety - different types of items where possible
4. Keep answers concise (1-3 words max typically)
5. Return ONLY a JSON array of strings, no other text

Example format:
["tomato", "apple", "pepper", "carrot", "onion", "beet"]`,
          },
          {
            role: 'user',
            content: `Generate 8-10 realistic answers that fit BOTH these categories:
Category 1: ${category1}
Category 2: ${category2}

Return ONLY the JSON array of answers, nothing else.`,
          },
        ],
        temperature: 0.7,
        max_tokens: MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      logAIUsage('FETCH_POSSIBLE_ANSWERS_ERROR', { category1, category2, error: errorText });
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502, headers: cors });
    }

    const data = await response.json();
    const aiResponse: unknown = data?.choices?.[0]?.message?.content;

    if (typeof aiResponse !== 'string' || !aiResponse) {
      logAIUsage('FETCH_POSSIBLE_ANSWERS_ERROR', { category1, category2, error: 'No response from AI' });
      return NextResponse.json({ error: 'No response from AI' }, { status: 502, headers: cors });
    }

    let possibleAnswers: unknown;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      possibleAnswers = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch {
      console.error('Failed to parse AI response:', aiResponse);
      logAIUsage('FETCH_POSSIBLE_ANSWERS_ERROR', {
        category1,
        category2,
        error: 'Invalid response format',
        response: aiResponse,
      });
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502, headers: cors });
    }

    const answers = (Array.isArray(possibleAnswers) ? possibleAnswers : [])
      .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
      .slice(0, 15);

    logAIUsage('FETCH_POSSIBLE_ANSWERS_SUCCESS', {
      category1,
      category2,
      answerCount: answers.length,
      answers,
      usage: data?.usage,
    });

    return NextResponse.json(
      { possibleAnswers: answers, category1, category2, generatedAt: new Date().toISOString() },
      { headers: cors }
    );
  } catch (error) {
    console.error('Generate answers error:', error);
    logAIUsage('FETCH_POSSIBLE_ANSWERS_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Generation failed' }, { status: 500, headers: cors });
  }
}
