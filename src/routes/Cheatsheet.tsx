import { CHEATSHEET } from '../content';
import { EmptyState } from '../components/EmptyState';
import { Markdown } from '../components/Markdown';

export function Cheatsheet() {
  if (!CHEATSHEET) {
    return <EmptyState title="The cheat sheet isn't written yet." body="Check back soon." />;
  }
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Cheat sheet</h1>
      <Markdown>{CHEATSHEET}</Markdown>
    </div>
  );
}
