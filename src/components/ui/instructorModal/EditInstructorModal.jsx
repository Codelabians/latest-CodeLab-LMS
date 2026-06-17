/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FormInputPart1 from "./FormInputPart1";
import FormInputPart2 from "./FormInputPart2";
import {
  useGetQuery,
  usePatchMutation,
  usePutMutation,
} from "../../../api/apiSlice";
import { toast } from "react-toastify";
import CloseIcon from "../../../assets/icons/Close";

const validationSchema = Yup.object({
  qualification: Yup.string().required("Qualification is required"),
  guardianName: Yup.string().required("Guardian Name is required"),
  guardianPhoneNo: Yup.string().required("Guardian Phone No is required"),
  gender: Yup.string().required("Gender is required"),
  city: Yup.string().required("City is required"),
  address: Yup.string().required("Address is required"),
  marital_status: Yup.string().required("Marital Status is required"),
  designation: Yup.string().required("Designation is required"),
  basic_salary: Yup.string().required("Basic Salary is required"),
  dateOfBirth: Yup.string().required("Date of Birth is required"),
  bio: Yup.string().required("Note is required"),
  facilities: Yup.string().required("Facilities are required"),
});

const EditInstructorModal = ({
  onClose,
  refetchInstructor,
  isOpen,
  initialValues,
  selectedTrainerData,
}) => {
  if (!isOpen) return null;

  const [putInstructor] = usePutMutation();
  const [patchInstructor] = usePatchMutation();
  const [selectedDate, setSelectedDate] = useState({
    startDate: null,
    endDate: null,
  });
  const [selectedImage, setSelectedImage] = useState({});
  const [selectedFacilities, setSelectedFacilities] = useState([]);

  const {
    data: facilitiesData,
    isLoading,
    error,
  } = useGetQuery({
    path: "admin/facilities",
  });

  const facilityOption = useMemo(() => {
    return (
      facilitiesData?.data?.map((f) => ({
        label: f.facility_name,
        value: f.id,
      })) || []
    );
  }, [facilitiesData]);

  // useEffect(() => {
  //   if (Array.isArray(initialValues?.facilities) && facilityOption?.length > 0) {
  //     const matched = facilityOption.filter((option) =>
  //       initialValues.facilities.includes(option.value)
  //     );
  //     setSelectedFacilities(matched);
  //   }
  // }, [initialValues.facilities, facilityOption]);
  useEffect(() => {
    if (initialValues?.facilities && facilityOption?.length > 0) {
      const facilityIds = initialValues.facilities
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
      const matched = facilityOption.filter((option) =>
        facilityIds.includes(option.value.toString())
      );
      setSelectedFacilities(matched);
    }
  }, [initialValues.facilities, facilityOption]);

  useEffect(() => {
    if (initialValues?.dateOfBirth) {
      setSelectedDate({
        startDate: new Date(initialValues.dateOfBirth),
        endDate: new Date(initialValues.dateOfBirth),
      });
    }
  }, [initialValues]);

  const handleImageChange = (e) => {
    const { name, files } = e.target;
    setSelectedImage((prev) => ({
      ...prev,
      [name]: [[...files]],
    }));
  };

  // const handleSubmit = async (values, { setSubmitting }) => {
  //   try {
  //     const formData = new FormData();
  //     for (let key in values) {
  //       formData.append(key, values[key]);
  //     }

  //     Object.keys(selectedImage).forEach((key) => {
  //       if (selectedImage[key]?.[0]?.[0]) {
  //         formData.append(key, selectedImage[key][0][0]);
  //       }
  //     });

  //     const response = await putInstructor({
  //       path: `/admin/tech-trainers/${selectedTrainerData.id}`,
  //       body: formData,
  //     }).unwrap();

  //     toast.success("Instructor updated successfully!");
  //     refetchInstructor?.();
  //     onClose();
  //   } catch (error) {
  //     console.error("Error updating instructor:", error);
  //     toast.error("Failed to update instructor.");
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      for (let key in values) {
        if (key === "facilities") {
          formData.append(key, values[key]); // Send as string
        } else {
          formData.append(key, values[key]);
        }
      }

      Object.keys(selectedImage).forEach((key) => {
        if (selectedImage[key]?.[0]?.[0]) {
          formData.append(key, selectedImage[key][0][0]);
        }
      });

      const response = await patchInstructor({
        path: `/admin/teacher/${selectedTrainerData.uuid}?_method=patch`,
        body: formData,
      }).unwrap();

      toast.success("Instructor updated successfully!");
      refetchInstructor?.();
      onClose();
    } catch (error) {
      console.error("Error updating instructor:", error);
      toast.error("Failed to update instructor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-[90%] md:w-[90%] max-h-screen overflow-y-auto p-6">
        <div onClick={onClose} className="float-end">
          <CloseIcon />
        </div>
        <h2 className="mb-4 text-2xl font-semibold text-center">
          Edit Instructor
        </h2>

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            values,
            errors,
            touched,
            setFieldValue,
          }) => (
            <Form>
              <FormInputPart1
                handleChange={handleChange}
                handleBlur={handleBlur}
                values={values}
                errors={errors}
                touched={touched}
              />
              <FormInputPart2
                handleChange={handleChange}
                handleBlur={handleBlur}
                values={values}
                errors={errors}
                touched={touched}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setFieldValue={setFieldValue}
                selectedFacilities={selectedFacilities}
                setSelectedFacilities={(selected) => {
                  setSelectedFacilities(selected);
                  setFieldValue(
                    "facilities",
                    selected?.map((s) => s.value).join(",")
                  );
                }}
                handleImageChange={handleImageChange}
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-white bg-gray-500 rounded"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Save Changes
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EditInstructorModal;
