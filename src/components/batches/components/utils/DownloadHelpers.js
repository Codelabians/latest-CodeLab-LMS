// utils/downloadHelpers.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Your logo as base64 string
const LOGO_BASE64 = "data:image/png;base64,YOUR_BASE64_STRING_HERE";

/**
 * Download students list as PDF
 */
export const downloadStudentsPDF = (students, classData, filterType, fileName) => {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add Header Background
  doc.setFillColor(1, 67, 118);
  doc.rect(0, 0, pageWidth, 45, "F");
  
  // Add Logo
  try {
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = 10;
    const logoY = 10;
    doc.addImage(LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.warn("Could not add logo:", error);
  }
  
  // Add Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Students List Report", pageWidth / 2, 18, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(classData.name, pageWidth / 2, 28, { align: "center" });
  doc.text(`Course: ${classData.course?.name || "N/A"}`, pageWidth / 2, 36, { align: "center" });

  // Add Class Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  let yPosition = 55;
  
  doc.setFont("helvetica", "bold");
  doc.text("Class Information:", 14, yPosition);
  doc.setFont("helvetica", "normal");
  
  yPosition += 7;
  doc.text(`Instructor: ${classData.teacher?.name || "N/A"}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Time: ${classData.timing || "N/A"}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Hall: ${classData.hall?.name || "N/A"}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Status: ${filterType.toUpperCase()}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Total Students: ${students.length}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  
  yPosition += 10;

  // Prepare table data
  const tableData = students.map((student, index) => [
    index + 1,
    `${student.first_name || ""} ${student.last_name || ""}`.trim() || "N/A",
    student.email || "N/A",
    student.cnic || "N/A",
    student.contact || "N/A",
    student.gender || "N/A",
    student.city || "N/A",
    (student.status || "N/A").toUpperCase(),
  ]);

  // Add table
  autoTable(doc, {
    startY: yPosition,
    head: [["#", "Name", "Email", "CNIC", "Contact", "Gender", "City", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [1, 67, 118],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 15 },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
    },
    margin: { top: 10, left: 14, right: 14 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        try {
          doc.addImage(LOGO_BASE64, 'PNG', 10, 10, 15, 15);
        } catch (error) {
          console.warn("Could not add logo on page:", error);
        }
      }
      
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    },
  });

  doc.save(fileName);
};

/**
 * Download inquiries list as PDF
 * @param {Array} inquiries - Array of inquiry objects
 * @param {String} filterType - Type of filter (all, process, enrolled, etc.)
 * @param {String} fileName - Name of the PDF file
 */
export const downloadInquiriesPDF = (inquiries, filterType, fileName) => {
  const doc = new jsPDF("landscape"); // Landscape for more columns
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add Header Background
  doc.setFillColor(1, 67, 118);
  doc.rect(0, 0, pageWidth, 45, "F");
  
  // Add Logo
  try {
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = 10;
    const logoY = 10;
    doc.addImage(LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.warn("Could not add logo:", error);
  }
  
  // Add Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Inquiries Report", pageWidth / 2, 18, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Student Inquiry Management System", pageWidth / 2, 28, { align: "center" });

  // Add Report Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  let yPosition = 55;
  
  doc.setFont("helvetica", "bold");
  doc.text("Report Information:", 14, yPosition);
  doc.setFont("helvetica", "normal");
  
  yPosition += 7;
  doc.text(`Filter: ${filterType.toUpperCase()}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Total Inquiries: ${inquiries.length}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  
  yPosition += 10;

  // Prepare table data
  const tableData = inquiries.map((inquiry, index) => [
    index + 1,
    `${inquiry.first_name || ""} ${inquiry.last_name || ""}`.trim() || "N/A",
    inquiry.email || "N/A",
    inquiry.phone_number || "N/A",
    inquiry.cnic || "N/A",
    inquiry.primary_course || "N/A",
    inquiry.secondary_course || "N/A",
    inquiry.city || "N/A",
    (inquiry.status || "N/A").toUpperCase(),
    inquiry.civil_military || "N/A",
  ]);

  // Add table
  autoTable(doc, {
    startY: yPosition,
    head: [["#", "Name", "Email", "Phone", "CNIC", "Primary Course", "Secondary Course", "City", "Status", "Type"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [1, 67, 118],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 10 },  // #
      1: { cellWidth: 30 },  // Name
      2: { cellWidth: 40 },  // Email
      3: { cellWidth: 25 },  // Phone
      4: { cellWidth: 25 },  // CNIC
      5: { cellWidth: 35 },  // Primary Course
      6: { cellWidth: 35 },  // Secondary Course
      7: { cellWidth: 20 },  // City
      8: { cellWidth: 20 },  // Status
      9: { cellWidth: 18 },  // Type
    },
    margin: { top: 10, left: 14, right: 14 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        try {
          doc.addImage(LOGO_BASE64, 'PNG', 10, 10, 15, 15);
        } catch (error) {
          console.warn("Could not add logo on page:", error);
        }
      }
      
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    },
  });

  doc.save(fileName);
};

/**
 * Download detailed inquiries as PDF with all information
 */
export const downloadDetailedInquiriesPDF = (inquiries, filterType, fileName) => {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add Header Background
  doc.setFillColor(1, 67, 118);
  doc.rect(0, 0, pageWidth, 45, "F");
  
  // Add Logo
  try {
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = 10;
    const logoY = 10;
    doc.addImage(LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.warn("Could not add logo:", error);
  }
  
  // Add Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Inquiries Report", pageWidth / 2, 18, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Complete Inquiry Information", pageWidth / 2, 28, { align: "center" });

  let yPosition = 55;

  inquiries.forEach((inquiry, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // Inquiry Card
    doc.setFillColor(245, 245, 245);
    doc.rect(14, yPosition, pageWidth - 28, 8, "F");
    
    doc.setTextColor(1, 67, 118);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Inquiry #${index + 1}: ${inquiry.first_name} ${inquiry.last_name}`, 16, yPosition + 5.5);
    
    yPosition += 12;
    
    // Personal Information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Personal Information:", 16, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 5;
    
    doc.text(`Email: ${inquiry.email || "N/A"}`, 16, yPosition);
    yPosition += 4;
    doc.text(`Phone: ${inquiry.phone_number || "N/A"}`, 16, yPosition);
    yPosition += 4;
    doc.text(`CNIC: ${inquiry.cnic || "N/A"}`, 16, yPosition);
    yPosition += 4;
    doc.text(`Gender: ${inquiry.gender || "N/A"}`, 16, yPosition);
    doc.text(`City: ${inquiry.city || "N/A"}`, 105, yPosition);
    yPosition += 4;
    doc.text(`Address: ${inquiry.address || "N/A"}`, 16, yPosition);
    yPosition += 6;
    
    // Course Preferences
    doc.setFont("helvetica", "bold");
    doc.text("Course Preferences:", 16, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 5;
    
    doc.text(`Primary: ${inquiry.primary_course || "N/A"} (${inquiry.primary_status || "N/A"})`, 16, yPosition);
    yPosition += 4;
    doc.text(`Secondary: ${inquiry.secondary_course || "N/A"} (${inquiry.secondary_status || "N/A"})`, 16, yPosition);
    yPosition += 4;
    doc.text(`Tertiary: ${inquiry.tertiary_course || "N/A"} (${inquiry.tertiary_status || "N/A"})`, 16, yPosition);
    yPosition += 6;
    
    // Additional Information
    doc.setFont("helvetica", "bold");
    doc.text("Additional Information:", 16, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 5;
    
    doc.text(`Guardian: ${inquiry.guardian_name || "N/A"} (${inquiry.guardian_phone_number || "N/A"})`, 16, yPosition);
    yPosition += 4;
    doc.text(`Qualification: ${inquiry.current_qualification || "N/A"}`, 16, yPosition);
    yPosition += 4;
    doc.text(`Status: ${(inquiry.status || "N/A").toUpperCase()}`, 16, yPosition);
    doc.text(`Type: ${inquiry.civil_military || "N/A"}`, 105, yPosition);
    yPosition += 4;
    doc.text(`Laptop Demanded: ${inquiry.is_labtop_demanded || "N/A"}`, 16, yPosition);
    doc.text(`Price: Rs. ${inquiry.price || "N/A"}`, 105, yPosition);
    yPosition += 4;
    doc.text(`Submitted: ${inquiry.submitted_at || "N/A"}`, 16, yPosition);
    
    yPosition += 10;
  });

  // Add footer on last page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  doc.save(fileName);
};

/**
 * Download as CSV
 */
export const downloadStudentsCSV = (students, fileName) => {
  const headers = ["#", "Name", "Email", "CNIC", "Contact", "Gender", "City", "Status"];
  
  const csvData = students.map((student, index) => [
    index + 1,
    `${student.first_name || ""} ${student.last_name || ""}`.trim(),
    student.email || "",
    student.cnic || "",
    student.contact || "",
    student.gender || "",
    student.city || "",
    student.status || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download inquiries as CSV
 */
export const downloadInquiriesCSV = (inquiries, fileName) => {
  const headers = ["#", "Name", "Email", "Phone", "CNIC", "Primary Course", "Secondary Course", "Tertiary Course", "City", "Status", "Type", "Submitted Date"];
  
  const csvData = inquiries.map((inquiry, index) => [
    index + 1,
    `${inquiry.first_name || ""} ${inquiry.last_name || ""}`.trim(),
    inquiry.email || "",
    inquiry.phone_number || "",
    inquiry.cnic || "",
    inquiry.primary_course || "",
    inquiry.secondary_course || "",
    inquiry.tertiary_course || "",
    inquiry.city || "",
    inquiry.status || "",
    inquiry.civil_military || "",
    inquiry.submitted_at || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};