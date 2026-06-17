import React, { useState } from "react";
import { usePatchMutation, usePostMutation } from "../../api/apiSlice";
import * as Yup from "yup";
import { useFormik } from "formik";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import CloseIcon from "../../assets/icons/Close";
import { toast } from "react-toastify";

const defaultState = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

const UpdatePasswordModal = ({ setPasswordModal, passwordModal }) => {
  const [oldPassicon, setOldPassIcon] = useState(false);
  const [newPassicon, setNewPassIcon] = useState(false);
  const [confirmPassicon, setConfirmPassIcon] = useState(false);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [updatePassword, { isLoading }] = usePostMutation();
  const [patch, { isLoading: isPatchLoading }] = usePatchMutation();

  const signInValidation = Yup.object({
    password: Yup.string()
      .min(8, "New Password must be at least 8 characters")
      .required("New Password is required"),
    current_password: Yup.string().required("Old Password is required"),
    password_confirmation: Yup.string()
      .oneOf(
        [Yup.ref("password"), null],
        "Confirm Password must match New Password",
      )
      .min(8, "Confirm Password must be at least 8 characters")
      .required("Confirm Password is required"),
  });

  const {
    handleBlur,
    handleChange,
    handleSubmit,
    values,
    errors,
    validateForm,
    touched,
    isSubmitting,
  } = useFormik({
    initialValues: defaultState,
    validationSchema: signInValidation,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values, { setSubmitting, resetForm }) => {
      setFormSubmitted(true);
      validateForm().then(async (validationErrors) => {
        if (Object.keys(validationErrors).length === 0) {
          try {
            const res = await patch({
              path: "/system/change-password",
              body: values,
            }).unwrap();
            if (res.error) {
              toast.error(res?.error?.data?.message);
            } else {
              toast.success(res.message);
              resetForm();
              setPasswordModal(false);
            }
          } catch (err) {
            toast.error(err?.data?.message);
            console.error("Failed to login:", err);
          } finally {
            setSubmitting(false);
          }
        } else {
          setSubmitting(false);
        }
      });
    },
  });
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 ">
      <div className="bg-white p-3 rounded-[10px] shadow-lg ">
        <div className="flex justify-end">
          <button
            onClick={() => setPasswordModal(false)}
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>
        <form
          className="flex flex-col gap-5 md:gap-10 w-full my-5 px-6"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <h1 className="flex gap-2 items-center font-Montserrat tracking-wide text-2xl">
              Update Password
            </h1>
            {/* <p className="text-xs md:text-sm text-center px-5 sm:text-center tracking-wide w-[50%]">
              Your new password must be different from previously used password
            </p> */}
          </div>
          <div className="relative flex flex-col gap-3 md:flex md:flex-col md:gap-5 md:mx-auto md:items-start">
            <div className="relative w-full">
              <input
                type={oldPassicon ? "text" : "password"}
                name="current_password"
                placeholder={
                  errors.current_password && touched.current_password
                    ? ""
                    : "Old Password*"
                }
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-96  ${
                  errors.current_password &&
                  touched.current_password &&
                  "border-red-500"
                }`}
                value={values.current_password}
                onBlur={handleBlur}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.current_password && touched.current_password && (
                <div className="text-red-500 absolute top-1 left-2 text-xs font-bold">
                  {errors.current_password}
                </div>
              )}
              <span className="absolute right-4 top-4 cursor-pointer">
                {oldPassicon ? (
                  <FaEyeSlash
                    className="text-xl"
                    onClick={() =>
                      !isSubmitting && setOldPassIcon(!oldPassicon)
                    }
                  />
                ) : (
                  <FaEye
                    className="text-xl"
                    onClick={() =>
                      !isSubmitting && setOldPassIcon(!oldPassicon)
                    }
                  />
                )}
              </span>
            </div>
            <div className="relative w-full">
              <input
                type={newPassicon ? "text" : "password"}
                name="password"
                placeholder={
                  errors.password && touched.password ? "" : "New Password*"
                }
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-96 ${
                  errors.password && touched.password && "border-red-500"
                }`}
                value={values.password}
                onBlur={handleBlur}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.password && touched.password && (
                <div className="text-red-500 absolute top-1 left-2 text-xs font-bold">
                  {errors.password}
                </div>
              )}
              <span className="absolute right-4 top-4 cursor-pointer">
                {newPassicon ? (
                  <FaEyeSlash
                    className="text-xl"
                    onClick={() =>
                      !isSubmitting && setNewPassIcon(!newPassicon)
                    }
                  />
                ) : (
                  <FaEye
                    className="text-xl"
                    onClick={() =>
                      !isSubmitting && setNewPassIcon(!newPassicon)
                    }
                  />
                )}
              </span>
            </div>
            <div className="relative w-full">
              <input
                type={confirmPassicon ? "text" : "password"}
                name="password_confirmation"
                placeholder={
                  errors.password_confirmation && touched.password_confirmation
                    ? ""
                    : "Confirm Password*"
                }
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-96 ${
                  errors.password_confirmation &&
                  touched.password_confirmation &&
                  "border-red-500"
                }`}
                value={values.password_confirmation}
                onBlur={handleBlur}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.password_confirmation &&
                touched.password_confirmation && (
                  <div className="text-red-500 absolute top-1 left-2 text-xs font-bold">
                    {errors.password_confirmation}
                  </div>
                )}
              <span className="absolute right-4 top-4 cursor-pointer">
                {confirmPassicon ? (
                  <FaEyeSlash
                    className="text-xl"
                    onClick={() =>
                      !isSubmitting && setConfirmPassIcon(!confirmPassicon)
                    }
                  />
                ) : (
                  <FaEye
                    className="text-xl"
                    onClick={() =>
                      !isSubmitting && setConfirmPassIcon(!confirmPassicon)
                    }
                  />
                )}
              </span>
            </div>
          </div>
          <div className="flex gap-4 items-center justify-center ">
            <button
              type="submit"
              className="rounded-[10px] font-Montserrat w-36 p-2 custom-Update text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
            <button
              type="button"
              className="rounded-[10px] font-Montserrat bg-buttonGray w-36 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setPasswordModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordModal;
