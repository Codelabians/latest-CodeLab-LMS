import React, { useEffect, useState } from "react";
import { useGetQuery } from "../../../api/apiSlice";
import Select from "react-select";
import PDF from "../../../assets/images/instructor/pdf.png";
import Datepicker from "react-tailwindcss-datepicker";

const FormInputPart2 = ({
  handleBlur,
  handleChange,
  values,
  errors,
  selectedDate,
  setSelectedDate,
  setFieldValue,
  touched,
  handleImageChange,
  selectedImage,
  setSelectedFacilities,
}) => {
  const [facilityOption, setFacilityOption] = useState(null);

  const handleAlphabetsOnly = (e) => {
    const inputValue = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(inputValue)) {
      handleChange(e);
    }
  };

  const handleNumbersOnly = (e) => {
    let inputValue = e.target.value.replace(/\D/g, "");
    if (inputValue.length > 4) {
      inputValue = inputValue.slice(0, 4) + "-" + inputValue.slice(4);
    }
    if (inputValue.length <= 12) {
      e.target.value = inputValue;
      handleChange(e);
    }
  };

  const handleNumber = (e) => {
    const inputValue = e.target.value;
    if (/^[0-9\s]*$/.test(inputValue)) {
      handleChange(e);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
  };

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
      height: "4.5rem",
      borderColor: state.isFocused
        ? "#E53E3E"
        : state.selectProps.errors && state.selectProps.touched
        ? "#E53E3E"
        : "#000000",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(229, 62, 62, 0.75)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#E53E3E" : "#D1D5DB",
      },
      borderRadius: "0.5rem",
      width: "100%",
    }),
    placeholder: (provided, state) => ({
      ...provided,
      color: state.selectProps.errors && state.selectProps.touched ? "transparent" : "#9CA3AF",
    }),
    container: (provided) => ({
      ...provided,
      width: "100%",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#4b5563",
    }),
  };

  const {
    data: facilitiesData,
    error: facilitiesError,
    isLoading: facilitiesIsLoading,
    refetch: refetchFacilities,
  } = useGetQuery({
    path: "/admin/facilities",
  });

  useEffect(() => {
    if (facilitiesData) {
      const facilityOptions = facilitiesData.data.map((facility) => ({
        value: facility.id,
        label: facility.facility_name,
      }));
      setFacilityOption(facilityOptions);
    }
  }, [facilitiesData]);

  const selectedFacilityIds = typeof values.facilities === "string" && values.facilities
    ? values.facilities.split(",").map((id) => id.trim()).filter((id) => id)
    : [];

  const selectedOptions = facilityOption?.length
    ? facilityOption.filter((option) =>
        selectedFacilityIds.includes(option.value.toString())
      )
    : [];

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <div className="relative">
        <input
          type="text"
          name="qualification"
          placeholder={errors.qualification && touched.qualification ? "" : "Qualification*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.qualification && touched.qualification && "border-red-500"
          }`}
          value={values.qualification}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        {errors.qualification && touched.qualification && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.qualification}
          </div>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          name="guardianName"
          placeholder={errors.guardianName && touched.guardianName ? "" : "Guardian Name*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.guardianName && touched.guardianName && "border-red-500"
          }`}
          value={values.guardianName}
          onBlur={handleBlur}
          onChange={handleAlphabetsOnly}
        />
        {errors.guardianName && touched.guardianName && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.guardianName}
          </div>
        )}
      </div>

      <div className="relative w-full col-span-1 border rounded-lg focus:outline-none focus:ring-2 focus:bg-red-500">
        <label className="w-full h-full cursor-pointer">
          <input
            type="file"
            name="contract"
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="flex items-center justify-center w-full">
            {selectedImage?.contract ? (
              <div className="flex items-center justify-start w-full gap-2 ">
                <img
                  src={PDF}
                  alt="Selected"
                  className="object-center w-10 h-10 my-auto mt-1 rounded-lg"
                />
                <div className="mt-1 text-center">
                  {selectedImage?.contract?.[0]?.[0]?.name}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-start w-full gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 "
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM7 6a1 1 0 011 1v2h2V7a1 1 0 012 0v2h2V7a1 1 0 011 0v2h2V6a1 1 0 00-1-1H7z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.contract && touched.contract ? (
                  <div className="absolute text-xs font-bold text-center text-red-500 left-16">
                    {errors.contract}
                  </div>
                ) : (
                  <span>Contract pdf upload </span>
                )}
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="relative w-full col-span-1 border rounded-lg focus:outline-none focus:ring-2 focus:bg-red-500">
        <label className="w-full cursor-pointer">
          <input
            type="file"
            name="resume"
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="flex items-center justify-center w-full">
            {selectedImage?.resume ? (
              <div className="flex items-center justify-start w-full gap-2 ">
                <img
                  src={PDF}
                  alt="Selected"
                  className="object-center w-10 h-10 my-auto mt-1 rounded-lg"
                />
                <div className="mt-1 text-center">
                  {selectedImage?.resume?.[0]?.[0]?.name}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-start w-full gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 "
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM7 6a1 1 0 011 1v2h2V7a1 1 0 012 0v2h2V7a1 1 0 011 0v2h2V6a1 1 0 00-1-1H7z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.resume && touched.resume ? (
                  <div className="absolute text-xs font-bold text-center text-red-500 left-16">
                    {errors.resume}
                  </div>
                ) : (
                  <span>Resume pdf upload </span>
                )}
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="relative">
        <input
          type="text"
          name="guardianPhoneNo"
          placeholder={errors.guardianPhoneNo && touched.guardianPhoneNo ? "" : "Guardian Phone No*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.guardianPhoneNo && touched.guardianPhoneNo && "border-red-500"
          }`}
          value={values.guardianPhoneNo.toString()}
          onBlur={handleBlur}
          onChange={handleNumbersOnly}
        />
        {errors.guardianPhoneNo && touched.guardianPhoneNo && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.guardianPhoneNo}
          </div>
        )}
      </div>

      <div className="relative md:col-span-1">
        <input
          type="text"
          name="address"
          placeholder={errors.address && touched.address ? "" : "Address*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.address && touched.address && "border-red-500"
          }`}
          value={values.address}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        {errors.address && touched.address && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.address}
          </div>
        )}
      </div>

      <div className="w-full col-span-1 border rounded-lg focus:outline-none focus:ring-2 focus:bg-red-500">
        <label className="w-full cursor-pointer">
          <input
            type="file"
            name="education"
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="flex items-center justify-center w-full">
            {selectedImage?.education ? (
              <div className="flex items-center justify-start w-full gap-2 ">
                <img
                  src={PDF}
                  alt="Selected"
                  className="object-center w-10 h-10 my-auto mt-1 rounded-lg"
                />
                <div className="mt-1 text-center">
                  {selectedImage?.education?.[0]?.[0]?.name}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-start w-full gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 "
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM7 6a1 1 0 011 1v2h2V7a1 1 0 012 0v2h2V7a1 1 0 011 0v2h2V6a1 1 0 00-1-1H7z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.education && touched.education ? (
                  <div className="absolute text-xs font-bold text-red-500 md:left-16 md:bottom-5 bottom-7 left-2">
                    {errors.education}
                  </div>
                ) : (
                  <span>Education pdf upload </span>
                )}
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="w-full col-span-1 border rounded-lg focus:outline-none focus:ring-2 focus:bg-red-500">
        <label className="w-full cursor-pointer">
          <input
            type="file"
            name="experience_letter"
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="flex items-center justify-center w-full">
            {selectedImage?.experience_letter ? (
              <div className="flex items-center justify-start w-full gap-2 ">
                <img
                  src={PDF}
                  alt="Selected"
                  className="object-center w-10 h-10 my-auto mt-1 rounded-lg"
                />
                <div className="mt-1 text-center">
                  {selectedImage?.experience_letter?.[0]?.[0]?.name}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-start w-full gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 "
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM7 6a1 1 0 011 1v2h2V7a1 1 0 012 0v2h2V7a1 1 0 011 0v2h2V6a1 1 0 00-1-1H7z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.experience_letter && touched.experience_letter ? (
                  <div className="absolute text-sm font-bold text-red-500 md:left-16 md:bottom-5 bottom-7 left-2">
                    {errors.experience_letter}
                  </div>
                ) : (
                  <span>Experience Letter pdf upload </span>
                )}
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="relative col-span-1">
        <select
          name="gender"
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.gender && touched.gender && "border-red-500 text-red-500 text-sm font-semibold"
          }`}
          value={values.gender.toLowerCase()}
          onBlur={handleBlur}
          onChange={handleChange}
        >
          {errors.gender && touched.gender ? (
            <option value="" disabled hidden>
              {errors.gender}
            </option>
          ) : (
            <option value="" disabled hidden>
              Select Gender
            </option>
          )}
          <option value="male" className="text-black">
            Male
          </option>
          <option value="female" className="text-black">
            Female
          </option>
          <option value="others" className="text-black">
            Others
          </option>
        </select>
      </div>

      <div className="relative md:col-span-1">
        <input
          type="text"
          name="city"
          placeholder={errors.city && touched.city ? "" : "City*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.city && touched.city && "border-red-500"
          }`}
          value={values.city}
          onBlur={handleBlur}
          onChange={handleAlphabetsOnly}
        />
        {errors.city && touched.city && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.city}
          </div>
        )}
      </div>

      <div className="w-full col-span-1 border rounded-lg focus:outline-none focus:ring-2 focus:bg-red-500">
        <label className="w-full cursor-pointer">
          <input
            type="file"
            name="additional_certificate"
            className="hidden"
            onChange={handleImageChange}
            multiple
          />
          <div className="flex items-center justify-center w-full">
            {selectedImage?.additional_certificate ? (
              <div className="flex items-center justify-start w-full gap-2 ">
                <img
                  src={PDF}
                  alt="Selected"
                  className="object-center w-10 h-10 my-auto mt-1 rounded-lg"
                />
                <div className="mt-1 text-center">
                  {selectedImage?.additional_certificate?.[0]?.[0]?.name}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-start w-full gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 "
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM7 6a1 1 0 011 1v2h2V7a1 1 0 012 0v2h2V7a1 1 0 011 0v2h2V6a1 1 0 00-1-1H7z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.additional_certificate && touched.additional_certificate ? (
                  <div className="absolute text-sm font-bold text-red-500 md:left-16 md:bottom-5 bottom-7 left-2">
                    {errors.additional_certificate}
                  </div>
                ) : (
                  <span>Additional Certificate pdf upload </span>
                )}
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="relative col-span-1">
        <select
          name="marital_status"
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.marital_status && touched.marital_status && "border-red-500 text-red-500 text-sm font-semibold"
          }`}
          value={values.marital_status.toLowerCase()}
          onBlur={handleBlur}
          onChange={handleChange}
        >
          {errors.marital_status && touched.marital_status ? (
            <option value="" disabled hidden>
              {errors.marital_status}
            </option>
          ) : (
            <option value="" disabled hidden>
              Marital Status
            </option>
          )}
          <option value="married" className="text-black">
            Married
          </option>
          <option value="single" className="text-black">
            Single
          </option>
        </select>
      </div>

      <div className="relative md:col-span-1">
        <input
          type="text"
          name="designation"
          placeholder={errors.designation && touched.designation ? "" : "Designation*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.designation && touched.designation && "border-red-500"
          }`}
          value={values.designation}
          onBlur={handleBlur}
          onChange={handleAlphabetsOnly}
        />
        {errors.designation && touched.designation && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.designation}
          </div>
        )}
      </div>

      <div className="relative md:col-span-1">
        <input
          type="text"
          name="basic_salary"
          placeholder={errors.basic_salary && touched.basic_salary ? "" : "Basic Salary*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.basic_salary && touched.basic_salary && "border-red-500"
          }`}
          value={values.basic_salary}
          onBlur={handleBlur}
          onChange={handleNumber}
        />
        {errors.basic_salary && touched.basic_salary && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.basic_salary}
          </div>
        )}
      </div>

      <div className="relative col-span-2 md:col-span-2">
        <Datepicker
          value={selectedDate}
          asSingle={true}
          useRange={false}
          showShortcuts={true}
          onChange={(date) => {
            setSelectedDate(date);
            setFieldValue(
              "dateOfBirth",
              date.startDate ? new Date(date.startDate).toISOString().split("T")[0] : ""
            );
          }}
          placeholder={errors.dateOfBirth && touched.dateOfBirth ? "" : "Date Of Birth*"}
          inputClassName={`${
            errors.dateOfBirth && touched.dateOfBirth && "border-red-500"
          } p-3 border text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full`}
        />
        {errors.dateOfBirth && touched.dateOfBirth && (
          <div className="absolute text-xs font-semibold text-red-500 top-1 left-2">
            {errors.dateOfBirth}
          </div>
        )}
      </div>

      <div className="relative w-full col-span-2">
        <textarea
          name="bio"
          type="text"
          placeholder={errors.bio && touched.bio ? "" : "Note*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
            errors.bio && touched.bio && "border-red-500"
          }`}
          value={values.bio}
          onBlur={handleBlur}
          onChange={handleChange}
        ></textarea>
        {errors.bio && touched.bio && (
          <div className="absolute top-0 text-sm font-semibold text-red-500 left-2">
            {errors.bio}
          </div>
        )}
      </div>

      <div className="relative col-span-2 gap-2">
        <Select
          isMulti
          name="facilities"
          options={facilityOption}
          value={selectedOptions}
          onChange={(selectedOptions) => {
            const selectedValues = selectedOptions?.map((option) => option.value) || [];
            setFieldValue("facilities", selectedValues.join(","));
            setSelectedFacilities(selectedOptions);
          }}
          placeholder={errors.facilities && touched.facilities ? "" : "Facilities"}
          styles={customStyles}
          errors={errors.facilities}
          touched={touched.facilities}
        />
        {errors.facilities && touched.facilities && (
          <p className="absolute top-0 text-sm text-red-500 font-poppins left-2">
            {errors.facilities}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormInputPart2;