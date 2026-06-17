import { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Phone,
  Pencil,
  Save,
  X,
  Camera,
  Loader2,
  KeyRound,
} from "lucide-react";
import {
  useGetQuery,
  usePatchMutation,
  usePostMutation,
} from "../../api/apiSlice";
import { getAdminProfile } from "../../features/adminProfile/adminProfileSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, setUserAvatar } from "../../features/auth/authSlice";
import UpdatePasswordModal from "./UpdatePasswordModal";
import { showToast } from "../ui/common/ShowToast";
import imageCompression from "browser-image-compression";
import SearchableSelect from "../ui/SearchableSelect";
import AddressAutocomplete from "../ui/AddressAutocomplete";

/* ─────────────── brand tokens (mirror EmployeeFormPage) ─────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const FIELD_BORDER = "#E2E8F0";
const SURFACE_ALT = "#F8FAFC";

const AdminProfile = () => {
  const [formState, setFormState] = useState({});
  const [initialFormState, setInitialFormState] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [patch] = usePatchMutation();
  const [post] = usePostMutation();
  const [passwordModal, setPasswordModal] = useState(false);

  const {
    data: adminProfileData,
    isLoading: adminProfileLoading,
    refetch: refetchAdminProfile,
  } = useGetQuery({
    path: "/system",
  });

  // Cities for the City dropdown — same seeded reference data the inquiry /
  // employee forms use. Value is the city *name* (stored as a plain string).
  const { data: citiesData } = useGetQuery({ path: "/core/cities/active" });
  const cityOptions = useMemo(
    () =>
      (citiesData?.data || []).map((c) => ({
        value: c.name,
        label: c.province_name ? `${c.name} · ${c.province_name}` : c.name,
      })),
    [citiesData],
  );

  useEffect(() => {
    // Seed from the API response when present, otherwise from the logged-in
    // user already in Redux (same source as the working top-right avatar/name).
    // The API envelope can be {data:{...}} or {data:{data:{...}}}; handle both.
    const src =
      adminProfileData?.data?.first_name ? adminProfileData.data
        : adminProfileData?.data?.data?.first_name ? adminProfileData.data.data
        : currentUser || null;
    if (src) {
      const data = {
        uuid: src.uuid,
        firstName: src.first_name,
        lastName: src.last_name,
        fatherName: src.father_name,
        dob: src.dob,
        email: src.email,
        password: "........",
        contact: src.contact,
        cnic: src.cnic,
        qualification: src.qualification,
        father_contact: src.father_contact,
        address: src.address,
        city: src.city,
        bio: src.bio,
        marital_status: src.marital_status,
        gender: src.gender,
      };
      const img = src.avatar?.file_url || src.avatar?.url || src.image?.file_url || null;
      if (img) {
        setSelectedImage(img);
        // Keep the header avatar (top-right chip) in sync the moment a new
        // photo is uploaded or the profile reloads.
        localStorage.setItem("adminProfileImage", img);
        // Only dispatch when the avatar actually changed. setUserAvatar creates
        // a NEW `state.user` reference, so dispatching unconditionally here would
        // change `currentUser` (an effect dependency) and re-run this effect on
        // every render → "Maximum update depth exceeded" (React error #185),
        // which surfaced in production where admins always have an avatar.
        if (img !== currentUser?.avatar?.file_url) {
          dispatch(setUserAvatar(img));
        }
      }
      setFormState(data);
      setInitialFormState(data);
      if (adminProfileData?.data) {
        dispatch(getAdminProfile({ adminProfile: src }));
      }
    }
  }, [adminProfileData, currentUser, dispatch]);

  const handleSaveEdit = async () => {
    // Check if there are any errors in the form
    const hasErrors = Object.values(errors).some((error) => error);

    if (hasErrors) {
      showToast("Please fix the highlighted errors first.", "error");
      return;
    }

    // The backend (UserUpdateRequest) reads camelCase keys. Map the few
    // snake_case fields kept in formState, and never send the masked password.
    const rawPayload = {
      firstName: formState.firstName,
      lastName: formState.lastName,
      fatherName: formState.fatherName,
      email: formState.email,
      contact: formState.contact,
      fatherContact: formState.father_contact,
      dob: formState.dob,
      gender: formState.gender,
      address: formState.address,
      city: formState.city,
      bio: formState.bio,
      qualification: formState.qualification,
      cnic: formState.cnic,
      maritalStatus: formState.marital_status,
    };

    // Every field is typed `string` (non-nullable) on the backend, so sending
    // null/undefined/empty values fails validation ("the X field must be a
    // string"). Email is required — always keep it; drop the rest when blank.
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(
        ([key, value]) =>
          key === "email" || (value !== null && value !== undefined && value !== ""),
      ),
    );

    try {
      await patch({ path: "/system/update-auth", body: payload }).unwrap();
      setIsEditMode(false);
      refetchAdminProfile();
      showToast("Profile updated successfully", "success");
    } catch (error) {
      showToast(error?.data?.message || "Failed to update profile.", "error");
    }
  };

  // ── Field groups, rendered as standard sections ──
  const personalFields = [
    { label: "First Name", name: "firstName", type: "text" },
    { label: "Last Name", name: "lastName", type: "text" },
    { label: "Father Name", name: "fatherName", type: "text" },
    { label: "Date of Birth", name: "dob", type: "date" },
    {
      label: "Gender",
      name: "gender",
      type: "select",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ],
    },
    {
      label: "Marital Status",
      name: "marital_status",
      type: "select",
      options: [
        { value: "single", label: "Single" },
        { value: "married", label: "Married" },
      ],
    },
    { label: "Qualification", name: "qualification", type: "text" },
  ];

  const accountFields = [
    { label: "Email", name: "email", type: "email" },
    { label: "Phone", name: "contact", type: "text" },
    { label: "CNIC", name: "cnic", type: "text" },
    { label: "Guardian Phone No", name: "father_contact", type: "text" },
    {
      label: "Password",
      name: "password",
      type: "password",
      value: "********",
      alwaysDisabled: true,
      hasUpdateButton: true,
    },
  ];

  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
      case "lastName":
      case "fatherName":
        if (!/^[A-Za-z\s]+$/.test(value)) {
          return "Only alphabets  are allowed";
        } else if (value.length < 3) {
          return "Alphabets must be at least 3 characters";
        }
        break;

      case "contact":
      case "father_contact":
        // Ensure the phone number starts with "03" and has exactly 11 digits
        if (!/^03\d{9}$/.test(value)) {
          return "Phone no must start with '03' and contain 11 digits";
        }
        break;

      default:
        return null;
    }
  };

  const handleChange = (e, field) => {
    // Native <select> and <input> both deliver the value on e.target.value.
    let value = e?.target ? e.target.value : e?.value;

    // Check if the field is firstName or lastName for specific validation
    if (
      field.name === "firstName" ||
      field.name === "lastName" ||
      field.name === "fatherName"
    ) {
      // Replace non-alphabetic characters
      const alphabeticCount = value.replace(/[^A-Za-z]/g, "").length;

      // Ensure the input contains at least 3 alphabetic characters
      if (alphabeticCount < 3) {
        setErrors({
          ...errors,
          [field.name]: "Minimum 3 alphabets are required.",
        });
      } else {
        // Clear the error if the validation passes
        setErrors({
          ...errors,
          [field.name]: "",
        });
      }
    }
    if (field.name === "qualification") {
      if (value.length === 0) {
        setErrors({
          ...errors,
          [field.name]: "Qualification field are required.",
        });
      } else {
        // Clear the error if the validation passes
        setErrors({
          ...errors,
          [field.name]: "",
        });
      }
    }

    if (field.name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        setErrors({
          ...errors,
          [field.name]: "Please enter a valid email address.",
        });
      } else {
        // Clear the error if the validation passes
        setErrors({
          ...errors,
          [field.name]: "",
        });
      }
    }
    // Add CNIC field validation
    if (field.name === "cnic") {
      value = value.replace(/[^0-9]/g, "");

      // Check if CNIC has more than 13 digits
      if (value.length > 13) {
        value = value.slice(0, 13); // Trim to 13 digits if exceeded
      }

      if (value.length <= 5) {
        // 5 or fewer digits — no dash needed yet.
      } else if (value.length <= 12) {
        value = `${value.slice(0, 5)}-${value.slice(5)}`;
      } else {
        value = `${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12)}`;
      }

      // Validate CNIC format
      if (value.length !== 15) {
        setErrors({
          ...errors,
          [field.name]: "CNIC must be exactly 13 digits.",
        });
      } else {
        setErrors({
          ...errors,
          [field.name]: "",
        });
      }
    }

    if (field.name === "contact" || field.name === "father_contact") {
      value = value.replace(/[^0-9]/g, "");

      // Check if phone has more than 11 digits
      if (value.length > 11) {
        value = value.slice(0, 11); // Trim to 11 digits if exceeded
      }

      // Validate phone format
      if (value.length !== 11) {
        setErrors({
          ...errors,
          [field.name]: "Phone must be exactly 11 digits.",
        });
      } else {
        setErrors({
          ...errors,
          [field.name]: "",
        });
      }
    }

    // Apply general field validation
    const errorMessage = validateField(field.name, value);

    // If there's already an error from the specific validation, retain it
    if (errorMessage) {
      setErrors({
        ...errors,
        [field.name]: errorMessage,
      });
    }

    // Update the form state with the new value
    setFormState({
      ...formState,
      [field.name]: value,
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];

    if (file) {
      // Validate file type
      const validFileTypes = ["image/jpeg", "image/png", "image/svg+xml"];
      if (!validFileTypes.includes(file.type)) {
        showToast(
          "Please select a valid image file (JPEG, PNG, SVG).",
          "error",
        );
        return; // Exit the function if the file type is invalid
      }
      if (file.size > 1048576) {
        showToast("Image size should not exceed 1 MB.", "error");
        return;
      }

      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 500,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        const formData = new FormData();
        formData.append("avatar", compressedFile);

        setSelectedImage(URL.createObjectURL(file));
        await post({
          path: "/system/upload-avatar?_method=patch",
          body: formData,
        }).unwrap();
        refetchAdminProfile();
      } catch (error) {
        console.error("Error uploading image:", error);
        showToast("Failed to upload image. Please try again.", "error");
      }
    }
  };

  const handleEditImageClick = () => {
    fileInputRef.current.click();
  };

  const handleCancelClick = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setErrors({});
  };

  const initials =
    `${(formState.firstName || "").charAt(0)}${(formState.lastName || "").charAt(0)}`.toUpperCase() ||
    "?";

  /* ─────────────── reusable field renderer (standard style) ─────────── */
  const renderField = (field) => {
    const disabled = field.alwaysDisabled || !isEditMode;
    const hasError = !!errors[field.name];

    return (
      <div
        key={field.name}
        className={`flex flex-col gap-1.5 ${field.full ? "md:col-span-2 lg:col-span-3" : ""}`}
      >
        <label
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: TEXT_SECONDARY }}
        >
          {field.label}
        </label>

        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            value={formState[field.name] ?? ""}
            onChange={(e) => handleChange(e, field)}
            disabled={disabled}
            rows={2}
            className="px-3 py-2 text-sm border rounded-md outline-none resize-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed"
            style={{
              borderColor: hasError ? "#FCA5A5" : FIELD_BORDER,
              color: TEXT_PRIMARY,
              background: disabled ? SURFACE_ALT : "white",
            }}
          />
        ) : field.type === "select" ? (
          <select
            value={formState[field.name] ?? ""}
            onChange={(e) => handleChange(e, field)}
            disabled={disabled}
            className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed"
            style={{
              borderColor: hasError ? "#FCA5A5" : FIELD_BORDER,
              color: TEXT_PRIMARY,
              background: disabled ? SURFACE_ALT : "white",
            }}
          >
            <option value="">Select…</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="relative">
            <input
              type={field.type || "text"}
              name={field.name}
              value={field.value ?? formState[field.name] ?? ""}
              onChange={(e) => handleChange(e, field)}
              disabled={disabled}
              className={`w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed ${
                field.hasUpdateButton ? "pr-24" : ""
              }`}
              style={{
                borderColor: hasError ? "#FCA5A5" : FIELD_BORDER,
                color: TEXT_PRIMARY,
                background: disabled ? SURFACE_ALT : "white",
              }}
            />
            {field.hasUpdateButton && (
              <button
                type="button"
                onClick={() => setPasswordModal((p) => !p)}
                className="absolute inline-flex items-center gap-1.5 px-3 -translate-y-1/2 rounded-md right-1.5 top-1/2 h-[calc(100%-8px)] text-xs font-semibold text-white"
                style={{ background: BRAND_RED }}
              >
                <KeyRound size={12} />
                Update
              </button>
            )}
          </div>
        )}

        {hasError && (
          <p className="text-[11px] font-medium" style={{ color: "#EF4444" }}>
            {errors[field.name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
        color: TEXT_PRIMARY,
      }}
    >
      <div className="w-full">
        {/* ─── Page header ─── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <User size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>
                My profile
              </h1>
              <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                View and update your personal details and account information.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-md"
                style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
              >
                <Pencil size={14} />
                Edit profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md"
                  style={{ background: "#F1F5F9", color: TEXT_PRIMARY }}
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-md"
                  style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
                >
                  <Save size={14} />
                  Save changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── Identity / hero card ─── */}
        <section className="p-5 mb-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              {adminProfileLoading ? (
                <div
                  className="grid w-24 h-24 rounded-2xl place-items-center"
                  style={{ background: SURFACE_ALT, border: `1px solid ${BORDER}` }}
                >
                  <Loader2 size={28} className="animate-spin" style={{ color: BRAND_RED }} />
                </div>
              ) : selectedImage ? (
                <img
                  src={selectedImage}
                  alt="profile"
                  className="object-cover w-24 h-24 rounded-2xl"
                  style={{ border: `2px solid ${BORDER}` }}
                />
              ) : (
                <div
                  className="grid w-24 h-24 text-white rounded-2xl place-items-center"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                    fontSize: 30,
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={handleEditImageClick}
                title="Change photo"
                className="absolute grid text-white rounded-full -bottom-1 -right-1 place-items-center"
                style={{ width: 30, height: 30, background: BRAND_RED, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
              >
                <Camera size={14} />
              </button>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageChange} />
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
                {`${formState.firstName || ""} ${formState.lastName || ""}`.trim() || "My Profile"}
              </h2>
              <p className="text-sm" style={{ color: TEXT_MUTED }}>
                {formState.email || "Administrator"}
              </p>
              <span
                className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
              >
                Administrator
              </span>
            </div>
          </div>
        </section>

        {/* ─── Personal details ─── */}
        <section className="p-5 mb-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
            <User size={15} style={{ color: BRAND_RED }} />
            Personal details
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalFields.map(renderField)}

            {/* City — searchable dropdown from the seeded cities catalog */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: TEXT_SECONDARY }}
              >
                City
              </label>
              <SearchableSelect
                options={cityOptions}
                value={formState.city || ""}
                onChange={(v) => setFormState((s) => ({ ...s, city: v || "" }))}
                placeholder={cityOptions.length ? "Search city…" : "No cities yet"}
                disabled={!isEditMode || cityOptions.length === 0}
              />
            </div>

            {/* Address — shared autocomplete (full width) */}
            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
              <label
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: TEXT_SECONDARY }}
              >
                Address
              </label>
              <AddressAutocomplete
                value={formState.address || ""}
                onChange={(v) => setFormState((s) => ({ ...s, address: v }))}
                disabled={!isEditMode}
                placeholder="Street, area, city…"
              />
            </div>

            {/* Bio — free text (full width) */}
            {renderField({ label: "Bio", name: "bio", type: "textarea", full: true })}
          </div>
        </section>

        {/* ─── Contact & account ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
            <Phone size={15} style={{ color: BRAND_RED }} />
            Contact &amp; account
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accountFields.map(renderField)}
          </div>

          {isEditMode && (
            <div className="flex justify-end gap-2 pt-5 mt-5 border-t" style={{ borderColor: BORDER }}>
              <button
                type="button"
                onClick={handleCancelClick}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-md"
                style={{ background: "#F1F5F9", color: TEXT_PRIMARY }}
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-md"
                style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
              >
                <Save size={14} />
                Save changes
              </button>
            </div>
          )}
        </section>
      </div>

      {passwordModal && (
        <UpdatePasswordModal
          setPasswordModal={setPasswordModal}
          passwordModal={passwordModal}
        />
      )}
    </div>
  );
};

export default AdminProfile;
