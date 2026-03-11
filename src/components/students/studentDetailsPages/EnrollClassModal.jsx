import { AlertCircle, Laptop, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useGetQuery, useSmartPostMutation } from "../../../api/apiSlice";
import FormInput from "../../ui/FormInput";

const EnrollClassModal = ({
  isOpen,
  onClose,

  onSuccess,
  refetch,
  studentData,
}) => {
  const [enrollFormData, setEnrollFormData] = useState({
    classId: "",
    className: "",
    courseId: "",
    courseName: "",
    courseFee: 20000,
    discount: 0,
    laptopFee: 0,
    installments: 1,
    first_installment: 0,
    second_installment: 0,
    third_installment: 0,
    generateChallan: true,
    inventoryId: "",
    note: "",
    provideLaptop: "", // New field for laptop provision dropdown
  });
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [selectedClassId, setSelectedClassId] = useState(null);
  const laptopDemanded = studentData?.data?.laptop_provided === true;

  const {
    data: classData,
    isLoading: isLoadingClasses,
    isFetching: isClassesFetching,
  } = useGetQuery({
    path: "admin/classes",
    params: {
      ...(selectedBatch !== "all" && { batch_id: selectedBatch?.id }), // NEW: Add batch_id to query
    },
  });
  const { data: batchesData, isLoading: isLoadingBatches } = useGetQuery({
    path: "admin/batches",
  });

  // Build laptop query based on student's civil/military status and selected class
  const laptopQuery = useMemo(() => {
    if (!selectedClassId || enrollFormData.provideLaptop !== "yes") return null;

    const isCivilian = studentData?.data?.student_type;
    return `admin/inventory/inventories/get-laptop-inventory?is_civilian=${isCivilian}&class_id=${selectedClassId}`;
  }, [
    selectedClassId,
    enrollFormData.provideLaptop,
    studentData?.data?.student_type,
  ]);

  // Fetch laptops/inventory based on query
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    isFetching: laptopsFetching,
  } = useGetQuery({ path: laptopQuery }, { skip: !laptopQuery });

  const [enrollStudent, { isLoading: isEnrolling }] = useSmartPostMutation();

  // Auto-set laptop fee when admin selects "Yes" to provide laptop
  useEffect(() => {
    if (enrollFormData.provideLaptop === "yes") {
      setEnrollFormData((prev) => ({
        ...prev,
        laptopFee: 3000,
      }));
    } else if (enrollFormData.provideLaptop === "no") {
      setEnrollFormData((prev) => ({
        ...prev,
        laptopFee: 0,
        inventoryId: "",
      }));
    }
  }, [enrollFormData.provideLaptop]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "classId") {
      const selectedClass = classData?.data?.find(
        (classItem) => String(classItem.class_id) === String(value),
      );

      setSelectedClassId(selectedClass?.class_id || null);

      setEnrollFormData({
        ...enrollFormData,
        classId: selectedClass?.class_id || "",
        className: selectedClass?.name || "",
        courseId: selectedClass?.course?.id || "",
        courseName: selectedClass?.course?.name || "",
        courseFee: selectedClass?.course?.fee || 20000,
        laptopFee: enrollFormData.provideLaptop === "yes" ? 3000 : 0,
        inventoryId: "",
      });
      return;
    }
    if (name === "batchId") {
      const selectBatch = batchesData?.data?.find(
        (batchItem) => String(batchItem.name) === String(value),
      );
      setSelectedBatch(selectBatch);
    }

    if (name === "generateChallan") {
      setEnrollFormData({
        ...enrollFormData,
        generateChallan: checked,
      });
      return;
    }

    if (name === "installments") {
      const numInstallments = Number(value);
      const netPayable = getNetPayable();

      if (numInstallments === 1) {
        setEnrollFormData({
          ...enrollFormData,
          installments: value,
          first_installment: netPayable,
          second_installment: 0,
          third_installment: 0,
        });
      } else if (numInstallments === 2) {
        const perInstallment = Math.round(netPayable / 2);
        setEnrollFormData({
          ...enrollFormData,
          installments: value,
          first_installment: perInstallment,
          second_installment: netPayable - perInstallment,
          third_installment: 0,
        });
      } else if (numInstallments === 3) {
        const perInstallment = Math.round(netPayable / 3);
        const remainder = netPayable - perInstallment * 2;
        setEnrollFormData({
          ...enrollFormData,
          installments: value,
          first_installment: perInstallment,
          second_installment: perInstallment,
          third_installment: remainder,
        });
      }
      return;
    }

    if (name === "first_installment") {
      const firstInstallmentValue = parseFloat(value) || 0;
      const netPayable = getNetPayable();
      const remainingAmount = netPayable - firstInstallmentValue;
      const numInstallments = Number(enrollFormData.installments);

      if (numInstallments === 2) {
        setEnrollFormData({
          ...enrollFormData,
          first_installment: firstInstallmentValue,
          second_installment: remainingAmount > 0 ? remainingAmount : 0,
        });
      } else if (numInstallments === 3) {
        const remainingPerInstallment =
          remainingAmount > 0 ? Math.round(remainingAmount / 2) : 0;
        const lastInstallment =
          remainingAmount > 0 ? remainingAmount - remainingPerInstallment : 0;
        setEnrollFormData({
          ...enrollFormData,
          first_installment: firstInstallmentValue,
          second_installment: remainingPerInstallment,
          third_installment: lastInstallment,
        });
      }
      return;
    }

    if (name === "second_installment") {
      const numInstallments = Number(enrollFormData.installments);
      if (numInstallments === 2) {
        const secondInstallmentValue = parseFloat(value) || 0;
        const netPayable = getNetPayable();
        const firstInstallment = netPayable - secondInstallmentValue;
        setEnrollFormData({
          ...enrollFormData,
          first_installment: firstInstallment > 0 ? firstInstallment : 0,
          second_installment: secondInstallmentValue,
        });
      } else if (numInstallments === 3) {
        const secondInstallmentValue = parseFloat(value) || 0;
        const netPayable = getNetPayable();
        const remainingAmount =
          netPayable -
          enrollFormData.first_installment -
          secondInstallmentValue;
        setEnrollFormData({
          ...enrollFormData,
          second_installment: secondInstallmentValue,
          third_installment: remainingAmount > 0 ? remainingAmount : 0,
        });
      }
      return;
    }

    if (name === "third_installment") {
      const thirdInstallmentValue = parseFloat(value) || 0;
      const netPayable = getNetPayable();
      const remainingAmount =
        netPayable - enrollFormData.first_installment - thirdInstallmentValue;
      setEnrollFormData({
        ...enrollFormData,
        second_installment: remainingAmount > 0 ? remainingAmount : 0,
        third_installment: thirdInstallmentValue,
      });
      return;
    }

    // Prevent manual editing of laptop fee if admin selected to provide laptop
    if (name === "laptopFee" && enrollFormData.provideLaptop === "yes") {
      toast.info(
        "Laptop fee is automatically set to Rs. 3,000 when providing a laptop",
      );
      return;
    }

    setEnrollFormData({
      ...enrollFormData,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    });
  };

  const getNetPayable = () => {
    const courseFee = Number(enrollFormData.courseFee) || 0;
    const discount = Number(enrollFormData.discount) || 0;
    const laptopFee = Number(enrollFormData.laptopFee) || 0;
    return courseFee - discount + laptopFee;
  };

  const handleSubmit = async () => {
    if (!enrollFormData.classId) {
      toast.error("Please select a class");
      return;
    }

    // Validate laptop provision selection if student demanded laptop
    if (laptopDemanded && !enrollFormData.provideLaptop) {
      toast.error("Please select whether to provide laptop or not");
      return;
    }

    // Validate inventory selection if admin chose to provide laptop
    if (enrollFormData.provideLaptop === "yes" && !enrollFormData.inventoryId) {
      toast.error("Please select a laptop from inventory");
      return;
    }

    try {
      // Prepare installment amounts array
      const installmentAmounts = [];
      const numInstallments = Number(enrollFormData.installments);

      if (numInstallments === 1) {
        installmentAmounts.push(getNetPayable());
      } else if (numInstallments === 2) {
        installmentAmounts.push(enrollFormData.first_installment);
        installmentAmounts.push(enrollFormData.second_installment);
      } else if (numInstallments === 3) {
        installmentAmounts.push(enrollFormData.first_installment);
        installmentAmounts.push(enrollFormData.second_installment);
        installmentAmounts.push(enrollFormData.third_installment);
      }

      const payload = {
        user_id: String(studentData?.data?.id),
        class_id: String(enrollFormData.classId),
        total_fee: Number(enrollFormData.courseFee),
        discount: Number(enrollFormData.discount),
        laptop_fee: Number(enrollFormData.laptopFee),
        installments: Number(enrollFormData.installments),
        installment_amounts: installmentAmounts,
        note: enrollFormData.note || "",
        generateChallan: Boolean(enrollFormData.generateChallan),
        ...(enrollFormData.provideLaptop === "yes" && {
          inventory_id: String(enrollFormData.inventoryId),
        }),
      };

      const res = await enrollStudent({
        path: "/admin/student-class/add-class",
        body: payload,
      });
      if (res.error) {
        return toast.error(res?.error?.data?.message);
      }

      toast.success("Student enrolled successfully!");
      setEnrollFormData({
        classId: "",
        className: "",
        courseId: "",
        courseName: "",
        courseFee: 20000,
        discount: 0,
        laptopFee: 0,
        installments: 1,
        first_installment: 0,
        second_installment: 0,
        third_installment: 0,
        generateChallan: true,
        inventoryId: "",
        note: "",
        provideLaptop: "",
      });
      setSelectedClassId(null);
      if (onSuccess) onSuccess();
      if (refetch) refetch();
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to enroll student");
    }
  };

  if (!isOpen) return null;

  const netPayable = getNetPayable();
  const installmentAmount = Math.round(
    netPayable / enrollFormData.installments,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#014376]">
            Enroll in Another Class
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Laptop Demanded Alert - Only shows if student requested laptop */}
        {laptopDemanded && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Laptop className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 mb-1">
                  Laptop Requested by Student
                </h4>
                <p className="text-sm text-blue-700">
                  This student has requested a laptop. Please select whether to
                  provide one below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="space-y-4">
          {/* Batch select */}
          {/* <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-gray-700">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              name="batchId"
              value={selectedBatch?.name}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a Batch</option>
              {batchesData?.data?.map((batch) => (
                <option key={batch?.id} value={batch?.name}>
                  {batch?.name}
                </option>
              ))}
            </select>
          </div> */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-gray-700">
              Batch <span className="text-red-500">*</span>
            </label>
            {isLoadingBatches ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">
                  Loading batches...
                </span>
              </div>
            ) : (
              <select
                name="batchId"
                value={selectedBatch?.name}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a Batch</option>
                {batchesData?.data?.map((batch) => (
                  <option key={batch?.id} value={batch?.name}>
                    {batch?.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Class Selection */}

          <div className="flex flex-col">
            <label className="mb-2   text-sm font-semibold text-gray-700">
              Class <span className="text-red-500">*</span>
            </label>
            {isLoadingClasses || isClassesFetching ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">
                  Loading classes...
                </span>
              </div>
            ) : (
              <>
                <select
                  name="classId"
                  value={
                    enrollFormData.classId === ""
                      ? "No class in this batch"
                      : enrollFormData?.classId
                  }
                  disabled={!selectedBatch?.id}
                  onChange={handleChange}
                  className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${
                    !selectedBatch?.id
                      ? "bg-gray-100 cursor-not-allowed opacity-60"
                      : ""
                  }`}
                  required
                >
                  <option value="">
                    {!selectedBatch?.id
                      ? "Please select a batch first"
                      : "Select a Class"}
                  </option>
                  {selectedBatch?.id && classData?.data?.length > 0 ? (
                    classData?.data.map((classItem) => (
                      <option
                        key={classItem?.class_id}
                        value={classItem?.class_id}
                      >
                        {classItem?.name}
                      </option>
                    ))
                  ) : selectedBatch?.id && classData?.data?.length === 0 ? (
                    <option value="" disabled>
                      No classes available in this batch
                    </option>
                  ) : null}
                </select>
              </>
            )}
          </div>

          {/* Course (Auto-filled) */}
          <FormInput
            type="text"
            label="Course"
            name="courseName"
            value={enrollFormData.courseName}
            disabled
          />

          {/* Course Fee (Auto-filled) */}
          <FormInput
            type="number"
            label="Course Fee (PKR)"
            name="courseFee"
            value={enrollFormData.courseFee}
            onChange={handleChange}
            required
          />

          {/* Discount */}
          <FormInput
            type="number"
            label="Discount (PKR)"
            name="discount"
            value={enrollFormData.discount}
            onChange={handleChange}
            min="0"
          />

          {/* Laptop Provision Dropdown - Only show if student demanded laptop */}
          {laptopDemanded && (
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-semibold text-gray-700">
                Provide Laptop? <span className="text-red-500">*</span>
              </label>
              <select
                name="provideLaptop"
                value={enrollFormData.provideLaptop}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Option</option>
                <option value="yes">Yes - Provide Laptop (Rs. 3,000)</option>
                <option value="no">No - Don't Provide Laptop</option>
              </select>
              {enrollFormData.provideLaptop === "yes" && (
                <p className="mt-1 text-xs text-blue-600">
                  Laptop fee of Rs. 3,000 will be added to the total fee
                </p>
              )}
            </div>
          )}

          {/* Laptop Fee - Always visible (read-only) */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-gray-700">
              Laptop Fee (PKR)
            </label>
            <div className="relative">
              <input
                type="number"
                name="laptopFee"
                value={enrollFormData.laptopFee}
                onChange={handleChange}
                min="0"
                disabled={enrollFormData.provideLaptop === "yes"}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  enrollFormData.provideLaptop === "yes"
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />
              {enrollFormData.provideLaptop === "yes" && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Laptop className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </div>
            {enrollFormData.provideLaptop === "yes" && (
              <p className="mt-1 text-xs text-gray-600">
                Laptop fee is fixed at Rs. 3,000
              </p>
            )}
          </div>

          {/* Inventory/Laptop Selection - Only show if admin selected "Yes" and class is selected */}
          {enrollFormData.provideLaptop === "yes" && selectedClassId && (
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-semibold text-gray-700">
                Select Laptop <span className="text-red-500">*</span>
              </label>

              {isLoadingInventory || laptopsFetching ? (
                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">
                    Loading laptops...
                  </span>
                </div>
              ) : inventoryData?.data?.length > 0 ? (
                <>
                  <select
                    name="inventoryId"
                    value={enrollFormData.inventoryId}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a Laptop</option>
                    {inventoryData.data.map((laptop) => (
                      <option key={laptop.id} value={laptop.id}>
                        {laptop.tag}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-600">
                    {inventoryData.data.length} laptop(s) available for this
                    class
                  </p>
                </>
              ) : (
                <div className="px-4 py-3 border border-yellow-300 bg-yellow-50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      No Laptops Available
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      No laptops available for the selected class/type. Please
                      add laptops to the inventory first.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Installments Dropdown */}
          <FormInput
            type="select"
            label="Number of Installments"
            name="installments"
            value={enrollFormData.installments}
            onChange={handleChange}
            options={[
              { label: "1", value: 1 },
              { label: "2", value: 2 },
              { label: "3", value: 3 },
            ]}
            required
          />

          {/* Net Payable */}
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
            {enrollFormData.provideLaptop === "yes" && (
              <p className="mt-1 text-xs text-blue-600">
                Includes Rs. 3,000 laptop fee
              </p>
            )}
          </div>

          {/* Per Installment */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-gray-700">
              Per Installment (PKR)
            </label>
            <input
              type="text"
              value={`Rs. ${installmentAmount.toLocaleString()}`}
              disabled
              className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
            />
          </div>

          {/* Dynamic Installment Fields */}
          {Number(enrollFormData.installments) >= 2 && (
            <>
              <FormInput
                type="number"
                label="First Installment (PKR)"
                name="first_installment"
                value={enrollFormData.first_installment}
                onChange={handleChange}
                min="0"
                max={netPayable}
              />
              <FormInput
                type="number"
                label="Second Installment (PKR)"
                name="second_installment"
                value={enrollFormData.second_installment}
                onChange={handleChange}
                min="0"
                max={netPayable}
              />
            </>
          )}

          {Number(enrollFormData.installments) === 3 && (
            <FormInput
              type="number"
              label="Third Installment (PKR)"
              name="third_installment"
              value={enrollFormData.third_installment}
              onChange={handleChange}
              min="0"
              max={netPayable}
            />
          )}

          {/* Note */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-gray-700">
              Note (Optional)
            </label>
            <textarea
              name="note"
              value={enrollFormData.note}
              onChange={handleChange}
              rows="3"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes here..."
            />
          </div>

          {/* Generate Challan Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="generateChallan"
              name="generateChallan"
              checked={enrollFormData.generateChallan}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label
              htmlFor="generateChallan"
              className="text-sm font-semibold text-gray-700 cursor-pointer"
            >
              Generate Challan
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isEnrolling ||
              (enrollFormData.provideLaptop === "yes" &&
                (!enrollFormData.inventoryId || !inventoryData?.data?.length))
            }
            className="px-6 py-2 rounded-lg custom-Background text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnrolling ? "Enrolling..." : "Enroll"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnrollClassModal;
