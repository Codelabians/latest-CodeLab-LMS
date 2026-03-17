import { useGetQuery } from "../../api/apiSlice";
import colors from "../../assets/theme/colors"; // adjust path as needed

const BatchTabs = ({ setActiveBatchTab, activeBatchTab }) => {
  const { data: allbatches } = useGetQuery({
    path: "/admin/batches",
  });

  const tabStyle = (isActive) => ({
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    whiteSpace: "nowrap",
    cursor: "pointer",
    border: `1.5px solid ${isActive ? colors.tabActiveBorder : colors.tabInactiveBorder}`,
    background: isActive ? colors.tabActiveBg : colors.tabInactiveBg,
    color: isActive ? colors.tabActiveText : colors.tabInactiveText,
    boxShadow: isActive ? colors.tabActiveShadow : "none",
    transition: "all 0.2s ease",
    outline: "none",
  });

  const handleMouseEnter = (e, isActive) => {
    if (!isActive) {
      e.currentTarget.style.background = colors.tabInactiveHoverBg;
      e.currentTarget.style.borderColor = colors.tabInactiveHoverBorder;
    }
  };

  const handleMouseLeave = (e, isActive) => {
    if (!isActive) {
      e.currentTarget.style.background = colors.tabInactiveBg;
      e.currentTarget.style.borderColor = colors.tabInactiveBorder;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "24px",
        overflowX: "auto",
        paddingBottom: "8px",
        paddingTop: "4px",
        paddingLeft: "2px",
      }}
    >
      {/* All Batches tab */}
      <button
        onClick={() => setActiveBatchTab("all")}
        style={tabStyle(activeBatchTab === "all")}
        onMouseEnter={(e) => handleMouseEnter(e, activeBatchTab === "all")}
        onMouseLeave={(e) => handleMouseLeave(e, activeBatchTab === "all")}
      >
        All Batches
      </button>

      {/* Divider */}
      {allbatches?.data?.length > 0 && (
        <div
          style={{
            width: "1px",
            height: "28px",
            background: colors.divider,
            flexShrink: 0,
          }}
        />
      )}

      {/* Batch tabs */}
      {allbatches?.data?.map((batch) => {
        const isActive = activeBatchTab === batch.id.toString();
        return (
          <button
            key={batch.id}
            onClick={() => setActiveBatchTab(batch.id.toString())}
            style={tabStyle(isActive)}
            onMouseEnter={(e) => handleMouseEnter(e, isActive)}
            onMouseLeave={(e) => handleMouseLeave(e, isActive)}
          >
            {batch.name}
          </button>
        );
      })}
    </div>
  );
};

export default BatchTabs;