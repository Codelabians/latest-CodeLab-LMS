import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";

import "react-datepicker/dist/react-datepicker.css";
import { usePostMutation } from "../../api/apiSlice";

import { format } from "date-fns";
import Fees from "../../assets/icons/navbar/Fees";
import { initialState } from "../students/addStudentModal/initialData";
import showError from "../ui/common/ShowError";
import { showToast } from "../ui/common/ShowToast";
import Header from "../ui/Header";
import AddFeeComponent from "./AddFeeComponent";
import FeeVoucherComponent from "./FeeVoucherComponent";
const defaultState = {
  user_id: null,
  total_fee: "",
  submit_date: "",
  note: "",
};

const FeesComponent = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);

  const [user_id, setUserID] = useState(initialState.user_id);
  const [selectedDate, setSelectedDate] = useState(initialState.dateOfBirth);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [addFee, { isLoading }] = usePostMutation();
  const [feeTab, setFeeTab] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [userUUID, setUserUUID] = useState(null); // Add

  const signInValidation = Yup.object({
    total_fee: Yup.string().required("Fees is required"),
    note: Yup.string().required("Note is required"),
    submit_date: Yup.string().required("Paid date is required"),
    user_id: Yup.string().required("Student Name is required"),
  });

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
      setFormSubmitted(true);
      const formattedDate = format(values.submit_date, "yyyy-MM-dd");
      const payload = {
        ...values,
        submit_date: formattedDate,
        class_id: "1",
      };

      validateForm().then(async (validationErrors) => {
        if (Object.keys(validationErrors).length === 0) {
          try {
            const res = await addFee({
              path: "/admin/fees/create",
              body: payload,
            }).unwrap();
            showToast("Added Successfully", "success");
            resetForm();
          } catch (err) {
            showError(err);
            console.error("Failed to sucees:", err);
          } finally {
            setSubmitting(false);
          }
        } else {
          setSubmitting(false);
        }
      });
    },
  });

  const handleBatchChange = (e, field) => {
    const value = e.value;
    const uuid = e.uuid; // Assuming uuid is part of the selected option
    setUserID(value);
    setUserUUID(uuid); // Store the UUID
  };

  const handleNumbersOnly = (e) => {
    const inputValue = e.target.value;
    // Regex to allow only numbers and spaces
    if (/^[0-9--\s]*$/.test(inputValue)) {
      handleChange(e);
    }
  };
  return (
    <div className="w-11/12 mx-auto ">
      <Header
        title="Fees"
        setIsCreateModalOpen={setIsCreateModalOpen}
        isMultipleSelected={isMultipleSelected}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        showActionButton={true}
        buttontitle={true}
        icon={<Fees />}
        setFeeTab={setFeeTab}
      />
      {feeTab ? (
        <FeeVoucherComponent setFeeTab={setFeeTab} id={userUUID} />
      ) : (
        <AddFeeComponent
          handleBatchChange={handleBatchChange}
          handleNumbersOnly={handleNumbersOnly}
          handleChange={handleChange}
          handleBlur={handleBlur}
          setFieldValue={setFieldValue}
          values={values}
          errors={errors}
          handleSubmit={handleSubmit}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          touched={touched}
          user_id={user_id}
          setStudentId={setStudentId}
        />
      )}
    </div>
  );
};

export default FeesComponent;
