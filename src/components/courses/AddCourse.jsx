import { X } from "lucide-react";
import { useState } from "react";

const AddCourse = ({ isOpen, onClose, onSubmit, loading, categories }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories?.[0]?.id || "");
  const [fee, setFee] = useState("");
  const [classes, setClasses] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name || !category) return;
    onSubmit({ name, category, fee, classes });
    setName("");
    setFee("");
    setClasses("");
    setCategory(categories?.[0]?.id || "");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 custom-Background">
          <h2 className="text-lg font-bold text-white">Add New Course</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Course Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fee</label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Classes</label>
              <input
                type="number"
                value={classes}
                onChange={(e) => setClasses(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg custom-Background text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;
