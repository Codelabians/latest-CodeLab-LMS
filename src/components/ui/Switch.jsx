export const Switch = ({
  checked,
  onChange,
  disabled,
}) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
  </label>
);
