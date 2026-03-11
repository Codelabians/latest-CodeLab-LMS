import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { signUPValidation } from "../instructorModal/SignUpValidations";
import { initialState } from "../../ui/instructorModal/initialData";
import FormInputPart1 from "../instructorModal/FormInputPart1";
import FormInputPart2 from "../instructorModal/FormInputPart2";
import { usePostMutation } from "../../../api/apiSlice";
import imageCompression from "browser-image-compression";
import { useDispatch, useSelector } from "react-redux";
import Goku from "../../../assets/images/instructor/dancingcat.gif";
// import { Hourglass, Oval, ProgressBar } from "react-loader-spinner";
import {
  setCredentials,
  selectAuthStatus,
  selectAuthError,
} from "../../../features/auth/authSlice";
import { toast } from "react-toastify";
import showError from "../common/ShowError";
import { showToast } from "../common/ShowToast";
import LoaderComponent from "../common/LoaderComponent";

const AccountForm = ({
  setIsOpen,
  submitButtonText,
  refetchInstructor,
  instructorApi,
}) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [selectedDate, setSelectedDate] = useState({
    startDate: null,
    endDate: null,
  });

  const [hostilize, setHostilize] = useState(false);
  const [post, { isLoading }] = usePostMutation();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const [selectedFacilities, setSelectedFacilities] = useState(null);
  const [loader, setLoader] = useState(false);

  const [selectedImage, setSelectedImage] = useState({});

  const {
    handleBlur,
    handleChange,
    handleSubmit,
    setFieldValue,
    values,
    errors,
    validateForm,
    touched,
    resetForm,
  } = useFormik({
    initialValues: initialState,
    validationSchema: signUPValidation,
    validateOnChange: true,
    validateOnBlur: true,

    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setFormSubmitted(true);
      setFormValues(values);

      const valuesWithPassword = {
        ...values,
        facilities: selectedFacilities,
        is_hostalize: hostilize ? 1 : 0,
        password: "hello12345",
        active_status: 1,
        fixed_fee_date: "2034-04-03",
      };

      // Run validation first and show errors immediately
      const validationErrors = await validateForm();

      // If there are validation errors, set the form as invalid and don't proceed further
      if (Object.keys(validationErrors).length > 0) {
        setSubmitting(false); // Stop submitting state
        return; // Do not proceed with the API call
      }

      // If no validation errors, proceed with the submission
      const formData = new FormData();
      Object.keys(valuesWithPassword).forEach((key) => {
        const value = valuesWithPassword[key];
        if (key === "facilities" || key === "additional_certificate") {
          value.forEach((facility) => formData.append(`${key}[]`, facility));
        } else if (
          key === "user_image" ||
          key === "cnic_doc" ||
          key === "resume" ||
          key === "contract" ||
          key === "education" ||
          key === "experience_letter"
        ) {
          if (Array.isArray(value)) {
            value.forEach((file) => {
              formData.append(key, file, file.name);
            });
          } else {
            formData.append(key, value, value.name);
          }
        } else {
          formData.append(key, value);
        }
      });

      try {
        setLoader(true);

        const response = await post({
          path: instructorApi
            ? "/admin/teacher/store"
            : "/admin/employee/store",
          body: formData,
        }).unwrap();

        showToast("Added Successfully", "success");
        setIsOpen(false);
        resetForm();
      } catch (err) {
        showError(err);
      } finally {
        refetchInstructor();
        setSubmitting(false);
        setLoader(false);
      }
    },
  });

  // Handle All Images Format
  const handleImageChange = async (event) => {
    const { name, files } = event.target;
    const selectedFiles = Array.from(files); // Convert FileList to Array

    let validFileTypes = [];
    if (name === "user_image" || name === "cnic_doc") {
      validFileTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    } else if (
      name === "resume" ||
      name === "contract" ||
      name === "education" ||
      name === "experience_letter" ||
      name === "additional_certificate"
    ) {
      validFileTypes = [
        "application/pdf",
        // "application/msword",
        // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
    }

    const validFiles = selectedFiles.filter(
      (file) => validFileTypes.includes(file.type) && file.size <= 1048576,
    );

    if (validFiles.length === 0) {
      showToast(
        name === "resume" ||
          name === "contract" ||
          name === "education" ||
          name === "experience_letter" ||
          name === "additional_certificate"
          ? "Please select a valid PDF file with size <= 1 MB."
          : "Please select a valid image file (JPEG, PNG, SVG) with size <= 1 MB.",
        "error",
      );
      return;
    }

    try {
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          let processedFile = file;

          if (validFileTypes.includes(file.type)) {
            if (file.type.startsWith("image/")) {
              const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 500,
                useWebWorker: true,
              };
              processedFile = await imageCompression(file, options);
            }
          }

          return {
            originalFile: file,
            processedFile: processedFile,
            objectURL: URL.createObjectURL(processedFile),
          };
        }),
      );

      setSelectedImage((prevImages) => ({
        ...prevImages,
        [name]: processedFiles.map((file) => [
          file.originalFile,
          file.objectURL,
        ]),
      }));

      setFieldValue(
        [name],
        processedFiles.map((file) => file.processedFile),
      );
    } catch (error) {
      console.log("Error processing files:", error);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleBatchChange = (e, field) => {
    const value = e.value;
    const uuid = e.uuid; // Assuming uuid is part of the selected option
    setFieldValue(field, value); // Updated to set form value
    setFieldValue(`${field}_uuid`, uuid); // Updated to set UUID
  };

  return (
    <>
      {loader && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 ">
          <div className="">
            <LoaderComponent />
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`flex flex-col items-center w-full gap-5 py-4 relative  `}
        id="body2"
      >
        <div className="w-full">
          <FormInputPart1
            handleBlur={handleBlur}
            handleChange={handleChange}
            values={values}
            errors={errors}
            touched={touched}
            setFieldValue={setFieldValue}
            handleImageChange={handleImageChange}
            resetForm={resetForm}
            validateForm={validateForm}
            selectedImage={selectedImage}
          />

          <FormInputPart2
            handleBlur={handleBlur}
            handleChange={handleChange}
            values={values}
            errors={errors}
            touched={touched}
            setFieldValue={setFieldValue}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            resetForm={resetForm}
            handleImageChange={handleImageChange}
            validateForm={validateForm}
            selectedImage={selectedImage}
            // user_id={user_id}
            handleBatchChange={handleBatchChange}
            // setJoinningDate={setJoinningDate}
            // joinning={joinning}
            setSelectedFacilities={setSelectedFacilities}
          />
          <div className="flex items-center gap-2 ">
            <h1 className="font-semibold tracking-wide capitalize">
              Hostelite
            </h1>
            <input
              id="hostilize"
              name="hostilize"
              type="checkbox"
              checked={hostilize}
              className="cursor-pointer"
              onChange={(e) => setHostilize(e.target.checked)}
            />
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-6 ">
          <button
            type="submit"
            className="custom-AddButton text-white py-2 rounded min-w-[134px] max-w-[134px] font-semibold font-poppins text-base transform transition-transform duration-300 ease-in-out hover:scale-105"
          >
            {submitButtonText}
          </button>
          <button
            onClick={closeModal}
            className="bg-buttonGray text-heading py-2 rounded min-w-[134px] max-w-[134px] font-semibold font-poppins text-base transform transition-transform duration-300 ease-in-out hover:scale-105"
          >
            Cancel
          </button>
        </div>

        {status === "loading" && <p>Loading...</p>}
        {status === "failed" && <p>Error: {error}</p>}
      </form>
    </>
  );
};

export default AccountForm;
