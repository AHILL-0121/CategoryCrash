import { NextResponse } from 'next/server';

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomChars(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => ALPHANUMERIC[b % ALPHANUMERIC.length]).join('');
}

function generateRoomCode(): string {
  return `${randomChars(3)}-${randomChars(3)}`;
}

// Called same-origin from the landing page, so no CORS headers are needed.
export async function POST() {
  return NextResponse.json({ roomId: generateRoomCode(), success: true });
}
