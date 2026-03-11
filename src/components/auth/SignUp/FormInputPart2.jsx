import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const FormInputPart2 = ({
  handleBlur,
  handleChange,
  values,
  errors,
  selectedDate,
  setSelectedDate,
  setFieldValue,
  touched,
}) => {
  const handleAlphabetsOnly = (e) => {
    const inputValue = e.target.value;
    // Regex to allow only alphabets and spaces
    if (/^[a-zA-Z\s]*$/.test(inputValue)) {
      handleChange(e);
    }
  };
  const handleNumbersOnly = (e) => {
    const inputValue = e.target.value;
    // Regex to allow only numbers and spaces
    if (/^[0-9--\s]*$/.test(inputValue) && inputValue.length <= 11) {
      handleChange(e);
    }
  };
  return (
    <div className="grid gap-2 md:grid-cols-3 ">
      <div className="relative">
        <input
          type="text"
          name="qualification"
          placeholder={
            errors.qualification && touched.qualification
              ? ""
              : "Qualification*"
          }
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
            errors.qualification && touched.qualification && "border-red-500"
          } `}
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
          name="currentInstitute"
          placeholder={
            errors.currentInstitute && touched.currentInstitute
              ? ""
              : "Current Institute*"
          }
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
            errors.currentInstitute &&
            touched.currentInstitute &&
            "border-red-500"
          } `}
          value={values.currentInstitute}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        {errors.currentInstitute && touched.currentInstitute && (
          <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
            {errors.currentInstitute}
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          name="guardianName"
          placeholder={
            errors.guardianName && touched.guardianName ? "" : "Guardian Name*"
          }
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
            errors.guardianName && touched.guardianName && "border-red-500"
          } `}
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
      <div className="relative">
        <input
          type="text"
          name="guardianPhoneNo"
          placeholder={
            errors.guardianPhoneNo && touched.guardianPhoneNo
              ? ""
              : "Guardian Phone No*"
          }
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
            errors.guardianPhoneNo &&
            touched.guardianPhoneNo &&
            "border-red-500"
          } `}
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
      <div className="relative md:col-span-2">
        <input
          type="text"
          name="address"
          placeholder={errors.address && touched.address ? "" : "Address*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
            errors.address && touched.address && "border-red-500"
          } `}
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
      <div className="relative col-span-1">
        <select
          name="gender"
          className={`p-3 border   rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
            errors.gender &&
            touched.gender &&
            "border-red-500 text-red-500 text-sm font-semibold    "
          } `}
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
      <div className="relative md:col-span-2">
        <input
          type="text"
          name="city"
          placeholder={errors.city && touched.city ? "" : "City*"}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
            errors.city && touched.city && "border-red-500"
          } `}
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

      <div className="relative ">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            setFieldValue("dateOfBirth", date); // Update Formik field value
          }}
          placeholderText={
            errors.dateOfBirth && touched.dateOfBirth ? "" : "Date Of Birth*"
          }
          className={`${
            errors.dateOfBirth && touched.dateOfBirth && "border-red-500"
          } p-3 border   text-gray-500  rounded-lg focus:outline-none focus:ring-2  focus:ring-brown   `}
        />
        {errors.dateOfBirth && touched.dateOfBirth && (
          <div className="absolute text-sm font-semibold text-red-500 top-1 left-2">
            {errors.dateOfBirth}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormInputPart2;
