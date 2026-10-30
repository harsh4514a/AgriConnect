export default function BuyerRequirementsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-surface-subtle" />
      <div className="mt-6 h-20 animate-pulse rounded-2xl bg-surface-subtle" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-52 animate-pulse rounded-2xl bg-surface-subtle" />
        ))}
      </div>
    </div>
  );
}
