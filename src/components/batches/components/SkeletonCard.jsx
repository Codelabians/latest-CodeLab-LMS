const SkeletonCard = ({ delay = 0 }) => (
  <div
    className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-4 p-5">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-36 rounded-lg bg-gray-100" />
        <div className="h-3 w-24 rounded-lg bg-gray-50" />
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="h-6 w-20 rounded-full bg-gray-100 hidden sm:block" />
        <div className="w-14 h-7 rounded-full bg-gray-100" />
      </div>
    </div>
    <div className="h-px bg-gray-50 mx-5" />
    <div className="px-5 py-3 flex justify-between">
      <div className="h-3 w-20 rounded bg-gray-50" />
      <div className="h-3 w-28 rounded bg-gray-50" />
    </div>
  </div>
);

export default SkeletonCard;
