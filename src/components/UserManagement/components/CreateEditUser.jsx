import { useEffect, useState } from "react";
import {
  useGetQuery,
  usePatchMutation,
  usePostMutation,
} from "../../../api/apiSlice";
import { X } from "lucide-react";
import FormInput from "../../ui/FormInput";
import { toast } from "react-toastify";

const CreateEditUserModal = ({
  isOpen,
  onClose,
  user = null,
  refetchUsers,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    password: "",
    role_id: "",
  });
  const [errors, setErrors] = useState({});

  const { data: rolesResponse } = useGetQuery({ path: "core/roles" });
  const roles = rolesResponse?.data || [];

  const [createUser, { isLoading: isCreating }] = usePostMutation();
  const [updateUser, { isLoading: isUpdating }] = usePatchMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (user) {
      // Find the role UUID by matching the role name
      const matchingRole = roles.find((role) => role.name === user.role);

      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        contact: user.contact || "",
        cnic: user.cnic || "",
        password: "",
        role_id: matchingRole?.id || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
        cnic: "",
        password: "",
        role_id: "",
      });
    }
    setErrors({});
  }, [user, isOpen, roles]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format CNIC input as user types
    if (name === "cnic") {
      // Remove all non-digit characters
      let cleanValue = value.replace(/\D/g, "");

      // Limit to 13 digits
      cleanValue = cleanValue.slice(0, 13);

      // Format as 00000-0000000-0
      let formattedValue = cleanValue;
      if (cleanValue.length > 5) {
        formattedValue = cleanValue.slice(0, 5) + "-" + cleanValue.slice(5);
      }
      if (cleanValue.length > 12) {
        formattedValue =
          cleanValue.slice(0, 5) +
          "-" +
          cleanValue.slice(5, 12) +
          "-" +
          cleanValue.slice(12);
      }

      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required";
    }

    // CNIC validation
    if (!formData.cnic.trim()) {
      newErrors.cnic = "CNIC is required";
    } else {
      // Check if CNIC matches the format 00000-0000000-0
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      if (!cnicRegex.test(formData.cnic)) {
        newErrors.cnic = "CNIC must be in format 00000-0000000-0";
      }
    }

    // if (!user && !formData.password.trim()) {
    //   newErrors.password = 'Password is required';
    // }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.role_id) {
      newErrors.role_id = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const payload = { ...formData };

      // Remove password if empty
      if (!payload.password) {
        delete payload.password;
      }

      // Convert role_id to number if it's a string
      if (payload.role_id) {
        payload.role_id = Number(payload.role_id);
      }

      let response;
      if (user) {
        response = await updateUser({
          path: `admin/user/${user.uuid}`,
          body: payload,
        }).unwrap();
      } else {
        response = await createUser({
          path: "/user/create-with-role",
          body: payload,
        }).unwrap();
      }

      toast.success(response?.message || "User created successfully");
      if (refetchUsers) {
        refetchUsers();
      }
      onClose();
    } catch (error) {
      toast.error(error?.data?.message);
      console.error("Error saving user:", error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {user ? "Edit User" : "Create User"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <FormInput
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            placeholder="Enter first name"
          />

          <FormInput
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            placeholder="Enter last name"
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter email"
          />

          <FormInput
            label="Contact Number"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            error={errors.contact}
            placeholder="Enter contact number"
          />

          <FormInput
            label="CNIC"
            name="cnic"
            value={formData.cnic}
            onChange={handleChange}
            error={errors.cnic}
            placeholder="00000-0000000-0"
            maxLength={15}
          />
          {/* 
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder={user ? "Leave blank to keep current" : "Enter password"}
          /> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.role_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.uuid} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="text-red-500 text-sm mt-1">{errors.role_id}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 custom-AddButton text-white rounded-md "
          >
            {isSubmitting ? (
              <>{user ? "Updating..." : "Creating..."}</>
            ) : user ? (
              "Update User"
            ) : (
              "Create User"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEditUserModal;
