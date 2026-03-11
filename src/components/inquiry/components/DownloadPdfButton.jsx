import jsPDF from "jspdf";
import { Download, Image as ImageIcon } from "lucide-react";
import logo from "../../../assets/Rohi logo 3d.png";

export default function DownloadPDFButton({ inquiry }) {
  if (!inquiry) return null;

  // Enhanced image loading function
  const loadImageForPDF = async (url) => {
    if (!url) return null;

    try {
      // AllOrigins proxy - most reliable
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        url,
      )}`;

      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const blob = await response.blob();

      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = () => {
          console.error("Failed to convert image to base64");
          reject(new Error("Failed to read image"));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading image:", error);
      return null;
    }
  };

  const handleDownload = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    const primaryColor = [0, 188, 212];
    const lightGray = [240, 240, 240];

    // Add Logo
    try {
      const logoImg = new Image();
      await new Promise((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error("Failed to load logo"));
        logoImg.src = logo;
      });
      doc.addImage(logoImg, "PNG", margin, 10, 15, 15);
    } catch (error) {
      console.error("Error loading logo:", error);
      doc.setDrawColor(0, 188, 212);
      doc.setFillColor(0, 188, 212);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.text("RESL", margin + 3.5, 19);
    }

    // Title
    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...primaryColor);
    const titleText = "TRAINING ENROLLMENT FORM";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, 30);

    // Subtitle
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100, 100, 100);
    const subtitleText = "Rohi E-Skill Learning Hub";
    const subtitleWidth = doc.getTextWidth(subtitleText);
    doc.text(subtitleText, (pageWidth - subtitleWidth) / 2, 37);

    // Profile Image
    let yPos = 50;
    const imgSize = 20;
    const imgX = margin + 5;
    const imgY = yPos;
    const centerX = imgX + imgSize / 2;
    const centerY = imgY + imgSize / 2;
    const radius = imgSize / 2;

    const base64Image = await loadImageForPDF(inquiry.profile_image);

    if (base64Image) {
      try {
        // Add the image directly without circles
        doc.addImage(
          base64Image,
          "JPEG",
          imgX,
          imgY,
          imgSize,
          imgSize,
          undefined,
          "NONE",
        );
      } catch (err) {
        console.error("Error adding image to PDF:", err);
        drawPlaceholder();
      }
    } else {
      drawPlaceholder();
    }

    function drawPlaceholder() {
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.setFillColor(240, 240, 240);
      doc.circle(centerX, centerY, radius, "FD");
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(6);
      doc.text("No Image", imgX + 3, centerY);
    }

    // Horizontal line
    yPos = 75;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Helper functions
    const addSectionHeader = (title, yPosition) => {
      doc.setFillColor(...lightGray);
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(title, margin + 3, yPosition + 5.5);
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPosition, 2, 8, "F");
      return yPosition + 12;
    };

    const addTwoColumnField = (label1, value1, label2, value2, yPosition) => {
      const colWidth = contentWidth / 2;
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(label1, margin + 3, yPosition);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(String(value1 || "N/A"), margin + 3, yPosition + 5);
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(label2, margin + colWidth + 3, yPosition);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(String(value2 || "N/A"), margin + colWidth + 3, yPosition + 5);
      return yPosition + 10;
    };

    // Calculate age
    const dob = inquiry.date_of_birth || inquiry.dateOfBirth;
    let age = "-- years old";
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        years--;
      }
      age = `${years} years old`;
    }

    // Student Information
    yPos = addSectionHeader("Student Information:", yPos + 5);
    yPos = addTwoColumnField(
      "Name:",
      inquiry.name ||
        `${inquiry.firstName || ""} ${inquiry.lastName || ""}`.trim() ||
        "N/A",
      "Age:",
      age,
      yPos,
    );

    const formattedDOB = dob
      ? new Date(dob).toLocaleDateString("en-GB")
      : "N/A";
    yPos = addTwoColumnField(
      "Date of Birth:",
      formattedDOB,
      "Gender:",
      inquiry.gender || "N/A",
      yPos,
    );
    yPos = addTwoColumnField(
      "Citizenship:",
      "Pakistani",
      "Email:",
      inquiry.email || "N/A",
      yPos,
    );
    yPos = addTwoColumnField(
      "Address:",
      inquiry.address || "N/A",
      "Phone:",
      inquiry.phone || "N/A",
      yPos,
    );

    // Education
    yPos += 5;
    yPos = addSectionHeader("Education & Qualifications:", yPos);
    yPos = addTwoColumnField(
      "Previous School:",
      inquiry.current_qualification || inquiry.currentQualification || "N/A",
      "Dates Attended:",
      inquiry.qualification_programs || inquiry.qualificationPrograms || "N/A",
      yPos,
    );

    // Courses
    yPos += 5;
    yPos = addSectionHeader("Course Selection:", yPos);

    const addCourse = (label, course, status) => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(label, margin + 3, yPos);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(course || "N/A", margin + 3, yPos + 5);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Status:", margin + 100, yPos);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...primaryColor);
      doc.text(status || "Basic", margin + 100, yPos + 5);
      yPos += 10;
    };

    addCourse(
      "Primary Course:",
      inquiry.primary_course || inquiry.primaryCourse,
      inquiry.primary_status,
    );
    addCourse(
      "Secondary Course:",
      inquiry.secondary_course || inquiry.secondaryCourse,
      inquiry.secondary_status,
    );
    addCourse(
      "Tertiary Course:",
      inquiry.tertiary_course || inquiry.tertiaryCourse,
      inquiry.tertiary_status,
    );

    yPos = addTwoColumnField(
      "Laptop Demanded:",
      inquiry.is_labtop_demanded || "No",
      "Total Fee:",
      `PKR ${inquiry.price || "0.00"}`,
      yPos,
    );

    // Family Background
    yPos += 5;
    yPos = addSectionHeader("Family Background:", yPos);
    yPos = addTwoColumnField(
      "Name of Father:",
      inquiry.guardian_name || inquiry.guardianName || "N/A",
      "Father's Occupation:",
      inquiry.job_title || inquiry.jobTitle || "N/A",
      yPos,
    );
    yPos = addTwoColumnField(
      "Employment Date:",
      "N/A",
      "Sector:",
      inquiry.civil_military || "N/A",
      yPos,
    );
    yPos = addTwoColumnField(
      "Enrollment Date & Time:",
      inquiry.date || new Date().toLocaleDateString(),
      "CNIC:",
      inquiry.cnic || "N/A",
      yPos,
    );

    // Footer
    doc.setFillColor(...primaryColor);
    doc.rect(0, pageHeight - 15, pageWidth, 15, "F");
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(255, 255, 255);
    const footerText =
      "Rohi E-Skill Learning Hub | Building Skills, Shaping Futures | mamoonashuja2512@gmail.com | rohieskillslearninghub.com";
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 8);

    // Save
    const fileName =
      inquiry.name ||
      `${inquiry.firstName || ""}_${inquiry.lastName || ""}`.replace(
        /^_|_$/g,
        "",
      ) ||
      "Enrollment";
    doc.save(`${fileName}_Enrollment.pdf`);
  };

  const handleDownloadProfileImage = async () => {
    if (!inquiry.profile_image) {
      alert("No profile image available");
      return;
    }

    try {
      const response = await fetch(inquiry.profile_image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension =
        inquiry.profile_image.split(".").pop().split("?")[0] || "jpg";
      const fileName =
        inquiry.name ||
        `${inquiry.firstName || ""}_${inquiry.lastName || ""}`.replace(
          /^_|_$/g,
          "",
        ) ||
        "Profile";
      link.download = `${fileName}_Profile.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading profile image:", error);
      alert("Failed to download profile image");
    }
  };

  return (
    <div className="flex gap-2">
      <button
        className="px-4 py-3 rounded-lg bg-white text-brown transition-colors font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
        onClick={handleDownload}
        title="Download Enrollment PDF"
      >
        <Download size={20} />
      </button>

      {inquiry.profile_image && (
        <button
          className="px-4 py-3 rounded-lg bg-white text-brown transition-colors font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
          onClick={handleDownloadProfileImage}
          title="Download Profile Image"
        >
          <ImageIcon size={20} />
        </button>
      )}
    </div>
  );
}
