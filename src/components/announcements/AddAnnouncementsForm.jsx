import React from "react";
import SwitchButton from "./SwitchButton";

const AddAnnouncementsForm = ({
  handleSubmit,
  handleBlur,
  handleChange,
  setFieldValue,
  values,
  errors,
  touched,
  handleImageChange,
  selectedImage,
  isActive,
  toggleSwitch,
}) => {
  return (
    <>
      <form className=" " onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-x-6 gap-y-3  ">
          <div className="relative">
            <input
              type="title"
              name="title"
              placeholder={errors.title && touched.title ? "" : "Title*"}
              className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
                errors.title && touched.title && "border-red-500"
              } `}
              value={values.title}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            {errors.title && touched.title && (
              <div className="text-red-500 absolute top-1 left-2  text-xs font-bold">
                {errors.title}
              </div>
            )}
          </div>
          <div className="row-span-6  border-2 relative border-dashed   rounded-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-600 ">
            <label className="cursor-pointer w-full ">
              <input
                type="file"
                name="image"
                className="hidden"
                onChange={handleImageChange}
              />
              <div className="w-full h-full flex items-center justify-center">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full h-44  object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM7 6a1 1 0 011 1v2h2V7a1 1 0 012 0v2h2V7a1 1 0 011 0v2h2V6a1 1 0 00-1-1H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.image && touched.image ? (
                      <div className="text-red-500 absolute  bottom-10 left-52 md:left-16 md:bottom-10 lg:left-36 lg:bottom-12 xl:left-32 xl:bottom-10 2xl:left-52 2xl:bottom-12 text-sm font-bold">
                        {errors.image}
                      </div>
                    ) : (
                      <span>Upload Banner</span>
                    )}
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="relative row-span-5 w-full">
            <textarea
              name="description"
              type="text"
              rows={4}
              placeholder={
                errors.description && touched.description ? "" : "Description*"
              }
              className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 w-full ${
                errors.description && touched.description && "border-red-500 "
              } `}
              value={values.description}
              onBlur={handleBlur}
              onChange={handleChange}
            ></textarea>
            {errors.description && touched.description && (
              <div className="text-red-500 absolute top-0 left-2 text-sm font-semibold">
                {errors.description}
              </div>
            )}
          </div>
          <div className="flex items-start justify-start">
            <h1 className="text-2xl">Status</h1>
            <div>
              <SwitchButton isActive={isActive} toggleSwitch={toggleSwitch} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="text-center w-48 mx-auto flex items-center justify-center  border rounded-lg custom-AddButton p-3 mb-10 text-white font-bold  tracking-widest text-xl"
        >
          ADD
        </button>
      </form>
    </>
  );
};

export default AddAnnouncementsForm;
