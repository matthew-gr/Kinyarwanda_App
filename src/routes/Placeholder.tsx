import { SectionHeader } from '../components/SectionHeader';

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="stack">
      <SectionHeader as="h1" size="large" title={title} subtitle="Coming in a later update." />
    </div>
  );
}
