import React, { useEffect, useState } from "react";
import { X, FileText, DollarSign, Download } from "lucide-react";
import { usePostWithPdfDownloadMutation } from "../../api/apiSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const GenerateChallanModal = ({ isOpen, setIsOpen, student, refetchStudents , isLaptopProvided}) => {
  const [createChallanWithPdf] = usePostWithPdfDownloadMutation();
  const [isGenerating, setIsGenerating] = useState(false);

  const navigate = useNavigate()
  
  const [challanData, setChallanData] = useState({
    totalFee: 20000,
    discount: 0,
    laptopFee: 0,
    installments: 1,
    note: "",
  });

  useEffect(() => {
    if (isOpen && isLaptopProvided !== undefined) {
      setChallanData((prev) => ({
        ...prev,
        laptopFee: isLaptopProvided === true || isLaptopProvided === "true" || isLaptopProvided === 1 ? 3000 : 0,
      }));
    }
  }, [isOpen, isLaptopProvided]);

  if (!isOpen || !student) return null;

 const handleChallanSubmit = async () => {
  // Validation
  if (!challanData.totalFee || challanData.totalFee <= 0) {
    toast.error("Please enter a valid total fee.");
    return;
  }

  if (!student.id) {
    toast.error("Student ID is missing.");
    return;
  }

  setIsGenerating(true);
  const loadingToast = toast.loading("Generating challan...");

  try {
    const payload = {
      user_id: student.id,
      course_id: student.course_id,
      discount: Number(challanData.discount) || 0,
      laptop_fee: Number(challanData.laptopFee) || 0,
      installments: Number(challanData.installments) || 1,
      note: challanData.note || "",
      total_fee: Number(challanData.totalFee),
    };

    const result = await createChallanWithPdf({
      path: "/admin/fees/create",
      body: payload,
      filename: `challan_${student.id}_${Date.now()}.pdf`,
    }).unwrap();

    toast.success("Challan generated and downloaded successfully!");

    setChallanData({
      totalFee: 20000,
      discount: 0,
      laptopFee: 3000,
      installments: 1,
      note: "",
    });

    setIsOpen(false);
    refetchStudents();
    navigate("/dashboard/students");
  } catch (error) {
    console.error("Error generating challan:", error);
    toast.error(error?.data?.message || "Failed to generate challan");
  } finally {
    toast.dismiss(loadingToast); // ✅ Always runs
    setIsGenerating(false);
  }
};

  const netPayable =
    Number(challanData.totalFee) -
    Number(challanData.discount) +
    Number(challanData.laptopFee);
  const installmentAmount =
    challanData.installments > 0
      ? Math.ceil(netPayable / Number(challanData.installments))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#014376] to-[#31918D] text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Generate Challan</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            disabled={isGenerating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Information */}
          <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-[#014376]">
            <h3 className="text-lg font-bold text-[#014376] mb-3">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="font-semibold text-gray-900">{student.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Course</p>
                <p className="font-semibold text-gray-900">{student.course || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instructor</p>
                <p className="font-semibold text-gray-900">{student.instructor || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Challan Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Total Fee (Rs) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={challanData.totalFee}
                onChange={(e) =>
                  setChallanData((prev) => ({
                    ...prev,
                    totalFee: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014376]"
                min="0"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Discount (Rs)
              </label>
              <input
                type="number"
                value={challanData.discount}
                onChange={(e) =>
                  setChallanData((prev) => ({
                    ...prev,
                    discount: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014376]"
                min="0"
                disabled={isGenerating}
              />
            </div>

          <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Laptop Fee (Rs)
                {/* ✅ SHOW AUTO-FILLED INDICATOR */}
               
              </label>
              <input
                type="number"
                value={challanData.laptopFee}
                onChange={(e) =>
                  setChallanData((prev) => ({
                    ...prev,
                    laptopFee: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014376]"
                min="0"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Number of Installments <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={challanData.installments}
                onChange={(e) =>
                  setChallanData((prev) => ({
                    ...prev,
                    installments: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014376]"
                min="1"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Note (Optional)
              </label>
              <textarea
                value={challanData.note}
                onChange={(e) =>
                  setChallanData((prev) => ({ ...prev, note: e.target.value }))
                }
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014376]"
                rows="3"
                placeholder="Add any additional notes..."
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Fee Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-5 rounded-xl border-2 border-[#31918D]">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-[#31918D]" />
              <h3 className="font-bold text-[#014376]">Fee Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Total Fee:</span>
                <span className="font-semibold">
                  Rs {Number(challanData.totalFee).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span className="font-semibold">
                  - Rs {Number(challanData.discount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Laptop Fee:</span>
                <span className="font-semibold">
                  + Rs {Number(challanData.laptopFee).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2"></div>
              <div className="flex justify-between font-bold text-base">
                <span>Net Payable:</span>
                <span className="text-green-600">
                  Rs {netPayable.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Per Installment:</span>
                <span className="font-semibold">
                  Rs {installmentAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleChallanSubmit}
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#014376] to-[#31918D] hover:from-[#013057] hover:to-[#267b78] transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {isGenerating ? "Generating..." : "Generate & Download"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateChallanModal;