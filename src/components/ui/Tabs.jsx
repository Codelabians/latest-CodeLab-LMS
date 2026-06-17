// src/components/ui/tabs/DynamicTabs.jsx

const Tabs = ({
  items = [],
  activeTab,
  onTabChange,
  getId = (item) => item.slug || item.uuid || item.id, // flexible ID extractor
  getLabel = (item) => item.name,
  getCount = null, // (item) => item.course_count || item.workspaces_count || null
  getIcon = () => null, // (item) => <Icon /> or null
  storageKey = "activeTab", // e.g., "activeWorkspaceTab"
  urlParam = "tab", // e.g., "tab", "category", "type"
  className = "",
  badgeClassName = "",
}) => {
  const handleTabClick = (item) => {
    const id = getId(item);
    onTabChange(id);
    localStorage.setItem(storageKey, id);
    // Update URL without triggering full navigation
    const params = new URLSearchParams(window.location.search);
    params.set(urlParam, id);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden ${className}`}
    >
      <div className="flex flex-wrap">
        {items.map((item) => {
          const id = getId(item);
          const isActive = activeTab === id;
          const Icon = getIcon(item);

          return (
            <button
              key={id}
              onClick={() => handleTabClick(item)}
              className={`flex-1 px-8 py-6 text-center font-semibold transition-all relative min-w-[180px] ${
                isActive
                  ? "text-white custom-Background"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {Icon && <Icon className="w-6 h-6" />}
                <span className="text-lg">{getLabel(item)}</span>
                {getCount && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-700"
                    } ${badgeClassName}`}
                  >
                    {getCount(item) ?? 0}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
