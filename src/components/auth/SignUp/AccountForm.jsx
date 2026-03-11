import { useState } from "react";
import { useFormik } from "formik";
import { signUPValidation } from "./SignUpValidations";
import { initialState } from "./initialData";
import FormInputPart1 from "./FormInputPart1";
import FormInputPart2 from "./FormInputPart2";
import { usePostMutation } from "../../../api/apiSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  setCredentials,
  selectAuthStatus,
  selectAuthError,
} from "../../../features/auth/authSlice";
import { SIGNIN } from "../../routes/RouteConstants";
import { Link } from "react-router-dom";

const AccountForm = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState({});
  const [selectedDate, setSelectedDate] = useState(initialState.dateOfBirth);
  const [post, { isLoading }] = usePostMutation();
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

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

    onSubmit: (values, { setSubmitting, resetForm }) => {
      validateForm().then(async (validationErrors) => {
        if (Object.keys(validationErrors).length === 0) {
          try {
            // Create FormData object
            const formData = new FormData();
            for (const key in values) {
              if (values[key] !== null && values[key] !== undefined) {
                formData.append(key, values[key]);
              }
            }

            if (values.user_image instanceof File) {
              formData.append("user_image", values.user_image);
            }

            const response = await post({
              path: "/user/authentication/register",
              body: formData,
              isFormData: true, // Custom flag to set correct headers in RTK (see apiSlice)
            }).unwrap();

            dispatch(
              setCredentials({
                token: response.meta.token,
                user: response.data,
              })
            );

            resetForm();
            setSelectedImage(null);
            setSelectedDate(initialState.dateOfBirth);
          } catch (err) {
            console.error("Failed to register: ", err);
          } finally {
            setSubmitting(false);
          }
        } else {
          setSubmitting(false);
        }
      });
    },
  });

  // // Preview image and store actual file
  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setSelectedImage(URL.createObjectURL(file)); // preview
  //     setFieldValue("user_image", file); // actual file for FormData
  //   }
  // };

//   const handleImageChange = (e, studentId) => {
//   const file = e.target.files[0];
//   if (file) {
//     const imagePreviewUrl = URL.createObjectURL(file);
//     setSelectedImages((prev) => ({
//       ...prev,
//       [studentId]: imagePreviewUrl, // key per student
//     }));

//     setFieldValue(`user_image_${studentId}`, file); // dynamically named field
//   }
// };

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setSelectedImage(URL.createObjectURL(file)); // preview
    setFieldValue("user_image", file); // actual file for FormData
  }
};

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center w-full gap-20"
      id="body2"
      encType="multipart/form-data"
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
          validateForm={validateForm}
        />
      </div>

      <div className="grid justify-center w-2/6 grid-cols-1 gap-1 place-content-center ">
        <button
          type="submit"
          className="py-3 font-bold text-white transition duration-300 rounded-lg bg-brown hover:bg-lightbrown"
        >
          Sign Up
        </button>
        <div className="flex flex-wrap items-center justify-center gap-2 ">
          <h1>Already have an account?</h1>
          <Link to={SIGNIN} className="border-b border-brown text-lightbrown">
            Log in
          </Link>
        </div>
      </div>
      {status === "loading" && <p>Loading...</p>}
      {status === "failed" && <p>Error: {error}</p>}
    </form>
  );
};

export default AccountForm;
