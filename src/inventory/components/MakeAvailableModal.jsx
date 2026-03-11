import { X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const MakeAvailableModal = ({ isOpen, onClose, onSubmit, classes = [] }) => {
  const [activeTab, setActiveTab] = useState("morning");
  const [selectedClass, setSelectedClass] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("morning");
      setSelectedClass("");
    }
  }, [isOpen]);

  // Filter classes based on selected shift
  const filteredClasses = useMemo(() => {
    if (!classes || classes.length === 0) return [];

    return classes.filter((cls) => {
      const timeSlot = cls.time_slot?.toLowerCase();
      return timeSlot === activeTab;
    });
  }, [classes, activeTab]);

  // Reset selected class when tab changes
  useEffect(() => {
    setSelectedClass("");
  }, [activeTab]);

  const handleSubmit = () => {
    if (!selectedClass) {
      alert("Please select a class");
      return;
    }

    onSubmit({
      shift: activeTab,
      class_id: selectedClass,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Make Inventory Available
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("morning")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                activeTab === "morning"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Morning Shift
            </button>
            <button
              onClick={() => setActiveTab("evening")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                activeTab === "evening"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Evening Shift
            </button>
          </div>

          {/* Class Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a class...</option>
              {filteredClasses.map((cls) => (
                <option key={cls.batch_id} value={cls.batch_id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {filteredClasses.length === 0 && (
              <p className="mt-2 text-sm text-gray-500 italic">
                No classes available for {activeTab} shift
              </p>
            )}
          </div>

          {/* Selected Info */}
          {selectedClass && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Selected:</span>{" "}
                {filteredClasses.find((c) => c.batch_id == selectedClass)?.name}{" "}
                - <span className="capitalize">{activeTab}</span> Shift
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedClass}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              selectedClass
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Make Available
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakeAvailableModal;
