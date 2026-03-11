import { Check, X, Loader2, Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import FormInput from "../../ui/FormInput";

const CreateEditModal = ({
  isOpen,
  onClose,
  item,
  type,
  onSave,
  permissions = [],
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState(item || {});
  const [errors, setErrors] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!item) {
      setFormData(
        type === "role" ? { name: "", permissions: [] } : { subject: "" },
      );
      setSelectAll(false);
      return;
    }

    const normalized = { ...item };
    if (type === "role" && item.permissions) {
      normalized.permissions = item.permissions.map((p) =>
        typeof p === "object" ? p.id : p,
      );
    }

    setFormData(normalized);
    setErrors({});

    // Check if all permissions are selected when editing
    if (type === "role" && normalized.permissions) {
      setSelectAll(
        normalized.permissions.length === permissions.length &&
          permissions.length > 0,
      );
    }
  }, [item, isOpen, type, permissions.length]);

  // Update selectAll state when permissions change
  useEffect(() => {
    if (type === "role" && formData.permissions) {
      setSelectAll(
        formData.permissions.length === permissions.length &&
          permissions.length > 0,
      );
    }
  }, [formData.permissions, permissions.length, type]);

  const handleSubmit = () => {
    const newErrors = {};

    if (type === "role") {
      if (!formData.name) newErrors.name = "Role name is required";
    } else {
      if (!formData.subject) newErrors.subject = "Subject is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);

    if (isChecked) {
      // Select all permissions
      const allPermissionIds = permissions.map((p) => p.id || p.value || p);
      setFormData((prev) => ({
        ...prev,
        permissions: allPermissionIds,
      }));
    } else {
      // Deselect all permissions
      setFormData((prev) => ({
        ...prev,
        permissions: [],
      }));
    }

    // Clear permission errors if any
    if (errors.permissions) {
      setErrors((prev) => ({
        ...prev,
        permissions: "",
      }));
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData((prev) => {
      const currentPermissions = prev.permissions || [];
      const isSelected = currentPermissions.includes(permissionId);

      const updatedPermissions = isSelected
        ? currentPermissions.filter((id) => id !== permissionId)
        : [...currentPermissions, permissionId];

      return {
        ...prev,
        permissions: updatedPermissions,
      };
    });

    // Clear permission errors if any
    if (errors.permissions) {
      setErrors((prev) => ({
        ...prev,
        permissions: "",
      }));
    }
  };

  const isPermissionChecked = (permissionId) => {
    return formData.permissions?.includes(permissionId) || false;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header with Gradient */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-[#014376] to-[#31918D] rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">
                  {item?.id ? "Edit" : "Create"}{" "}
                  {type === "role" ? "Role" : "Permission"}
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5 hidden sm:block">
                  {item?.id
                    ? `Update ${type} details`
                    : `Add a new ${type} to your system`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group disabled:opacity-50"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 custom-scrollbar">
          {type === "role" ? (
            <>
              <div className="mb-5 sm:mb-6">
                <FormInput
                  label="Role Name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="e.g., Admin, Manager, User"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Permissions
                    </label>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Select permissions for this role
                    </p>
                  </div>
                  <label className="flex items-center gap-2 px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#31918D] border-gray-300 rounded focus:ring-2 focus:ring-[#014376] focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium text-[#31918D] group-hover:text-[#014376]">
                      Select All
                    </span>
                  </label>
                </div>

                {errors.permissions && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-xs sm:text-sm flex items-center gap-2">
                      <X className="w-4 h-4" />
                      {errors.permissions}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div className="max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto custom-scrollbar">
                    {permissions.length === 0 ? (
                      <div className="px-4 py-12 text-center">
                        <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm sm:text-base text-gray-500 font-medium">
                          No permissions available
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          Create permissions first
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {permissions.map((permission) => {
                          const permissionId =
                            permission.id || permission.value || permission;
                          const permissionLabel =
                            permission.label ||
                            permission.name ||
                            permission.subject ||
                            permission;
                          const permissionDescription =
                            permission.description || permission.action || "";

                          return (
                            <label
                              key={permissionId}
                              className={`flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer transition-all duration-200 hover:bg-white group ${
                                isPermissionChecked(permissionId)
                                  ? "bg-blue-50/50"
                                  : ""
                              }`}
                            >
                              <div className="relative flex items-center pt-0.5">
                                <input
                                  type="checkbox"
                                  checked={isPermissionChecked(permissionId)}
                                  onChange={() =>
                                    handlePermissionToggle(permissionId)
                                  }
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#31918D] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#014376] focus:ring-offset-0 cursor-pointer transition-all duration-200 checked:scale-110"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#31918D] transition-colors break-words">
                                    {permissionLabel}
                                  </div>
                                  {isPermissionChecked(permissionId) && (
                                    <div className="flex-shrink-0">
                                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#31918D] rounded-full animate-pulse"></div>
                                    </div>
                                  )}
                                </div>
                                {permissionDescription && (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {permissionDescription}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between px-1">
                  <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold text-[#31918D]">
                      {formData.permissions?.length || 0}
                    </span>
                    <span className="text-gray-500"> of </span>
                    <span className="font-semibold text-gray-700">
                      {permissions.length}
                    </span>
                    <span className="text-gray-500 hidden sm:inline">
                      {" "}
                      permissions selected
                    </span>
                  </div>
                  {formData.permissions?.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">
                        Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <FormInput
                label="Subject"
                name="subject"
                value={formData.subject || ""}
                onChange={handleChange}
                error={errors.subject}
                placeholder="e.g., users, posts, settings"
              />

              {item?.id && (
                <FormInput
                  label="Action"
                  name="action"
                  value={formData.action || ""}
                  onChange={handleChange}
                  error={errors.action}
                  placeholder="e.g., create, read, update, delete"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer with Shadow */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl sm:rounded-b-2xl">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow group"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>Cancel</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-[#014376] to-[#31918D] rounded-lg sm:rounded-xl hover:from-[#31918D] hover:to-[#014376] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{item?.id ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{item?.id ? "Update" : "Create"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateEditModal;
