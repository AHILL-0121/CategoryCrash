import { ResultsClient } from '@/components/game/ResultsClient';

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return <ResultsClient roomId={roomId} />;
}
