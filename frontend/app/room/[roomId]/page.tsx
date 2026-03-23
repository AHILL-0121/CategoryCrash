import { GameRoomClient } from '@/components/game/GameRoomClient';

export default async function GameRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return <GameRoomClient roomId={roomId} />;
}
