import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";

import "react-datepicker/dist/react-datepicker.css";
import {
  useGetQuery,
  usePostMutation,
  useDeleteMutation,
  usePatchMutation,
} from "../../api/apiSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  setCategories,
  deleteCategory,
} from "../../features/categories/catogriesSlice";
import Header from "../ui/Header";
import { initialState } from "../students/addStudentModal/initialData";
import { format } from "date-fns";
import SwitchButton from "./SwitchButton";
import AddAnnouncementsForm from "./AddAnnouncementsForm";
import AnnouncementsDetails from "./AnnouncementsDetails";
import Announcement from "../../assets/images/navbar/announcement.png";
import { showToast } from "../ui/common/ShowToast";
import imageCompression from "browser-image-compression";

const defaultState = {
  title: "",
  description: "",
  // active_status: false,
  image: null,
};

const Announcements = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [switchStates, setSwitchStates] = useState({});
  const dispatch = useDispatch();
  const [post, { isLoading }] = usePostMutation();
  const [selectAvatar, setSelectAvatar] = useState(null);

  const signInValidation = Yup.object({
    image: Yup.mixed().required("Profile Image is required"),
    description: Yup.string().required("Description is required"),
    title: Yup.string().required("Title is required"),
  });
  const [activeTab, setActiveTab] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const { refetch: refetchAnnouncements } = useGetQuery({
    path: "/admin/announcements",
  });

  useEffect(() => {
    if (!activeTab) {
      refetchAnnouncements();
    }
  }, [activeTab, refetchAnnouncements]);

  const toggleSwitch = () => {
    setIsActive(!isActive);
  };

  const {
    handleBlur,
    handleChange,
    handleSubmit,
    setFieldValue,
    values,
    errors,
    validateForm,
    touched,
    setSubmitting,
    resetForm,
  } = useFormik({
    initialValues: defaultState,
    validationSchema: signInValidation,
    validateOnChange: true,
    validateOnBlur: true,

    onSubmit: (values, { setSubmitting, resetForm }) => {
      validateForm().then(async (validationErrors) => {
        if (Object.keys(validationErrors).length === 0) {
          try {
            const formData = new FormData();

            Object.keys(values).forEach((key) => {
              formData.append(key, values[key]);
            });
            // Append other form fields to the FormData object
            // formData.append("title", values.title);
            // formData.append("description", values.description);
            formData.append("active_status", isActive ? 1 : 0);

            const res = await post({
              path: "/admin/announcements/create",
              body: formData,
            }).unwrap();

            showToast("Added Successfully", "success");

            setIsActive(false);
            setSelectedImage(null);
          } catch (err) {
            console.error("Failed to login:", err);
          } finally {
            setSubmitting(false);
            resetForm();
          }
        } else {
          setSubmitting(false);
        }
      });
    },
  });

  const handleImageChange = async (event) => {
    const file = event.target.files[0];

    if (file) {
      // Validate file type
      const validFileTypes = ["image/jpeg", "image/png", "image/svg+xml"];
      if (!validFileTypes.includes(file.type)) {
        showToast(
          "Please select a valid image file (JPEG, PNG, SVG).",
          "error"
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

        setSelectedImage(URL.createObjectURL(file));
        setFieldValue("image", compressedFile); //
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="w-11/12 mx-auto ">
      <Header
        title="Announcements"
        setIsCreateModalOpen={setIsCreateModalOpen}
        isMultipleSelected={isMultipleSelected}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        showActionButton={false}
        icon={<img src={Announcement} alt="announcement" className="w-8" />}
      />

      <div className="w-full p-6 bg-white border rounded-md border-grayBorder">
        <div className="flex items-start justify-start mb-6">
          <button
            className={`py-2 rounded-l-lg w-44 ${
              activeTab
                ? "custom-AddButton text-white"
                : "bg-grayInActive text-black"
            }  font-semibold`}
            onClick={() => setActiveTab(true)}
          >
            Add Announcemnets
          </button>
          <button
            className={`py-2 rounded-r-lg w-44 ${
              !activeTab
                ? "custom-AddButton text-white"
                : "bg-grayInActive text-black"
            }  font-semibold`}
            onClick={() => setActiveTab(false)}
          >
            All Announcemnets
          </button>
        </div>
        {activeTab ? (
          <AddAnnouncementsForm
            handleSubmit={handleSubmit}
            handleBlur={handleBlur}
            handleChange={handleChange}
            setFieldValue={setFieldValue}
            errors={errors}
            values={values}
            touched={touched}
            handleImageChange={handleImageChange}
            selectedImage={selectedImage}
            isActive={isActive}
            toggleSwitch={toggleSwitch}
          />
        ) : (
          <AnnouncementsDetails />
        )}
      </div>
    </div>
  );
};

export default Announcements;
