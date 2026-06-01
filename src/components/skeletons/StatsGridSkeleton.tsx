export default function StatsGridSkeleton() {
  return (
    <section className="section bg-white dark:bg-slate-950">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
      </div>
    </section>
  );
}
