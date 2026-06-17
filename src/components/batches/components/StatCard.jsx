const StatCard = ({
  label,
  value,
  icon: Icon,
  gradient,
  textColor,
  iconBg,
}) => (
  <div
    className={`relative rounded-2xl p-4 sm:p-5 overflow-hidden border ${gradient}`}
  >
    <div className="flex items-start justify-between gap-2">
      <div>
        <p
          className={`text-2xl sm:text-3xl font-black tracking-tight ${textColor}`}
        >
          {value}
        </p>
        <p
          className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1.5 ${textColor} opacity-50`}
        >
          {label}
        </p>
      </div>
      <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-4 h-4 ${textColor} opacity-70`} />
      </div>
    </div>
  </div>
);
export default StatCard;
