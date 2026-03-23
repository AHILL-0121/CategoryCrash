import { NextResponse } from 'next/server';

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateRoomCode(): string {
  // Generate 3 random alphanumeric characters
  const part1 = Array.from({ length: 3 }, () => 
    ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)]
  ).join('');
  
  // Generate 3 more random alphanumeric characters
  const part2 = Array.from({ length: 3 }, () => 
    ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)]
  ).join('');
  
  return `${part1}-${part2}`;
}

export async function POST() {
  const roomId = generateRoomCode();

  return NextResponse.json({
    roomId,
    success: true,
  });
}
