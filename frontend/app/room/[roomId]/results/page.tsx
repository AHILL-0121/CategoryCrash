import { ResultsClient } from '@/components/game/ResultsClient';

// Next 14 passes `params` as a plain object. The previous `Promise<...>`
// annotation was Next 15 syntax that only happened to work because `await` on a
// non-promise is a no-op.
export default function ResultsPage({
  params,
}: {
  params: { roomId: string };
}) {
  return <ResultsClient roomId={params.roomId} />;
}
