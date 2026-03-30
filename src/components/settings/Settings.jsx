import { useState, useEffect } from "react";
import { usePostMutation, useGetQuery } from "../../api/apiSlice";
import { toast } from "react-toastify";

const Settings = () => {
  const [makeCheck, { isLoading: isToggling }] = usePostMutation();
  const { data, isLoading: isFetchingStatus } = useGetQuery({
    path: "admin/feedback/status",
  });

  const [showEvaluationForm, setShowEvaluationForm] = useState(false);

  // Sync state with API data when it loads
  useEffect(() => {
    if (data?.status !== undefined) {
      // Handle both boolean and number (0/1) values
      setShowEvaluationForm(data.status === true || data.status === 1);
    }
  }, [data]);

  const handleToggleChange = async (e) => {
    const newValue = e.target.checked;
    setShowEvaluationForm(newValue);

    try {
      const res = await makeCheck({
        path: "/admin/feedback/toggle",
        body: {
          status: newValue ? 1 : 0,
        },
      }).unwrap();

      if (res.message) {
        toast.success(res.message);
      }
    } catch (error) {
      console.error("Error updating settings:", error);

      // Revert the checkbox state on error
      setShowEvaluationForm(!newValue);

      toast.error(
        error?.data?.message || "Failed to update settings. Please try again."
      );
    }
  };

  // Show loading state while fetching initial status
  if (isFetchingStatus) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="w-[90%] mx-auto py-6">
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
            <div className="text-gray-600">Loading settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-[90%] mx-auto py-6">
        {/* Header */}
        <div
          className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4"
          style={{ borderLeftColor: "#aa0e0e" }}
        >
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#aa0e0e" }}>
            Admin Settings
          </h1>
          <p className="text-gray-600">
            Configure teacher evaluation form visibility
          </p>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div
            className="border-b pb-4 mb-4"
            style={{ borderBottomColor: "#d61111" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "#aa0e0e" }}>
              Teacher Evaluation Form
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enable or disable the teacher evaluation form for students
            </p>
          </div>

          {/* Toggle Setting */}
          <div className="flex items-start space-x-4">
            <div className="flex items-center h-6 mt-1">
              <input
                id="evaluation-form-toggle"
                type="checkbox"
                checked={showEvaluationForm}
                onChange={handleToggleChange}
                disabled={isToggling}
                style={{ accentColor: "#d61111" }}
                className="w-5 h-5 bg-gray-100 border-gray-300 rounded focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="evaluation-form-toggle"
                style={{ color: "#aa0e0e" }}
                className={`text-base font-medium ${
                  isToggling
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer"
                }`}
              >
                Enable Teacher Evaluation Form
                {isToggling && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Updating...)
                  </span>
                )}
              </label>
              <p className="text-sm text-gray-600 mt-1">
                When enabled, the teacher evaluation form will be visible in the
                student panel where students can provide feedback about their
                teachers.
              </p>

              {/* Status Badge */}
              <div className="mt-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    showEvaluationForm
                      ? "text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  style={
                    showEvaluationForm ? { backgroundColor: "#d61111" } : {}
                  }
                >
                  {showEvaluationForm
                    ? "✓ Form Visible to Students"
                    : "✕ Form Hidden from Students"}
                </span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div
            className="mt-6 p-4 rounded-lg border-2"
            style={{ backgroundColor: "#f0f9f9", borderColor: "#d61111" }}
          >
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0"
                style={{ color: "#d61111" }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3
                  className="text-sm font-medium"
                  style={{ color: "#aa0e0e" }}
                >
                  How it works
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  When you check this box, the teacher evaluation form will
                  automatically appear in the student panel. Students can then
                  fill out and submit the form to provide their feedback.
                  Uncheck this box anytime to hide the form from students.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
