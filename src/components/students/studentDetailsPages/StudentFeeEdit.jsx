import React, { useEffect, useState, useMemo } from "react";
import { DollarSign, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  usePatchMutation,
  usePostMutation,
  useGetQuery,
} from "../../../api/apiSlice";
import FormInput from "../../ui/FormInput";
import Loader from "../../ui/common/LoaderComponent";

const StudentFeeEdit = ({
  isOpen,
  onClose,
  studentUuid,
  refetch,
  studentData,
  isLoadingStudent,
}) => {
  const [updateFee, { isLoading: isUpdating }] = usePostMutation();

  const [formData, setFormData] = useState({
    courseFee: 20000,
    laptopFee: 0,
    discount: 0,
    installments: 1,
    note: "",
    first_installment: 0,
    second_installment: 0,
    third_installment: 0,
    laptopProvided: false,
    selectedLaptop: "",
    batchId: "",
    civilmilitary: "",
  });

  // Laptop query based on batch and student type
  const laptopQuery = useMemo(() => {
    if (!formData.batchId || !formData.civilmilitary) return null;

    const isCivilian =
      formData.civilmilitary === "civilian" ? formData.civilmilitary : 0;
    return `admin/inventory/inventories/get-laptop-inventory?is_civilian=${isCivilian}&class_id=${formData.batchId}`;
  }, [formData.civilmilitary, formData.batchId]);

  const {
    data: laptops,
    isLoading: laptopsLoading,
    isFetching: laptopsFetching,
  } = useGetQuery(
    { path: laptopQuery },
    { skip: !laptopQuery || !formData.laptopProvided }
  );

  // Auto-fill form when studentData loads and modal opens
  useEffect(() => {
    if (!isOpen || !studentData?.data) return;

    const student = studentData.data;
    const feeObj = student.class_details?.[0]?.fees;

    if (!feeObj) {
      console.warn("No fee data found in class_details[0].fees");
      return;
    }

    const installments = feeObj.installments || [];

    setFormData({
      courseFee: Number(feeObj.total_fee) || 20000,
      laptopFee: Number(feeObj.laptop_fee) || 0,
      discount: Number(feeObj.discount_fee) || 0,
      installments: Number(feeObj.total_installments) || 1,
      note: feeObj.note || "",
      first_installment: Number(installments[0]?.amount) || 0,
      second_installment: Number(installments[1]?.amount) || 0,
      third_installment: Number(installments[2]?.amount) || 0,
      laptopProvided: Number(feeObj.laptop_fee) > 0,
      selectedLaptop: student.inventory_id || "",
      batchId: student.class_details?.[0]?.class_id || "",
      civilmilitary: student.student_type || "",
    });
  }, [studentData, isOpen]);

  // Auto-calculate installments when base values change
  useEffect(() => {
    if (!isOpen) return;

    const course = Number(formData.courseFee) || 0;
    const laptop = Number(formData.laptopFee) || 0;
    const disc = Number(formData.discount) || 0;
    const instCount = Number(formData.installments) || 1;

    const net = course + laptop - disc;
    const per = Math.round(net / instCount);

    if (instCount === 1) {
      setFormData((prev) => ({
        ...prev,
        first_installment: 0,
        second_installment: 0,
        third_installment: 0,
      }));
    } else if (instCount === 2) {
      setFormData((prev) => ({
        ...prev,
        first_installment: per,
        second_installment: net - per,
        third_installment: 0,
      }));
    } else if (instCount === 3) {
      const first = per;
      const second = per;
      const third = net - first - second;
      setFormData((prev) => ({
        ...prev,
        first_installment: first,
        second_installment: second,
        third_installment: third,
      }));
    }
  }, [
    formData.courseFee,
    formData.laptopFee,
    formData.discount,
    formData.installments,
    isOpen,
  ]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle laptop provided selection
    if (name === "laptopProvided") {
      const isProvided = value === "true" || value === true;
      setFormData((prev) => ({
        ...prev,
        laptopProvided: isProvided,
        laptopFee: isProvided ? 3000 : 0,
        selectedLaptop: isProvided ? prev.selectedLaptop : "",
      }));
      return;
    }

    // Handle laptop selection
    if (name === "selectedLaptop") {
      setFormData((prev) => ({ ...prev, selectedLaptop: value }));
      return;
    }

    // Handle first installment manual override
    if (name === "first_installment") {
      const first = Number(value) || 0;
      const net =
        Number(formData.courseFee) +
        Number(formData.laptopFee) -
        Number(formData.discount);
      const instCount = Number(formData.installments);

      if (instCount === 2) {
        setFormData((prev) => ({
          ...prev,
          first_installment: first,
          second_installment: net - first,
        }));
      } else if (instCount === 3) {
        const remaining = net - first;
        const second = Math.round(remaining / 2);
        setFormData((prev) => ({
          ...prev,
          first_installment: first,
          second_installment: second,
          third_installment: remaining - second,
        }));
      }
      return;
    }

    // Handle second installment manual override (only for 3 installments)
    if (name === "second_installment" && Number(formData.installments) === 3) {
      const second = Number(value) || 0;
      const net =
        Number(formData.courseFee) +
        Number(formData.laptopFee) -
        Number(formData.discount);
      const first = Number(formData.first_installment);
      setFormData((prev) => ({
        ...prev,
        second_installment: second,
        third_installment: net - first - second,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const netPayable = useMemo(() => {
    return (
      Number(formData.courseFee) +
      Number(formData.laptopFee) -
      Number(formData.discount)
    );
  }, [formData.courseFee, formData.laptopFee, formData.discount]);

  const perInstallment = useMemo(() => {
    return formData.installments > 0
      ? Math.ceil(netPayable / Number(formData.installments))
      : 0;
  }, [netPayable, formData.installments]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const feeUuid = studentData?.data?.class_details?.[0]?.fees?.fee_uuid;

    if (!feeUuid) {
      toast.error("Fee UUID not found");
      return;
    }

    // Validate laptop selection if laptop is provided
    if (formData.laptopProvided && !formData.selectedLaptop) {
      toast.error("Please select a laptop");
      return;
    }

    try {
      const payload = new FormData();

      // Append all fee details
      payload.append("total_fee", formData.courseFee);
      payload.append("laptop_fee", Number(formData.laptopFee));
      payload.append("discount", Number(formData.discount));
      payload.append("installments", Number(formData.installments));
      payload.append("note", formData.note || "");
      payload.append("generateChallan", 1);

      // Calculate installment amounts
      const instCount = Number(formData.installments);
      const net =
        Number(formData.courseFee) +
        Number(formData.laptopFee) -
        Number(formData.discount);
      const amounts = [];

      for (let i = 0; i < instCount; i++) {
        if (instCount === 1) {
          amounts.push(net);
        } else if (i === 0) {
          amounts.push(Number(formData.first_installment) || 0);
        } else if (i === 1) {
          amounts.push(Number(formData.second_installment) || 0);
        } else if (i === 2) {
          amounts.push(Number(formData.third_installment) || 0);
        }
      }

      // Append installment amounts
      amounts.forEach((amt, idx) => {
        payload.append(`installment_amounts[${idx}]`, String(amt));
      });

      // Append laptop inventory ID if laptop is provided
      if (formData.laptopProvided && formData.selectedLaptop) {
        payload.append("inventory_id", formData.selectedLaptop);
      }

      await updateFee({
        path: `admin/fees/${feeUuid}/update-fee?_method=PATCH`,
        body: payload,
      }).unwrap();

      toast.success("Fee information updated successfully!");
      refetch?.();
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error?.data?.message || "Failed to update fee information");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-full custom-Background">
                <DollarSign color="white" />
              </div>
              <h1 className="text-3xl font-bold text-[#aa0e0e]">
                Edit Fee Information
              </h1>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoadingStudent ? (
            <Loader />
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormInput
                    type="number"
                    label="Course Fee (PKR)"
                    name="courseFee"
                    value={formData.courseFee}
                    onChange={handleChange}
                    required
                  />

                  <FormInput
                    type="select"
                    label="Laptop Provided"
                    name="laptopProvided"
                    value={formData.laptopProvided}
                    onChange={handleChange}
                    options={[
                      { label: "Yes", value: true },
                      { label: "No", value: false },
                    ]}
                  />

                  <FormInput
                    type="number"
                    label="Laptop Fee (PKR)"
                    name="laptopFee"
                    value={formData.laptopFee}
                    disabled
                  />

                  {formData.laptopProvided === true && (
                    <div className="flex flex-col">
                      <label className="mb-2 text-sm font-semibold text-gray-700">
                        Select Laptop <span className="text-red-500">*</span>
                      </label>

                      {laptopsLoading || laptopsFetching ? (
                        <div className="px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                          Loading laptops…
                        </div>
                      ) : laptops?.data?.length ? (
                        <select
                          name="selectedLaptop"
                          value={formData.selectedLaptop || ""}
                          onChange={handleChange}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a Laptop</option>
                          {laptops.data.map((laptop) => (
                            <option key={laptop.id} value={laptop.id}>
                              {laptop.tag}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-red-600 px-4 py-2 border border-red-300 rounded-lg bg-red-50">
                          No laptops available for the selected class / type.
                        </p>
                      )}
                    </div>
                  )}

                  <FormInput
                    type="number"
                    label="Discount (PKR)"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                  />

                  <FormInput
                    type="select"
                    label="Number of Installments"
                    name="installments"
                    value={formData.installments}
                    onChange={handleChange}
                    options={[
                      { label: "1", value: 1 },
                      { label: "2", value: 2 },
                      { label: "3", value: 3 },
                    ]}
                    required
                  />

                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-semibold text-gray-700">
                      Net Payable (PKR)
                    </label>
                    <input
                      type="text"
                      value={`Rs. ${netPayable.toLocaleString()}`}
                      disabled
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-semibold text-gray-700">
                      Per Installment (PKR)
                    </label>
                    <input
                      type="text"
                      value={`Rs. ${perInstallment.toLocaleString()}`}
                      disabled
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
                    />
                  </div>

                  {Number(formData.installments) >= 2 && (
                    <>
                      <FormInput
                        type="number"
                        label="First Installment (PKR)"
                        name="first_installment"
                        value={formData.first_installment}
                        onChange={handleChange}
                        min="0"
                        max={netPayable}
                        required
                        placeholder="Auto-calculated, can be edited"
                      />
                      <FormInput
                        type="number"
                        label="Second Installment (PKR)"
                        name="second_installment"
                        value={formData.second_installment}
                        onChange={
                          Number(formData.installments) === 3
                            ? handleChange
                            : undefined
                        }
                        disabled={Number(formData.installments) === 2}
                        placeholder={
                          Number(formData.installments) === 2
                            ? "Auto-calculated"
                            : "Auto-calculated, can be edited"
                        }
                      />
                    </>
                  )}

                  {Number(formData.installments) === 3 && (
                    <FormInput
                      type="number"
                      label="Third Installment (PKR)"
                      name="third_installment"
                      value={formData.third_installment}
                      disabled
                      placeholder="Auto-calculated based on 1st & 2nd"
                    />
                  )}

                  <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <FormInput
                      type="textarea"
                      label="Note (Optional)"
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-3 rounded-lg font-semibold text-white custom-AddButton transition disabled:opacity-50"
                  >
                    {isUpdating ? "Updating..." : "Update Fee Information"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFeeEdit;
