export default function SectionSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-24 skeleton" />
      ))}
    </div>
  );
}
