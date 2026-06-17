/* eslint-disable react/prop-types */
import { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { X } from "lucide-react";

const ChallanModal = ({
  showPrompt,
  showForm,
  onCancel,
  onConfirmGenerate,
  studentData,
  navigateToStudents,
}) => {
  const [challanData, setChallanData] = useState({
    discount: 0,
    installments: 1,
    totalFee: studentData?.fixedFee || 0,
  });

  const generateChallanPDF = (student, challanData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const instituteName = "Rohi E-Skill Learning Hub";
    const instituteTagline = "Building Future Leaders";

    // Header Border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(10, 10, pageWidth - 20, 35);

    const logoUrl = "../../../assets/Rohi logo 3d.png";
    const img = new Image();
    img.src = logoUrl;

    img.onload = function () {
      doc.addImage(img, "PNG", 15, 17, 20, 20);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text(instituteName, 40, 25);

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(instituteTagline, 40, 32);

      doc.setDrawColor(0, 0, 0);
      doc.line(10, 52, pageWidth - 10, 52);
      doc.line(10, 62, pageWidth - 10, 62);

      doc.setFontSize(16);
      doc.text("FEE CHALLAN", 15, 58);
      doc.setFontSize(9);
      doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, pageWidth - 50, 58);

      // Student Info
      let yPos = 75;
      doc.rect(15, yPos, pageWidth - 30, 35);
      doc.setFontSize(12).text("Student Information", 20, yPos + 8);
      doc.line(15, yPos + 10, pageWidth - 15, yPos + 10);

      doc.setFontSize(9);
      doc.text("Student Name:", 20, yPos + 18);
      doc.setFont(undefined, "bold").text(student.name || "Unknown", 50, yPos + 18);
      doc.setFont(undefined, "normal");
      doc.text("Course Name:", 20, yPos + 27);
      doc.setFont(undefined, "bold").text(student.courseName || "N/A", 50, yPos + 27);

      // Fee Breakdown
      yPos = 125;
      const { totalFee = 0, discount = 0, installments = 1 } = challanData;
      const netPayable = totalFee - discount;
      doc.setFillColor(0, 0, 0);
      doc.rect(15, yPos, pageWidth - 30, 10, "F");
      doc.setTextColor(255, 255, 255).text("Fee Breakdown", 20, yPos + 7);

      // Fee rows
      yPos += 15;
      doc.setTextColor(0, 0, 0).setFontSize(10);
      doc.text("Total Course Fee", 20, yPos);
      doc.text(`Rs ${totalFee.toLocaleString()}`, pageWidth - 40, yPos, { align: "right" });
      doc.line(15, yPos + 3, pageWidth - 15, yPos + 3);

      yPos += 10;
      doc.text("Discount Applied", 20, yPos);
      doc.text(`- Rs ${discount.toLocaleString()}`, pageWidth - 40, yPos, { align: "right" });
      doc.line(15, yPos + 3, pageWidth - 15, yPos + 3);

      yPos += 10;
      doc.roundedRect(15, yPos - 5, pageWidth - 30, 12, 2, 2);
      doc.text("Net Payable Amount", 20, yPos + 3);
      doc.text(`Rs ${netPayable.toLocaleString()}`, pageWidth - 40, yPos + 3, { align: "right" });

      // Installments
      yPos += 20;
      const installmentAmount = Math.ceil(netPayable / installments);
      doc.roundedRect(15, yPos, pageWidth - 30, 28, 3, 3);
      doc.text("Installment Plan", 20, yPos + 8);
      doc.text("Number of Installments:", 20, yPos + 18);
      doc.text(String(installments), 75, yPos + 18);
      doc.text("Per Installment:", pageWidth - 90, yPos + 18);
      doc.text(`Rs ${installmentAmount.toLocaleString()}`, pageWidth - 30, yPos + 18, { align: "right" });

      // Footer
      doc.line(10, pageHeight - 25, pageWidth - 10, pageHeight - 25);
      doc.setFontSize(7);
      doc.text("This is a computer-generated challan. No signature required.", pageWidth / 2, pageHeight - 10, {
        align: "center",
      });

      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Challan_${student.name || "Student"}_${new Date().getTime()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    };
  };

  const handleChallanSubmit = (e) => {
    e.preventDefault();
    if (!challanData.totalFee || challanData.totalFee <= 0) {
      alert("Please enter a valid total fee.");
      return;
    }
    const student = {
      name: `${studentData.first_name} ${studentData.last_name}`,
      courseName: studentData.courseName,
      id: studentData.id || "TEMP_ID",
    };
    generateChallanPDF(student, challanData);
    onConfirmGenerate();
    navigateToStudents();
  };

  // 🔹 Challan Prompt
  if (showPrompt) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] text-center">
          <h2 className="text-xl font-semibold mb-4">
            Generate challan for this student?
          </h2>
          <X/>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onConfirmGenerate}
              className="bg-green-600 text-white px-5 py-2 rounded-lg"
            >
              Yes
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-400 text-white px-5 py-2 rounded-lg"
            >
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 Challan Form
  if (showForm) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
        <form
          onSubmit={handleChallanSubmit}
          className="bg-white p-6 rounded-xl shadow-xl w-[420px]"
        >
          <h2 className="text-xl font-bold mb-4 text-center">Challan Details</h2>

          <label className="block mb-2 font-semibold">Discount (%)</label>
          <input
            type="number"
            value={challanData.discount}
            onChange={(e) =>
              setChallanData((prev) => ({ ...prev, discount: e.target.value }))
            }
            className="w-full mb-4 border px-3 py-2 rounded"
            min="0"
          />

          <label className="block mb-2 font-semibold">Installments</label>
          <input
            type="number"
            value={challanData.installments}
            onChange={(e) =>
              setChallanData((prev) => ({
                ...prev,
                installments: e.target.value,
              }))
            }
            className="w-full mb-4 border px-3 py-2 rounded"
            min="1"
          />

          <label className="block mb-2 font-semibold">Total Fee</label>
          <input
            type="number"
            value={challanData.totalFee}
            onChange={(e) =>
              setChallanData((prev) => ({ ...prev, totalFee: e.target.value }))
            }
            className="w-full mb-4 border px-3 py-2 rounded"
            min="0"
          />

          <button
            type="submit"
            className="w-full custom-AddButton text-white py-2 rounded-lg font-semibold"
          >
            Generate Challan
          </button>
        </form>
      </div>
    );
  }

  return null;
};

export default ChallanModal;


