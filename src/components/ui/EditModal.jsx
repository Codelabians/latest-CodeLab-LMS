import React, { useState, useEffect } from "react";
import CloseIcon from "../../assets/icons/Close";
import Select from "react-select";
import { toast } from "react-toastify";

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#FF0000" : provided.backgroundColor,
    color: state.isSelected ? "white" : provided.color,
    "&:hover": {
      backgroundColor: state.isSelected ? "" : "#24A0ED", // change on hover if needed
      color: "white",
    },
  }),
};

const EditModal = ({
  isOpen,
  setIsOpen,
  title,
  fields,
  initialValues,
  handleSubmit,
  submitButtonText,
}) => {
  useEffect(() => {
    if (isOpen) {
      let updatedInitialValues = initialValues || {};

      if (initialValues?.time_slot) {
        const [startTime, endTime] = initialValues.time_slot.split(" to ");
        updatedInitialValues = {
          ...updatedInitialValues,
          start_time: startTime,
          end_time: endTime,
        };
      }

      setFormState(updatedInitialValues);
    }
  }, [isOpen, initialValues]);

  const [formState, setFormState] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = (e, field) => {
    let value = field.type === "select" ? e.value : e.target.value;
    const newErrors = { ...errors };

    if (
      field.name === "category" ||
      field.name === "course"
      // ||
      // field.name === "instructor" ||
      // field.name === "fatherName" ||
      // field.name === "firstName" ||
      // field.name === "lastName"
    ) {
      if (/[0-9]/.test(value)) {
        // If the value contains anything other than letters or spaces, show the error message
        newErrors[field.name] = "Number cannot accept";
      } else if (value.length > 0 && value.length < 3) {
        // If the value is less than 3 characters, show the error message
        newErrors[field.name] = "Alphabets must be 3 letters";
      } else {
        // Clear the error if the input is valid
        delete newErrors[field.name];
      }
    }

    if (
      // field.name === "category" ||
      // field.name === "course" ||
      field.name === "instructor" ||
      field.name === "fatherName" ||
      field.name === "firstName" ||
      field.name === "lastName"
    ) {
      if (/[^a-zA-Z\s]/.test(value)) {
        // If the value contains anything other than letters or spaces, show the error message
        newErrors[field.name] = "Number cannot accept or special characters";
      } else if (value.length > 0 && value.length < 3) {
        // If the value is less than 3 characters, show the error message
        newErrors[field.name] = "Alphabets must be 3 letters";
      } else {
        // Clear the error if the input is valid
        delete newErrors[field.name];
      }
    }

    // Validation for "phoneNo" field
    if (field.name === "phoneNo") {
      // Restrict input to only numbers
      value = value.replace(/[^0-9]/g, "");

      // Ensure the number can't exceed 11 digits
      if (value.length > 11) {
        value = value.slice(0, 11);
      }

      if (!value.startsWith("03")) {
        newErrors[field.name] = "Phone number must start with '03'";
      } else if (value.length < 11) {
        newErrors[field.name] = "Phone number must be exactly 11 digits";
      } else {
        delete newErrors[field.name];
      }
    }

    // Ensure the error for the select field is removed immediately when a valid option is selected
    if (field.type === "select" && value) {
      delete newErrors[field.name];
    }

    if (field.name === "description" && value) {
      delete newErrors[field.name];
    }

    if (field.name === "title" && value) {
      delete newErrors[field.name];
    }
    // Validate time_slot field

    if ((field.name === "start_time" || field.name === "end_time") && value) {
      delete newErrors[field.name];
    }

    setFormState({
      ...formState,
      [field.name]: value,
    });

    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    fields.forEach((field) => {
      if (field.name === "time_slot") {
        if (!formState.start_time || !formState.end_time) {
          newErrors.start_time = "Start time is required";
          newErrors.end_time = "End time is required";
        }
      } else if (
        field.type === "checkbox" &&
        (formState[field.name] === undefined || formState[field.name] === null)
      ) {
        newErrors[field.name] = `${field.label} is required`;
      } else if (field.type !== "checkbox" && !formState[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      } else if (
        (field.name === "category" || field.name === "course") &&
        /[0-9]/.test(formState[field.name])
      ) {
        newErrors[field.name] = "Number cannot accept";
      } else if (
        (field.name === "instructor" ||
          field.name === "fatherName" ||
          field.name === "firstName" ||
          field.name === "lastName") &&
        /[^a-zA-Z\s]/.test(formState[field.name])
      ) {
        newErrors[field.name] = "Number or special character cannot accept";
      } else if (
        (field.name === "category" ||
          field.name === "course" ||
          field.name === "instructor" ||
          field.name === "fatherName" ||
          field.name === "firstName" ||
          field.name === "lastName") &&
        formState[field.name].length < 3
      ) {
        newErrors[field.name] = "Alphabets must be 3 letters";
      } else if (field.name === "phoneNo") {
        const phoneValue = formState[field.name].replace(/[^0-9]/g, "");
        if (phoneValue.length !== 11) {
          newErrors[field.name] = "Phone number must be exactly 11 digits";
        } else if (!phoneValue.startsWith("03")) {
          newErrors[field.name] = "Phone number must start with '03'";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const closeModal = () => {
    setIsOpen(false);
    setFormState({});
    setErrors({});
  };

  const submit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      handleSubmit(formState);
      // closeModal();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-3 rounded-[10px] shadow-lg ">
            <div className="flex justify-end">
              <button onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="flex items-center flex-col m-2">
              <div className="text-2xl font-medium font-poppins mb-6 mt-3 self-center">
                {title}
              </div>
              <form className="flex flex-col gap-2 mb-8" onSubmit={submit}>
                {fields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-2 mb-4">
                    <div className="text-sm font-poppins font-medium">
                      {field.label}
                    </div>
                    {field.type === "select" ? (
                      <Select
                        name={field.name}
                        className="w-[386px]"
                        value={field.options.find(
                          (option) => option.value === formState[field.name]
                        )}
                        onChange={(e) => handleChange(e, field)}
                        options={field.options}
                        styles={customStyles}
                      />
                    ) : field.type === "time" ? (
                      <div className="w-full mx-auto flex grow-1 gap-4">
                        <div className="w-full">
                          <label
                            htmlFor="start-time"
                            className="block mb-1 text-sm font-normal text-gray-900  font-poppins"
                          >
                            Start time:
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="start-time"
                              name={field.name}
                              className="border-grayBorder p-2 bg-gray-50 border leading-none text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              min="09:00"
                              max="18:00"
                              value={formState.start_time}
                              onChange={(e) =>
                                handleChange(e, { name: "start_time" })
                              }
                              required
                            />
                            {errors.start_time && (
                              <div className="text-xs font-nunito text-red-600">
                                {errors.start_time}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-full">
                          <label
                            htmlFor="end-time"
                            className="block mb-1 text-sm font-normal text-gray-900  font-poppins"
                          >
                            End time:
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="end-time"
                              name={field.name}
                              className="border-grayBorder p-2 bg-gray-50 border leading-none text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              min="09:00"
                              max="18:00"
                              value={formState.end_time}
                              onChange={(e) =>
                                handleChange(e, { name: "end_time" })
                              }
                              required
                            />
                            {errors.end_time && (
                              <div className="text-xs font-nunito text-red-600">
                                {errors.end_time}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        placeholder={field.placeholder}
                        className="border border-grayBorder p-2 w-[386px] rounded-[10px] text-sm h-[44px]"
                        value={formState[field.name] || ""}
                        onChange={(e) => handleChange(e, field)}
                      />
                    )}
                    {errors[field.name] && (
                      <div className="text-xs font-nunito text-red-600">
                        {errors[field.name]}
                      </div>
                    )}
                  </div>
                ))}
              </form>
            </div>
            <div className="flex justify-center gap-3 mb-4">
              <button
                onClick={submit}
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
          </div>
        </div>
      )}
    </>
  );
};

export default EditModal;
