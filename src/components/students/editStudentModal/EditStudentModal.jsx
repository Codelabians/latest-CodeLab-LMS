/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import imageCompression from "browser-image-compression";
import { format } from "date-fns";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import CloseIcon from "../../../assets/icons/Close";
import LoaderComponent from "../../ui/common/LoaderComponent";
import { showToast } from "../../ui/common/ShowToast";

const EditStudentModal = ({
  setIsOpen,
  isOpen,
  refetchStudents,
  initialValues = {},
  studentId,
  onSubmit,
}) => {
  const [selectedImagePreview, setSelectedImagePreview] = useState(
    initialValues?.user_image || null
  );
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [loader, setLoader] = useState(false);

  const formik = useFormik({
    initialValues: {
      firstName: initialValues.firstName || "",
      lastName: initialValues.lastName || "",
      email: initialValues.email || "",
      fixed_fee: initialValues.fixed_fee || "",
      cnic: initialValues.cnic || "",
      phoneNo: initialValues.phoneNo || "",
      qualification: initialValues.qualification || "",
      guardianName: initialValues.guardianName || "",
      guardianPhoneNo: initialValues.guardianPhoneNo || "",
      address: initialValues.address || "",
      gender: initialValues.gender || "",
      city: initialValues.city || "",
      class_id: initialValues.class_id || "",
      fixed_fee_date: initialValues.fixed_fee_date
        ? new Date(initialValues.fixed_fee_date)
        : null,
      dateOfBirth: initialValues.dateOfBirth
        ? new Date(initialValues.dateOfBirth)
        : null,
      bio: initialValues.bio || "",
      is_hostalize: initialValues.is_hostalize || false,
      marital_status: initialValues.marital_status || "",
      instructor: initialValues.instructor || "",
      user_image: initialValues.user_image || null,
      batchOptions: initialValues.batchOptions || [],
      teacherOptions: initialValues.teacherOptions || [],
    },

    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const validationErrors = await formik.validateForm();
      if (Object.keys(validationErrors).length > 0) {
        showToast(
          "Please fill all required fields correctly, including Instructor.",
          "error"
        );
        setSubmitting(false);
        return;
      }

      setLoader(true);
      try {
        const formattedValues = {
          ...values,
          fixed_fee_date: values.fixed_fee_date
            ? format(values.fixed_fee_date, "yyyy-MM-dd")
            : "",
          dateOfBirth: values.dateOfBirth
            ? format(values.dateOfBirth, "yyyy-MM-dd")
            : "",
          user_image: selectedImageFile,
        };

        await onSubmit(formattedValues);
        resetForm({ values: initialValues });
        setSelectedImagePreview(initialValues.user_image || null);
        setSelectedImageFile(null);
        setIsOpen(false); // Close modal on successful submission
      } catch (err) {
        console.error("Error in EditStudentModal submit:", err);
        showToast(
          "Failed to update student: " + (err.data?.message || err.message),
          "error"
        );
      } finally {
        setLoader(false);
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (isOpen && initialValues?.user_image) {
      setSelectedImagePreview(initialValues.user_image);
    }
    // Log initial values for debugging
  }, [initialValues, isOpen]);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validFileTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!validFileTypes.includes(file.type)) {
      return showToast(
        "Please select a valid image file (JPEG, PNG, SVG).",
        "error"
      );
    }

    if (file.size > 1048576) {
      return showToast("Image size should not exceed 1 MB.", "error");
    }

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      });
      setSelectedImagePreview(URL.createObjectURL(file));
      setSelectedImageFile(compressedFile);
      formik.setFieldValue("user_image", compressedFile);
    } catch (err) {
      console.error("Image compression failed:", err);
      showToast("Image compression failed. Try again.", "error");
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    formik.resetForm({ values: initialValues });
    setSelectedImagePreview(initialValues.user_image || null);
    setSelectedImageFile(null);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-3 w-[50%] rounded-[10px] shadow-lg">
            <div className="flex justify-end">
              <button onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            <h1 className="pb-0 text-2xl font-bold tracking-wide text-center">
              Edit Student
            </h1>
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col items-center w-full gap-5 py-4"
            >
              {loader && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                  <LoaderComponent />
                </div>
              )}
              <div className="w-full">
                <StudentFormPart1
                  handleBlur={formik.handleBlur}
                  handleChange={formik.handleChange}
                  values={formik.values}
                  errors={formik.errors}
                  touched={formik.touched}
                />
                <StudentFormPart2
                  handleBlur={formik.handleBlur}
                  handleChange={formik.handleChange}
                  values={formik.values}
                  errors={formik.errors}
                  touched={formik.touched}
                  setFieldValue={formik.setFieldValue}
                  selectedDate={{
                    startDate: formik.values.dateOfBirth,
                    endDate: null,
                  }}
                  setSelectedDate={(date) =>
                    formik.setFieldValue(
                      "dateOfBirth",
                      date.startDate
                        ? new Date(date.startDate).toISOString().split("T")[0]
                        : ""
                    )
                  }
                  feeSubmissionData={{
                    startDate: formik.values.fixed_fee_date,
                    endDate: null,
                  }}
                  setFeeSubmissionDate={(date) =>
                    formik.setFieldValue(
                      "fixed_fee_date",
                      date.startDate
                        ? new Date(date.startDate).toISOString().split("T")[0]
                        : ""
                    )
                  }
                  batchId={formik.values.class_id}
                  setBatchId={(value) =>
                    formik.setFieldValue("class_id", value)
                  }
                  selectedImage={selectedImagePreview}
                  handleImageChange={handleImageChange}
                  fields={[
                    {
                      name: "batch",
                      options: initialValues.batchOptions || [],
                    },
                    {
                      name: "instructor",
                      options: initialValues.teacherOptions || [],
                    },
                  ]}
                />
                <div className="flex items-center gap-2 pt-4">
                  <h1 className="font-semibold tracking-wide capitalize">
                    Hostilize
                  </h1>
                  <input
                    id="is_hostalize"
                    name="is_hostalize"
                    type="checkbox"
                    checked={formik.values.is_hostalize}
                    className="cursor-pointer"
                    onChange={(e) =>
                      formik.setFieldValue("is_hostalize", e.target.checked)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-center gap-3 pt-6">
                <button
                  type="submit"
                  className="custom-AddButton text-white py-2 rounded min-w-[134px] max-w-[134px] font-semibold font-poppins text-base transform transition-transform duration-300 ease-in-out hover:scale-105"
                >
                  Update Student
                </button>
                <button
                  onClick={closeModal}
                  type="button"
                  className="bg-buttonGray text-heading py-2 rounded min-w-[134px] max-w-[134px] font-semibold font-poppins text-base transform transition-transform duration-300 ease-in-out hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditStudentModal;
