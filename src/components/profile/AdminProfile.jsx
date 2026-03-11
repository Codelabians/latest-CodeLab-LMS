import React, { useEffect, useRef, useState } from "react";
import Header from "../ui/Header";
import Select from "react-select";
import ProfilePhoto from "../../assets/images/profile/profilePhoto.avif";
import {
  useGetQuery,
  usePatchMutation,
  usePostMutation,
} from "../../api/apiSlice";
import { getAdminProfile } from "../../features/adminProfile/adminProfileSlice";
import { useDispatch } from "react-redux";
import UpdatePasswordModal from "./UpdatePasswordModal";
import { showToast } from "../ui/common/ShowToast";
import imageCompression from "browser-image-compression";

const AdminProfile = () => {
  const [formState, setFormState] = useState({});
  const [initialFormState, setInitialFormState] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  // const [modalOpen, setModalOpen] = useState(true);
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const [patch] = usePatchMutation();
  const [post] = usePostMutation();
  const [passwordModal, setPasswordModal] = useState(false);

  const {
    data: adminProfileData,
    error: adminProfileError,
    isLoading: adminProfileLoading,
    refetch: refetchAdminProfile,
  } = useGetQuery({
    path: "/admin",
  });

  useEffect(() => {
    refetchAdminProfile();
  }, [adminProfileData]);

  useEffect(() => {
    if (adminProfileData) {
      const data = {
        uuid: adminProfileData?.data?.uuid,
        firstName: adminProfileData?.data?.first_name,
        lastName: adminProfileData?.data?.last_name,
        fatherName: adminProfileData?.data?.father_name,
        dob: adminProfileData?.data?.dob,
        email: adminProfileData?.data?.email,
        password: "........",
        contact: adminProfileData?.data?.contact,
        cnic: adminProfileData?.data?.cnic,
        qualification: adminProfileData?.data?.qualification,
        father_contact: adminProfileData?.data?.father_contact,
        address: adminProfileData?.data?.address,
        marital_status: adminProfileData?.data?.marital_status,
        gender: adminProfileData?.data?.gender,
        // active_status: adminProfileData?.data?.active_status,
      };
      setSelectedImage(adminProfileData?.data?.avatar?.file_url);
      setFormState(data);
      setInitialFormState(data);
      dispatch(
        getAdminProfile({
          adminProfile: adminProfileData.data,
        }),
      );
      // Store the new image in local storage
      localStorage.setItem(
        "adminProfileImage",
        adminProfileData?.data?.avatar?.file_url,
      );

      refetchAdminProfile();
    }
  }, [adminProfileData, dispatch]);

  // useEffect(() => {
  //   refetchAdminProfile();
  // }, []);

  const handleSaveEdit = async () => {
    // Check if there are any errors in the form
    const hasErrors = Object.values(errors).some((error) => error);

    if (hasErrors) {
      // If there are errors, prevent form submission
      console.error("Form contains errors. Please fix them before submitting.");
      return;
    }

    try {
      const response = await patch({
        path: "/admin/update-auth",
        body: formState,
      }).unwrap();
      setIsEditMode(false);
      refetchAdminProfile();
      if (response.message === "Success." && response.status === 1) {
        showToast("Edit Profile Successfully", "success");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const structure = [
    {
      label: "First Name",
      name: "firstName",
      type: "text",
      value: formState.firstName,
      isDisabled: !isEditMode,
    },
    {
      label: "Last Name",
      name: "lastName",
      type: "text",
      value: formState.lastName,
      isDisabled: !isEditMode,
    },
    {
      label: "Father Name",
      name: "fatherName",
      type: "text",
      value: formState.fatherName,
      isDisabled: !isEditMode,
    },
    {
      label: "Date of Birth",
      name: "dob",
      type: "date",
      value: formState.dob,
      isDisabled: !isEditMode,
    },
    {
      label: "Email",
      name: "email",
      type: "email",
      value: formState.email,
      isDisabled: !isEditMode,
    },
    {
      label: "Password",
      name: "password",
      type: "password",
      value: "********",
      isDisabled: true,
      hasUpdateButton: true, // Add a flag to indicate that this field has an update button
    },
    {
      label: "Phone",
      name: "contact",
      type: "text",
      value: formState.contact,
      isDisabled: !isEditMode,
    },
    {
      label: "CNIC",
      name: "cnic",
      type: "text",
      value: formState.cnic,
      isDisabled: !isEditMode,
    },
    {
      label: "Qualificaiton",
      name: "qualification",
      type: "text",
      value: formState.qualification,
      isDisabled: !isEditMode,
    },

    {
      label: "Guardian Phone No",
      name: "father_contact",
      type: "text",
      value: formState.father_contact,
      isDisabled: !isEditMode,
    },

    {
      label: "Marital Status",
      name: "marital_status",
      type: "select",
      value: formState.marital_status,
      options: [
        { value: "single", label: "Single" },
        { value: "married", label: "Married" },
      ],
      isDisabled: !isEditMode,
    },
    {
      label: "Gender",
      name: "gender",
      type: "select",
      value: formState.gender,
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ],
      isDisabled: !isEditMode,
    },

    // {
    //   label: "Active Status",
    //   name: "active_status",
    //   type: "select",
    //   value:
    //     (formState.active_status === 1 && "Active") ||
    //     (formState.active_status === 0 && "InActive"),
    //   options: [
    //     { value: 1, label: "Active" },
    //     { value: 0, label: "Inactive" },
    //   ],
    //   isDisabled: !isEditMode,
    // },
  ];

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#FF0000" : provided.backgroundColor,
      color: state.isSelected ? "white" : provided.color,

      "&:hover": {
        backgroundColor: state.isSelected ? "" : "#24A0ED",
        color: "white",
      },
    }),

    control: (provided, state) => ({
      ...provided,
      padding: "0.25rem", // similar to p-3 in Tailwind
      backgroundColor: "white",
      borderColor: state.isFocused
        ? "#E53E3E" // focus:ring-red-600
        : state.selectProps.errors && state.selectProps.touched
          ? "#E53E3E" // border-red-500
          : "#00000026", // default border color
      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(229, 62, 62, 0.75)" // focus:ring-2 focus:ring-red-600
        : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#E53E3E" : "#D1D5DB",
      },
      borderRadius: "10px", // rounded-lg
      width: "24rem", // w-full
    }),
    placeholder: (provided, state) => ({
      ...provided,
      color:
        state.selectProps.errors && state.selectProps.touched
          ? "transparent"
          : "black", // placeholder text color
    }),
    container: (provided) => ({
      ...provided,
      width: "100%",
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: "#4b5563",

      // }),
    }),
  };

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
    let value = field.type === "select" ? e.value : e.target.value;

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
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    // (/^[0-9--\s]*$/.test(inputValue)
    // Add CNIC field validation
    if (field.name === "cnic") {
      // Ensure the CNIC contains exactly 13 digits
      // const cnicRegex = /^[0-9\s]{1,13}*$/.test(value);
      value = value.replace(/[^0-9]/g, "");

      // Check if CNIC has more than 13 digits
      if (value.length > 13) {
        value = value.slice(0, 13); // Trim to 13 digits if exceeded
      }

      if (value.length <= 5) {
        value = value;
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
      // Ensure the CNIC contains exactly 13 digits
      // const cnicRegex = /^[0-9\s]{1,13}*$/.test(value);
      value = value.replace(/[^0-9]/g, "");

      // Check if CNIC has more than 13 digits
      if (value.length > 11) {
        value = value.slice(0, 11); // Trim to 13 digits if exceeded
      }

      // Validate CNIC format
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
        // alert("Please select a valid image file (JPEG, PNG, SVG).");
        showToast(
          "Please select a valid image file (JPEG, PNG, SVG).",
          "error",
        );
        return; // Exit the function if the file type is invalid
      }
      if (file.size > 1048576) {
        // alert("Image size should not exceed 1 MB.");
        showToast("Image size should not exceed 1 MB.", "error");
        return;
      }

      // const formData = new FormData();
      // // Ensure the key is 'avatar' as expected by the server
      // formData.append("avatar", file);

      // setSelectedImage(file);

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
        const response = await post({
          path: "/admin/upload-avatar?_method=patch",
          body: formData,
          // No need to set headers, FormData automatically handles this
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

  return (
    <div className="w-11/12 mx-auto font-poppins">
      <Header
        title="My Profile"
        buttontitle="Edit"
        headerButtonTittle={false}
        setIsEditMode={setIsEditMode}
      />
      <div className="bg-white w-full  ">
        <div className="flex gap-10 pl-[6.2rem] pt-6 items-center ">
          {!selectedImage ? (
            <img
              src={ProfilePhoto}
              alt="Profile"
              className="rounded-full h-44 w-44 object-cover"
            />
          ) : adminProfileLoading ? (
            <div className="rounded-full h-44 w-44  border border-gray    flex  items-center justify-center">
              <div className="h-10 w-10 border-4 border-x-grayCheckbox rounded-full   animate-spin duration-1000"></div>
            </div>
          ) : (
            <div className="rounded-full h-44 w-44 border-2 border-grayText">
              <img
                src={selectedImage}
                alt="profile"
                className=" object-cover w-full h-full rounded-full  "
              />
            </div>
          )}
          <div className="space-y-4">
            <p className="font-bold text-2xl">
              {`${formState.firstName} ${formState.lastName}`}
            </p>
            <p className="font-light">Administrator</p>
            <button
              onClick={handleEditImageClick}
              className="bg-slate-100 text-sm font-poppins font-semibold py-2 px-4 flex items-center gap-2 rounded-md transform transition-transform duration-300 ease-in-out hover:scale-105 hover:text-base"
            >
              Edit Image
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>
        </div>
        <div className="p-6 grid lg:grid-cols-2 grid-cols-1 lg:place-items-center lg:place-content-center  place-items-start ">
          {structure.map((field, index) => (
            <div key={index} className="mb-4 relative capitalize">
              <label className="flex flex-col text-gray-700 text-sm font-bold mb-2 ">
                {field.label}
              </label>
              {field.type === "select" ? (
                <Select
                  styles={customStyles}
                  placeholder={field.value}
                  isDisabled={!isEditMode}
                  onChange={(e) => handleChange(e, field)}
                  options={field.options}
                />
              ) : (
                <>
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    placeholder={field.placeholder}
                    className={`border border-grayBorder p-2 w-96 rounded-md text-sm  ${
                      !isEditMode && "bg-gray-200"
                    }`}
                    value={formState[field.name] || field.value || ""}
                    onChange={(e) => handleChange(e, field)}
                    // disabled={field.isDisabled}
                    disabled={field?.isDisabled}
                    // {field.hasUpdateButton &&  }
                    // isDisabled={field.hasUpdateButton && true}
                  />
                  {field.hasUpdateButton && (
                    <button
                      className=" absolute right-0 mt-[1px] w-24 mx-auto text-sm p-2  rounded-r-md custom-Update font-Montserrat text-white font-bold cursor-pointer  "
                      onClick={() => setPasswordModal(!passwordModal)}
                    >
                      Update
                    </button>
                  )}
                </>
              )}
              {errors[field.name] && (
                <p className="text-red-500 text-xs">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        {isEditMode && (
          <div className="flex justify-end gap-2 mb-6 mr-[6.4rem]">
            <button
              className="p-3 custom-AddButton w-36 text-white rounded-md hover:bg-bloodred"
              onClick={handleSaveEdit}
            >
              Save
            </button>
            <button
              className="p-3 custom-AddButton w-36 text-white rounded-md hover:bg-bloodred"
              onClick={() => handleCancelClick()}
            >
              Cancel
            </button>
          </div>
        )}
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
