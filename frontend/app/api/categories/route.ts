import { NextResponse } from 'next/server';
import { categoryPairs, shuffleArray } from '@/lib/categories';

export async function GET() {
  // Return shuffled category pairs
  const shuffled = shuffleArray(categoryPairs);

  return NextResponse.json({
    pairs: shuffled,
    count: shuffled.length,
  });
}
