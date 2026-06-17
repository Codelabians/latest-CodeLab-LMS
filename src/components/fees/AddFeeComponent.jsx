// import React from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";

import { useGetQuery } from "../../api/apiSlice";

const AddFeeComponent = ({
  handleBlur,
  handleChange,
  handleNumbersOnly,
  handleBatchChange,
  handleSubmit,
  selectedDate,
  setSelectedDate,
  setFieldValue,
  values,
  errors,
  user_id,
  touched,
}) => {
  const [studentOptions, setStudentOptions] = useState(null);

  const dispatch = useDispatch();
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
      borderColor: state.isFocused
        ? "#E53E3E" // focus:ring-red-600
        : state.selectProps.errors && state.selectProps.touched
        ? "#E53E3E" // border-red-500
        : "#000000", // default border color
      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(229, 62, 62, 0.75)" // focus:ring-2 focus:ring-red-600
        : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#E53E3E" : "#D1D5DB",
      },
      borderRadius: "0.5rem", // rounded-lg
      width: "100%", // w-full
    }),
    placeholder: (provided, state) => ({
      ...provided,
      color:
        state.selectProps.errors && state.selectProps.touched
          ? "transparent"
          : "#9CA3AF", // placeholder text color
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
    data: studentData,
    error: studentError,
    isLoading: studentIsLoading,
    refetch: refetchStudents,
  } = useGetQuery({
    path: "/admin/students",
    params: {
      active_status: 1,
    },
  });

  useEffect(() => {
    refetchStudents();
  }, []);

  useEffect(() => {
    if (studentData) {
      const transformedStudentOptions = studentData?.data?.map((item) => ({
        value: item.id,
        label: `${item.first_name} ${item.last_name}`,
        fees: item.fixed_fee,
        uuid: item.uuid,
        feeDate: item.fixed_fee_date,
      }));
      setStudentOptions(transformedStudentOptions);
    }
  }, [studentData, dispatch]);

  const fields = [
    {
      name: "batch",
      options: studentOptions,
    },
  ];

  return (
    <form
      className=" w-full mx-auto bg-white border border-grayBorder rounded-md "
      onSubmit={handleSubmit}
    >
      <div className="grid md:grid-cols-3 grid-cols-1 gap-x-6 gap-y-3 my-12  pb-2  px-10 ">
        {fields?.map((field) => (
          <div key={field.name} className="relative col-span-2 md:col-span-1">
            <Select
              key={field.name}
              name={field.name}
              value={
                field?.options?.find((option) => option.value === user_id) ||
                null
              }
              onChange={(selectedOption) => {
                handleBatchChange(selectedOption, field);
                setFieldValue("user_id", selectedOption?.value || "");
                setFieldValue("total_fee", selectedOption?.fees || "");

                if (selectedOption?.feeDate) {
                  const feeDate = new Date(selectedOption.feeDate);
                  setSelectedDate(feeDate);
                  setFieldValue("submit_date", feeDate);
                }
              }}
              options={field?.options || []}
              styles={customStyles}
              onBlur={handleBlur}
              placeholder={
                errors["user_id"] && touched["user_id"] ? "" : "Student"
              }
              errors={errors["user_id"]}
              touched={touched["user_id"]}
              isDisabled={!field?.options?.length}
              noOptionsMessage={() => "No students available"}
            />

            {errors["user_id"] && touched["user_id"] && (
              <div className="text-red-500 absolute top-1 left-2 text-xs font-bold">
                {errors["user_id"]}
              </div>
            )}
          </div>
        ))}

        <div className="relative">
          <input
            type="text"
            name="total_fee"
            placeholder={errors.total_fee && touched.total_fee ? "" : "Fee*"}
            className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
              errors.total_fee && touched.total_fee && "border-red-500"
            } `}
            value={values.total_fee}
            onBlur={handleBlur}
            onChange={handleNumbersOnly}
          />
          {errors.total_fee && touched.total_fee && (
            <div className="text-red-500 absolute top-1 left-2  text-xs font-bold">
              {errors.total_fee}
            </div>
          )}
        </div>
        <div className="relative ">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setFieldValue("submit_date", date); // Update Formik field value
            }}
            placeholderText={
              errors.submit_date && touched.submit_date ? "" : "Date*"
            }
            className={`${
              errors.submit_date && touched.submit_date && "border-red-500"
            } p-3 border   text-gray-500  rounded-lg focus:outline-none focus:ring-2  focus:ring-red-600  w-[160%]   `}
          />
          {errors.submit_date && touched.submit_date && (
            <div className="text-red-500 absolute top-1 left-2 text-sm font-semibold">
              {errors.submit_date}
            </div>
          )}
        </div>
        <div className="relative col-span-3 w-full">
          <textarea
            name="note"
            type="text"
            placeholder={errors.note && touched.note ? "" : "Note*"}
            className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
              errors.note && touched.note && "border-red-500 "
            } `}
            value={values.note}
            onBlur={handleBlur}
            onChange={handleChange}
          ></textarea>
          {errors.note && touched.note && (
            <div className="text-red-500 absolute top-0 left-2 text-sm font-semibold">
              {errors.note}
            </div>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="text-center w-48 mx-auto flex items-center justify-center  border rounded-lg custom-AddButton p-3 mb-10 text-white font-bold  tracking-widest text-xl"
      >
        ADD
      </button>
    </form>
  );
};

export default AddFeeComponent;
