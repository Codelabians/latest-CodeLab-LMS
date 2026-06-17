import { ArrowRight } from "lucide-react";

const ItemCard = ({
  onClick,
  onEdit,
  bandIcon: BandIcon,
  badgePrimary,
  badgeSecondary,
  title,
  stats = [],
  footerLabel,
  footerIcon: FooterIcon,
}) => (
  <div
    onClick={onClick}
    className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer
               transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/8 hover:border-red-200"
  >
    <div className="relative bg-[#aa0e0e] h-24 flex items-end p-4">
      <div className="pointer-events-none absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/5" />

      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit"
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-7 h-7 rounded-lg
                     bg-white/15 hover:bg-white/30 transition-colors duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      )}

      <div className="relative z-10 flex items-end justify-between w-full">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/20 flex-shrink-0">
          {BandIcon && <BandIcon size={17} className="text-white" />}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {badgePrimary && (
            <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-2.5 py-0.5">
              <span className="text-[11px] font-bold text-[#aa0e0e]">{badgePrimary.value}</span>
              <span className="text-[10px] font-semibold text-[#aa0e0e]/60 uppercase tracking-wide whitespace-nowrap">
                {badgePrimary.label}
              </span>
            </span>
          )}
          {badgeSecondary && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5"
              style={{ backgroundColor: badgeSecondary.color || "#10b981" }}
            >
              {badgeSecondary.icon && (
                <badgeSecondary.icon size={9} className="text-white" />
              )}
              <span className="text-[9px] font-bold text-white uppercase tracking-wide whitespace-nowrap">
                {badgeSecondary.label}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>

    <div className="p-4">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-1 h-5 rounded-full bg-[#aa0e0e] mt-0.5 flex-shrink-0" />
        <h3 className="text-[13.5px] font-semibold text-slate-800 leading-snug line-clamp-2">
          {title}
        </h3>
      </div>

      {stats.length > 0 && (
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <div className="w-px h-3 bg-gray-200" />}
              <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium">
                {stat.icon && <stat.icon size={13} className="text-[#aa0e0e]/60" />}
                <span>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-400 group-hover:text-[#aa0e0e] transition-colors duration-200">
          {FooterIcon && <FooterIcon size={14} />}
          <span>{footerLabel}</span>
        </div>
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 group-hover:bg-[#aa0e0e] transition-colors duration-200">
          <ArrowRight size={13} className="text-[#aa0e0e] group-hover:text-white transition-colors duration-200" />
        </div>
      </div>
    </div>
  </div>
);

export default ItemCard;