import { useState, useEffect } from "react";
import FormInput from "../../ui/FormInput";
import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { X } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../../ui/common/LoaderComponent";

export default function AddEmployee() {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const location = useLocation();
  const instructorData = location.state?.instructorData;

  // Determine if we're in employee or instructor mode based on the URL
  const isEmployeeMode = location.pathname.includes("/employees");
  const isEditMode = Boolean(uuid || instructorData);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    cnic: "",
    dob: "",
    gender: "",
    maritalStatus: "single",
    city: "",
    qualification: "",
    experience: "",
    designation: "",
    basicSalary: "",
    facilities: [],
    guardianName: "",
    guardianPhoneNo: "",
    address: "",
    note: "",
    active_status: true,
    is_hostalize: false,
    isIntern: false,
    user_image: null,
    cnicFront: null,
    cnicBack: null,
    contract: null,
    resume: null,
    education: null,
    experienceLetter: null,
    securityClearance: null,
  });

  // Store existing file URLs separately
  const [existingFiles, setExistingFiles] = useState({
    user_image: null,
    cnicFront: null,
    cnicBack: null,
    contract: null,
    resume: null,
    education: null,
    experienceLetter: null,
    securityClearance: null,
  });

  const { data: facilitiesData = [], isLoading: isFacilitiesLoading } =
    useGetQuery({
      path: "/admin/facilities",
    });

  // Use different API endpoint based on mode
  const apiPath = isEmployeeMode ? "employee" : "teacher";

  const { data: singleInstructorData } = useGetQuery({
    path: uuid ? `/admin/${apiPath}/${uuid}` : null,
    skip: !uuid,
  });

  const [createTeacher, { isLoading: isCreating }] = usePostMutation();
  const [updateTeacher, { isLoading: isUpdating }] = usePostMutation();

  const isLoading = isCreating || isUpdating;

  // Prefill form data in edit mode
  useEffect(() => {
    const dataToUse = singleInstructorData?.data || instructorData;

    if (isEditMode && dataToUse) {
      setFormData({
        firstName: dataToUse.first_name || "",
        lastName: dataToUse.last_name || "",
        email: dataToUse.email || "",
        contact: dataToUse.contact || dataToUse.phoneNo || "",
        cnic: dataToUse.cnic || "",
        dob: dataToUse.dob || dataToUse.dateOfBirth || "",
        gender: dataToUse.gender || "",
        maritalStatus: (dataToUse.marital_status || "single").toLowerCase(),
        city: dataToUse.city || "",
        qualification: dataToUse.qualification || "",
        experience: dataToUse.experience || "",
        designation: dataToUse.designation || "",
        basicSalary: dataToUse.basic_salary || "",
        facilities:
          dataToUse.facility_ids ||
          dataToUse.facilities?.map((f) => f.id) ||
          [],
        guardianName: dataToUse.father_name || dataToUse.guardianName || dataToUse.guardian_name || "",
        guardianPhoneNo:
          dataToUse.guardian_phone || dataToUse.guardianPhoneNo || "",
        address: dataToUse.address || "",
        note: dataToUse.bio || dataToUse.note || dataToUse.notes || "",
        active_status: dataToUse.active_status ?? true,
        is_hostalize: dataToUse.is_hostalize ?? false,
        isIntern: dataToUse.is_intern ?? false,
        user_image: null,
        cnicFront: null,
        cnicBack: null,
        contract: null,
        resume: null,
        education: null,
        experienceLetter: null,
        securityClearance: null,
      });

      // Store existing file information
      setExistingFiles({
        user_image: dataToUse.avatar?.file_url || null,
        cnicFront: dataToUse.cnic_front?.file_url || null,
        cnicBack: dataToUse.cnic_back?.file_url || null,
        contract: dataToUse.contract?.file_url || null,
        resume: dataToUse.resume?.file_url || null,
        education: dataToUse.education?.file_url || null,
        experienceLetter: dataToUse.experienceLetter?.file_url || null,
        securityClearance: dataToUse.securityClearance?.[0]?.file_url || null,
      });
    }
  }, [isEditMode, singleInstructorData, instructorData]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "cnic") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (
      name === "phone" ||
      name === "contact" ||
      name === "mobile" ||
      name === "guardianPhoneNo"
    ) {
      let numericValue = value.replace(/[^0-9]/g, "");
      if (numericValue.length > 11) numericValue = numericValue.slice(0, 11);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFacilitiesChange = (selected) => {
    setFormData((prev) => ({
      ...prev,
      facilities: Array.isArray(selected)
        ? selected.map((opt) => opt.value)
        : [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ms = String(formData.maritalStatus || "")
      .trim()
      .toLowerCase();
    const validMaritalStatuses = ["single", "married", "divorced", "widow"];

    if (!validMaritalStatuses.includes(ms)) {
      toast.error(
        `Invalid marital status: must be ${validMaritalStatuses.join(", ")}`
      );
      return;
    }

    const cnicValue = String(formData.cnic || "").trim();
    if (cnicValue.length !== 13) {
      toast.error("CNIC must be exactly 13 digits");
      return;
    }

    try {
      const payload = new FormData();

      for (const key in formData) {
        const val = formData[key];

        if (key === "facilities" && Array.isArray(val)) {
          val.forEach((f) => payload.append("facilities[]", f));
          continue;
        }

        if (key === "maritalStatus") {
          payload.append("maritalStatus", ms);
          continue;
        }

        if (key === "isIntern") {
          payload.append("isIntern", val ? 1 : 0);
          continue;
        }

        if (typeof val === "boolean") {
          payload.append(key, val ? 1 : 0);
          continue;
        }

        if (val instanceof File) {
          payload.append(key, val);
          continue;
        }

        if (val !== null && val !== undefined && val !== "") {
          payload.append(key, String(val).trim());
        }
      }

      let response;

      if (isEditMode) {
        const instructorId = uuid || instructorData?.uuid;

        if (!instructorId) {
          toast.error("ID is missing. Cannot update.");
          return;
        }

        response = await updateTeacher({
          path: `/admin/${apiPath}/${instructorId}?_method=PATCH`,
          body: payload,
        }).unwrap();

        toast.success(
          `${isEmployeeMode ? "Employee" : "Instructor"} updated successfully`
        );
      } else {
        response = await createTeacher({
          path: `/admin/${apiPath}/store`,
          body: payload,
        }).unwrap();

        toast.success(
          `${
            isEmployeeMode ? "Employee" : "Instructor"
          } registered successfully`
        );
      }

      navigate(-1);
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "registering"}:`, error);
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditMode ? "update" : "register"} ${
            isEmployeeMode ? "employee" : "instructor"
          }`
      );
    }
  };

  const facilityOptions = facilitiesData?.data?.map((facility) => ({
    label: facility.facility_name,
    value: facility.id,
  }));

  const pageTitle = isEmployeeMode ? "Employee" : "Instructor";

  // Helper to show file name or existing file
  const getFileDisplayInfo = (fieldName) => {
    if (formData[fieldName]) {
      return formData[fieldName].name;
    }
    if (existingFiles[fieldName]) {
      return "Current file uploaded";
    }
    return null;
  };

  return (
    <div className="min-h-screen py-12 px-4">
      {isLoading && <Loader />}
      <div className="w-11/12 mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl text-brown font-bold text-center">
            {isEditMode ? `Edit ${pageTitle}` : `${pageTitle} Registration`}
          </h1>
          <X
            onClick={() => navigate(-1)}
            className="text-brown cursor-pointer"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormInput
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Phone"
              name="contact"
              type="tel"
              value={formData.contact}
              onChange={handleChange}
              required
            />
            <FormInput
              label="CNIC"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Gender"
              name="gender"
              type="select"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
              ]}
              required
            />
            <FormInput
              label="Marital Status"
              name="maritalStatus"
              type="select"
              value={formData.maritalStatus}
              onChange={handleChange}
              options={[
                { label: "Single", value: "single" },
                { label: "Married", value: "married" },
              ]}
              required
            />
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Qualification"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Experience (years)"
              name="experience"
              type="number"
              value={formData.experience}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Basic Salary"
              name="basicSalary"
              type="number"
              value={formData.basicSalary}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Facilities"
              name="facilities"
              type="select"
              value={formData.facilities}
              onChange={handleFacilitiesChange}
              options={facilityOptions}
              isMulti
              isLoading={isFacilitiesLoading}
            />
            <FormInput
              label="Guardian Name"
              name="guardianName"
              value={formData.guardianName}
              onChange={handleChange}
            />
            <FormInput
              label="Guardian Phone"
              name="guardianPhoneNo"
              type="tel"
              value={formData.guardianPhoneNo}
              onChange={handleChange}
            />
          </div>

          <FormInput
            label="Address"
            name="address"
            type="textarea"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            required
          />
          <FormInput
            label="Note"
            name="note"
            type="textarea"
            value={formData.note}
            onChange={handleChange}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4 mb-5">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active_status"
                checked={formData.active_status}
                onChange={handleChange}
                className="w-5 h-5 accent-[#aa0e0e]"
              />
              <span className="text-sm font-semibold text-gray-700">
                Active Status
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_hostalize"
                checked={formData.is_hostalize}
                onChange={handleChange}
                className="w-5 h-5 accent-[#aa0e0e]"
              />
              <span className="text-sm font-semibold text-gray-700">
                Is Hostelite
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isIntern"
                checked={formData.isIntern}
                onChange={handleChange}
                className="w-5 h-5 accent-[#aa0e0e]"
              />
              <span className="text-sm font-semibold text-gray-700">
                Is Intern
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <FormInput
                label="Profile Image"
                name="user_image"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
              {existingFiles.user_image && !formData.user_image && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Current file uploaded
                </p>
              )}
            </div>
            
            <div>
              <FormInput
                label="CNIC Front Upload"
                name="cnicFront"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleChange}
                required={!isEditMode}
              />
              {existingFiles.cnicFront && !formData.cnicFront && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Current file uploaded
                </p>
              )}
            </div>
            
            <div>
              <FormInput
                label="CNIC Back Upload"
                name="cnicBack"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleChange}
                required={!isEditMode}
              />
              {existingFiles.cnicBack && !formData.cnicBack && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Current file uploaded
                </p>
              )}
            </div>
            
            <div>
              <FormInput
                label="Contract PDF"
                name="contract"
                type="file"
                accept="application/pdf"
                onChange={handleChange}
              />
              {existingFiles.contract && !formData.contract && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Current file uploaded
                </p>
              )}
            </div>
            
            <div>
              <FormInput
                label="Resume"
                name="resume"
                type="file"
                accept="application/pdf"
                onChange={handleChange}
              />
              {existingFiles.resume && !formData.resume && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Current file uploaded
                </p>
              )}
            </div>
            
            <div>
              <FormInput
                label="Education PDF"
                name="education"
                type="file"
                accept="application/pdf"
                onChange={handleChange}
              />
              {existingFiles.education && !formData.education && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Current file uploaded
                </p>
              )}
            </div>
            
            <div>
              <FormInput
                label="Experience PDF"
                name="experienceLetter"
                type="file"
                accept="application/pdf"
                onChange={handleChange}
              />
              {existingFiles.experienceLetter && !formData.experienceLetter && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Current file uploaded
                </p>
              )}
            </div>
            
            <div>
              <FormInput
                label="Security Clearance PDF"
                name="securityClearance"
                type="file"
                accept="application/pdf"
                onChange={handleChange}
              />
              {existingFiles.securityClearance && !formData.securityClearance && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Current file uploaded
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-4 custom-AddButton text-white font-bold rounded-lg shadow-lg disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading
              ? isEditMode
                ? "Updating..."
                : "Submitting..."
              : isEditMode
              ? `Update ${pageTitle}`
              : `Submit Registration`}
          </button>
        </form>
      </div>
    </div>
  );
}