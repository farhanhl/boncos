export default function AppLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      {/* Neobrutalist pulsing receipt skeleton */}
      <div className="w-56 bg-kertas border-2 border-tinta rounded-[10px] p-5 shadow-hard animate-pulse space-y-3">
        <div className="h-4 bg-karbon rounded w-3/4" />
        <div className="h-3 bg-karbon rounded w-1/2" />
        <div className="pt-3 border-t-2 border-dashed border-tinta/30 space-y-2">
          <div className="h-3 bg-karbon rounded w-full" />
          <div className="h-3 bg-karbon rounded w-4/5" />
        </div>
        <div className="h-6 bg-kuning rounded w-2/3 mt-2" />
      </div>
      <p className="font-bold text-sm text-tinta">Memuat data…</p>
    </div>
  );
}
