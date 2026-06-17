import React, { useEffect, useState } from "react";
import Select from "react-select";
import CloseIcon from "../../assets/icons/Close";

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#FF0000" : provided.backgroundColor,
    color: state.isSelected ? "white" : provided.color,
    "&:hover": {
      backgroundColor: state.isSelected ? "" : "red",
      color: "white",
    },
  }),
};

const CreateModal = ({
  isOpen,
  setIsOpen,
  title,
  fields,
  handleSubmit,
  submitButtonText,
}) => {
  const [formState, setFormState] = useState({});
  const [errors, setErrors] = useState({});

  const resetFormState = () => {
    setFormState({});
  };

  const handleChange = (e, field) => {
    let value;

    if (field.type === "select") {
      value = e.value;
    } else if (field.type === "checkbox") {
      value = e.target.checked;
    } else {
      value = e.target.value;
    }

    const newErrors = { ...errors };

    if (field.name === "category" || field.name === "course") {
      if (/[0-9]/.test(value)) {
        newErrors[field.name] = "Number cannot accept";
      } else if (value.length > 0 && value.length < 3) {
        newErrors[field.name] = "Alphabets must be 3 letters";
      } else {
        delete newErrors[field.name];
      }
    }

    if ((field.type === "select" || field.type === "checkbox") && value) {
      delete newErrors[field.name];
    }

    if (field.name === "batchdate" && value) {
      delete newErrors[field.name];
    }

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
      if (field.name === "timeslot") {
        if (!formState.start_time) {
          newErrors.start_time = "Start time is required";
        }
        if (!formState.end_time) {
          newErrors.end_time = "End time is required";
        }
      } else if (
        (field.type !== "checkbox" && !formState[field.name]) ||
        (field.type === "checkbox" && formState[field.name] !== true && field.required)
      ) {
        newErrors[field.name] = `${field.label} is required`;
      } else if (
        (field.name === "category" || field.name === "course") &&
        /[^a-zA-Z\s]/.test(formState[field.name])
      ) {
        newErrors[field.name] = "Number cannot accept";
      } else if (
        (field.name === "category" || field.name === "course") &&
        formState[field.name].length < 3
      ) {
        newErrors[field.name] = "Alphabets must be 3 letters";
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
      try {
        handleSubmit(formState, resetFormState);
      } catch (error) {
        console.error("Form submission failed", error);
      }
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

                    {field.type === "checkbox" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={!!formState[field.name]}
                          onChange={(e) => handleChange(e, field)}
                        />
                        <label className="text-sm font-poppins">
                          {field.label}
                        </label>
                      </div>
                    ) : field.type === "select" ? (
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
                            className="block mb-1 text-sm font-normal text-gray-900 font-poppins"
                          >
                            Start time:
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="start-time"
                              className="border-grayBorder p-2 bg-gray-50 border leading-none text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full"
                              min="09:00"
                              max="18:00"
                              value={formState.start_time || ""}
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
                            className="block mb-1 text-sm font-normal text-gray-900 font-poppins"
                          >
                            End time:
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="end-time"
                              className="border-grayBorder p-2 bg-gray-50 border leading-none text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full"
                              min="09:00"
                              max="18:00"
                              value={formState.end_time || ""}
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
                type="button"
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

export default CreateModal;
