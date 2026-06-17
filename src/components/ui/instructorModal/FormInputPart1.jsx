import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { initialState } from "../instructorModal/initialData";

const FormInputPart1 = ({
  values,
  errors,
  touched,
  handleBlur,
  handleChange,
  handleImageChange,
  selectedImage,
}) => {
  const [passicon, setpassIcon] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialState.dateOfBirth);
  
  const handleAlphabetsOnly = (e) => {
    const inputValue = e.target.value;
    // Regex to allow only alphabets and spaces
    if (/^[a-zA-Z\s]*$/.test(inputValue)) {
      handleChange(e);
    }
  };
  // const handleNumbersOnly = (e) => {
  //   const inputValue = e.target.value;
  //   if (/^[0-9\s]*$/.test(inputValue) && inputValue.length <= 11) {
  //     handleChange(e);
  //   }
  // };
  const handleNumbersOnly = (e) => {
    let inputValue = e.target.value.replace(/\D/g, ""); // Remove any non-digit characters
    if (inputValue.length > 4) {
      inputValue = inputValue.slice(0, 4) + "-" + inputValue.slice(4);
    }

    // Allow input only if the length is 11 characters (including the hyphen)
    if (inputValue.length <= 12) {
      e.target.value = inputValue;
      handleChange(e); // Trigger handleChange if you need to update the state
    }
  };

  const [cnic, setCnic] = useState(values.cnic || "");

  const handleCNICChange = (e) => {
    let inputValue = e.target.value;

    // Remove any character that is not a digit or a hyphen

    inputValue = inputValue.replace(/[^0-9]/g, "");

    // Ensure the input is at most 15 characters long (13 digits + 2 hyphens)
    if (inputValue.length <= 13) {
      // Add hyphens at the correct positions
      if (inputValue.length > 5 && inputValue[5] !== "-") {
        inputValue = inputValue.slice(0, 5) + "-" + inputValue.slice(5);
      }
      if (inputValue.length > 13 && inputValue[13] !== "-") {
        inputValue = inputValue.slice(0, 13) + "-" + inputValue.slice(13);
      }

      setCnic(inputValue);
      handleChange({
        ...e,
        target: {
          ...e.target,
          name: "cnic", // Make sure the name is correctly passed
          value: inputValue,
        },
      });
    }
  };
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
      <div className="relative">
        <input
          type="text"
          name="firstName"
          placeholder={
            errors.firstName && touched.firstName ? "" : "First Name*"
          }
          className={`p-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.firstName && touched.firstName && "border-red-500"
          } `}
          value={values.firstName}
          onBlur={handleBlur}
          // onChange={handleChange}
          onChange={handleAlphabetsOnly}
        />
        {errors.firstName && touched.firstName && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.firstName}
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          name="lastName"
          placeholder={errors.lastName && touched.lastName ? "" : "Last Name*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.lastName && touched.lastName && "border-red-500"
          } `}
          value={values.lastName}
          onBlur={handleBlur}
          onChange={handleAlphabetsOnly}
        />
        {errors.lastName && touched.lastName && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.lastName}
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-center row-span-4 mb-2 border-2 border-dashed rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ">
        <label className="w-full cursor-pointer ">
          <input
            type="file"
            name="user_image"
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="flex items-center justify-center w-full h-full">
            {selectedImage?.user_image ? (
              <img
                src={selectedImage?.user_image?.[0][1]}
                alt="Selected"
                className="object-cover object-center w-full h-40 rounded-lg"
              />
            ) : (
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 mx-auto"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM7 6a1 1 0 011 1v2h2V7a1 1 0 012 0v2h2V7a1 1 0 011 0v2h2V6a1 1 0 00-1-1H7z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.user_image && touched.user_image ? (
                  <div className="absolute text-xs font-bold text-center text-red-500 left-16">
                    {errors.user_image}
                  </div>
                ) : (
                  <span>Profile Image upload here</span>
                )}
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="relative flex items-center justify-center row-span-4 mb-2 border-2 border-dashed rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ">
        <label className="w-full cursor-pointer ">
          <input
            type="file"
            name="cnic_doc"
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="flex items-center justify-center w-full h-full">
            {selectedImage?.cnic_doc? (
              <img
                src={selectedImage?.cnic_doc?.[0][1]}
                alt="Selected"
                className="object-cover w-full h-40 rounded-lg"
              />
            ) : (
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 mx-auto"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM7 6a1 1 0 011 1v2h2V7a1 1 0 012 0v2h2V7a1 1 0 011 0v2h2V6a1 1 0 00-1-1H7z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.cnic_doc && touched.cnic_doc ? (
                  <div className="absolute text-xs font-bold text-center text-red-500 left-16">
                    {errors.cnic_doc}
                  </div>
                ) : (
                  <span>Cnic Image upload here</span>
                )}
              </div>
            )}
          </div>
        </label>
      </div>
      <div className="relative">
        <input
          type="email"
          name="email"
          placeholder={errors.email && touched.email ? "" : "E-Mail*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.email && touched.email && "border-red-500"
          } `}
          value={values.email}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        {errors.email && touched.email && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.email}
          </div>
        )}
      </div>

      <div className="relative col-span-1">
        <input
          type="text"
          name="experience"
          placeholder={
            errors.experience && touched.experience ? "" : "Experience*"
          }
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.experience && touched.experience && "border-red-500"
          } `}
          value={values.experience}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        {errors.experience && touched.experience && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.experience}
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          name="cnic"
          placeholder={errors.cnic && touched.cnic ? "" : "Cnic*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.cnic && touched.cnic && "border-red-500"
          } `}
          value={values.cnic}
          onBlur={handleBlur}
          onChange={handleCNICChange}
        />
        {errors.cnic && touched.cnic && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.cnic}
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          name="phoneNo"
          placeholder={
            errors.phoneNo && touched.phoneNo ? "" : "Phone (0303-45555333)"
          }
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.phoneNo && touched.phoneNo && "border-red-500"
          } `}
          value={values.phoneNo?.toString()}
          onBlur={handleBlur}
          onChange={handleNumbersOnly}
        />
        {errors.phoneNo && touched.phoneNo && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.phoneNo}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormInputPart1;
