import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { toast } from "react-toastify";
import FormInput from "../../ui/FormInput";

const EditClassModal = ({ isOpen, onClose, studentId, currentClass, refetch }) => {
  const [formData, setFormData] = useState({
    newClassId: "",
    newClassName: "",
  });

  const { data: classData } = useGetQuery({ path: "admin/classes" });
  const [updateClass, { isLoading: isUpdating }] = usePostMutation();

  useEffect(() => {
    if (isOpen && currentClass) {
      setFormData({
        newClassId: currentClass.class_id || "",
        newClassName: currentClass.name || "",
      });
    }
  }, [isOpen, currentClass]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "newClassId") {
      const selectedClass = classData?.data?.find(
        (classItem) => String(classItem.class_id) === String(value)
      );
      setFormData({
        newClassId: selectedClass?.class_id || "",
        newClassName: selectedClass?.name || "",
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.newClassId) {
      toast.error("Please select a class");
      return;
    }

    if (String(formData.newClassId) === String(currentClass.class_id)) {
      toast.error("Please select a different class");
      return;
    }

    try {
      const payload = {
        student_class_uuid: currentClass.student_class_uuid,
        class_id: formData.newClassId,
      };

      await updateClass({
        path: "/admin/student-class/update-class",
        body: payload,
      }).unwrap();

      toast.success("Class updated successfully!");
      setFormData({
        newClassId: "",
        newClassName: "",
      });
      if (refetch) refetch();
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update class");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#aa0e0e]">Edit Class</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {/* Current Class (Read-only) */}
          <FormInput
            type="text"
            label="Current Class"
            name="currentClassName"
            value={currentClass?.name || ""}
            disabled
          />

          {/* New Class Selection */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-gray-700">
              Select New Class <span className="text-red-500">*</span>
            </label>
            <select
              name="newClassId"
              value={formData.newClassId}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a Class</option>
              {classData?.data?.map((classItem) => (
                <option 
                  key={classItem.class_id} 
                  value={classItem.class_id}
                  disabled={String(classItem.class_id) === String(currentClass?.class_id)}
                >
                  {classItem.name}
                  {String(classItem.class_id) === String(currentClass?.class_id) ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> Changing the class will update the student's enrollment. Please ensure the new class is appropriate for the student.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="px-6 py-2 rounded-lg custom-Background text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update Class"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditClassModal;