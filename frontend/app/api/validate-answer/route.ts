import { NextRequest, NextResponse } from 'next/server';
import { GROQ_MODEL, GROQ_URL, checkInternalAuth, corsHeaders, logAIUsage } from '@/lib/ai-support';

// Reasoning tokens are billed against the completion budget on
// `openai/gpt-oss-120b` (measured: 48-56 reasoning tokens on a simple verdict,
// against a 150 ceiling). A truncated response fails the JSON parse below, so
// the budget carries real headroom.
const MAX_TOKENS = 512;
const MAX_ANSWER_LENGTH = 80;

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req.headers.get('origin'));

  const denied = checkInternalAuth(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const answer = typeof body?.answer === 'string' ? body.answer.trim().slice(0, MAX_ANSWER_LENGTH) : '';
    const category1 = typeof body?.category1 === 'string' ? body.category1 : '';
    const category2 = typeof body?.category2 === 'string' ? body.category2 : '';

    if (!answer || !category1 || !category2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: cors });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500, headers: cors });
    }

    logAIUsage('VALIDATION_START', { answer, category1, category2 });

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
            content: `You are a strict judge for a word game called CategoryCrash. Players must provide answers that fit BOTH categories simultaneously.

Rules for validation:
1. The answer MUST fit both categories literally and clearly
2. Be strict but fair - obvious fits are valid, stretched interpretations are invalid
3. Consider common knowledge and general understanding
4. Reject answers that only fit one category or require too much mental gymnastics
5. Reject nonsense, single letters, and answers padded with unrelated words

Respond ONLY with a JSON object in this exact format:
{
  "valid": true/false,
  "reason": "Brief explanation (max 50 words)"
}`,
          },
          {
            role: 'user',
            content: `Category 1: ${category1}
Category 2: ${category2}
Answer: "${answer}"

Is this answer valid for BOTH categories? Respond with JSON only.`,
          },
        ],
        temperature: 0.3,
        max_tokens: MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      logAIUsage('VALIDATION_ERROR', { answer, category1, category2, error: errorText });
      return NextResponse.json({ error: 'AI validation failed' }, { status: 502, headers: cors });
    }

    const data = await response.json();
    const aiResponse: unknown = data?.choices?.[0]?.message?.content;

    if (typeof aiResponse !== 'string' || !aiResponse) {
      logAIUsage('VALIDATION_ERROR', { answer, category1, category2, error: 'No response from AI' });
      return NextResponse.json({ error: 'No response from AI' }, { status: 502, headers: cors });
    }

    let validation: { valid?: unknown; reason?: unknown };
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      validation = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch {
      console.error('Failed to parse AI response:', aiResponse);
      logAIUsage('VALIDATION_ERROR', {
        answer,
        category1,
        category2,
        error: 'Invalid response format',
        response: aiResponse,
      });
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502, headers: cors });
    }

    const isValid = validation.valid === true;
    const reason = typeof validation.reason === 'string' ? validation.reason : 'No reason provided';

    logAIUsage('VALIDATION_SUCCESS', {
      answer,
      category1,
      category2,
      valid: isValid,
      reason,
      usage: data?.usage,
    });

    return NextResponse.json({ valid: isValid, reason }, { headers: cors });
  } catch (error) {
    console.error('Validation error:', error);
    logAIUsage('VALIDATION_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Validation failed' }, { status: 500, headers: cors });
  }
}
