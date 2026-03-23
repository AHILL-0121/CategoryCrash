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
    const { answer, category1, category2 } = await req.json();

    if (!answer || !category1 || !category2) {
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

    logAIUsage('VALIDATION_START', { answer, category1, category2 });

    // Call Groq API
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
            content: `You are a strict judge for a word game called CategoryCrash. Players must provide answers that fit BOTH categories simultaneously.

Rules for validation:
1. The answer MUST fit both categories literally and clearly
2. Be strict but fair - obvious fits are valid, stretched interpretations are invalid
3. Consider common knowledge and general understanding
4. Reject answers that only fit one category or require too much mental gymnastics

Respond ONLY with a JSON object in this exact format:
{
  "valid": true/false,
  "reason": "Brief explanation (max 50 words)"
}`
          },
          {
            role: 'user',
            content: `Category 1: ${category1}
Category 2: ${category2}
Answer: "${answer}"

Is this answer valid for BOTH categories? Respond with JSON only.`
          }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      logAIUsage('VALIDATION_ERROR', { answer, category1, category2, error: errorText });
      return NextResponse.json(
        { error: 'AI validation failed', details: errorText },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      logAIUsage('VALIDATION_ERROR', { answer, category1, category2, error: 'No response from AI' });
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the AI response
    let validation;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validation = JSON.parse(jsonMatch[0]);
      } else {
        validation = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      logAIUsage('VALIDATION_ERROR', { answer, category1, category2, error: 'Invalid response format', response: aiResponse });
      return NextResponse.json(
        { error: 'Invalid AI response format', details: aiResponse },
        { status: 500 }
      );
    }

    const isValid = validation.valid === true;
    logAIUsage('VALIDATION_SUCCESS', {
      answer,
      category1,
      category2,
      valid: isValid,
      reason: validation.reason
    });

    return NextResponse.json({
      valid: isValid,
      reason: validation.reason || 'No reason provided',
    });

  } catch (error) {
    console.error('Validation error:', error);
    logAIUsage('VALIDATION_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: 'Validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
