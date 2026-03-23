import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync, mkdirSync } from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'ai-usage.log');

function ensureLogDir() {
  try {
    mkdirSync(logDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
}

function logAIUsage(eventType: string, data: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${eventType}: ${JSON.stringify(data)}\n`;

  try {
    ensureLogDir();
    appendFileSync(logFile, logEntry);
  } catch (err) {
    // Fail silently if logging fails
    console.error('Failed to write AI usage log:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { category1, category2 } = await req.json();

    if (!category1 || !category2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Log AI request
    logAIUsage('FETCH_POSSIBLE_ANSWERS_START', { category1, category2 });

    // Call Groq API to generate possible answers
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
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
["tomato", "apple", "pepper", "carrot", "onion", "beet"]`
          },
          {
            role: 'user',
            content: `Generate 8-10 realistic answers that fit BOTH these categories:
Category 1: ${category1}
Category 2: ${category2}

Return ONLY the JSON array of answers, nothing else.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      logAIUsage('FETCH_POSSIBLE_ANSWERS_ERROR', { category1, category2, error: errorText });
      return NextResponse.json(
        { error: 'AI generation failed', details: errorText },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      logAIUsage('FETCH_POSSIBLE_ANSWERS_ERROR', { category1, category2, error: 'No response from AI' });
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the AI response
    let possibleAnswers: string[] = [];
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        possibleAnswers = JSON.parse(jsonMatch[0]);
      } else {
        possibleAnswers = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      logAIUsage('FETCH_POSSIBLE_ANSWERS_ERROR', { category1, category2, error: 'Invalid response format', response: aiResponse });
      return NextResponse.json(
        { error: 'Invalid AI response format', details: aiResponse },
        { status: 500 }
      );
    }

    // Ensure it's an array of strings
    if (!Array.isArray(possibleAnswers)) {
      possibleAnswers = [];
    }
    possibleAnswers = possibleAnswers.filter(a => typeof a === 'string').slice(0, 15);

    logAIUsage('FETCH_POSSIBLE_ANSWERS_SUCCESS', {
      category1,
      category2,
      answerCount: possibleAnswers.length,
      answers: possibleAnswers
    });

    return NextResponse.json({
      possibleAnswers,
      category1,
      category2,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Generate answers error:', error);
    logAIUsage('FETCH_POSSIBLE_ANSWERS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: 'Generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
