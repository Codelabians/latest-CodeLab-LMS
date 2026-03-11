import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGetQuery } from "../../../api/apiSlice";
import DownArrow from "../../../assets/images/instructor/downarrow.png";
import CnicLogo from "../../../assets/images/instructor/cnic.jpg";
import ResumePng from "../../../assets/images/instructor/resume.png";
import ContractPng from "../../../assets/images/instructor/contract.png";
import ExperienceLetter from "../../../assets/images/instructor/Experience-Letter.webp";
import Certificate from "../../../assets/images/instructor/certificate.jpg";
import AdditionalCertificate from "../../../assets/images/instructor/Training-Certificate.png";
import NoData from "../../../assets/images/instructor/nodata.png";

// Function to download Blob
export const downloadBlob = (data, fileName, mimeType) => {
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.style.display = "none";
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const EmployeeDocumentTab = () => {
  const { id } = useParams();
  const {
    data,
    error: emplpoyeeError,
    isLoading: employeeIsLoading,
    refetch: refetchEmployee,
  } = useGetQuery({
    path: `/admin/employee/${id}`,
  });

  useEffect(() => {
    refetchEmployee();
  }, []);

  const EmployeeData = data?.data;

  const employeeDocuments = [
    {
      label: "Cnic.Png",
      value: EmployeeData?.cnic_front?.file_url,
      src: CnicLogo,
      fileName: "Cnic.png",
    },
    {
      label: "Cnic.Png",
      value: EmployeeData?.cnic_back?.file_url,
      src: CnicLogo,
      fileName: "Cnic.png",
    },
    {
      label: "Resume.pdf",
      value: EmployeeData?.resume?.file_url,
      src: ResumePng,
      fileName: "Resume.pdf",
    },
    {
      label: "Contract.pdf",
      value: EmployeeData?.contract?.file_url,
      src: ContractPng,
      fileName: "Contract.pdf",
    },
    {
      label: "Experience Letter",
      value: EmployeeData?.experience_letter?.file_url,
      src: ExperienceLetter,
      fileName: "Experience_Letter.pdf",
    },
    {
      label: "Education.pdf",
      value: EmployeeData?.education?.file_url,
      src: Certificate,
      fileName: "Education.pdf",
    },
  ];

  const employeeAdditionalCertificates =
    EmployeeData?.additional_certificates?.map((certificate) => ({
      label: "Additional Certificate",
      value: certificate.file_url,
      src: AdditionalCertificate,
      fileName: "Additional_Certificate.pdf",
    }));

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      downloadBlob(
        blob,
        fileName,
        response.headers.get("Content-Type") || "application/octet-stream"
      );
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <div>
      {employeeIsLoading && <div>Loading...</div>}
      {emplpoyeeError && <div>Error loading Employee</div>}
      {!employeeIsLoading && !emplpoyeeError && (
        <>
          <div className="flex flex-col gap-10 font-Montserrat border border-[#d5dada] bg-white h-full w-full">
            <div className="flex flex-col gap-8">
              <h1 className="pt-6 pl-10 text-xl font-semibold">
                Compulsory Documents
              </h1>
              <div className="px-20 flex flex-wrap justify-start gap-12">
                {employeeDocuments?.map((document, index) => (
                  <div key={index}>
                    <div className="w-72 border-grayBordered cursor-pointer">
                      {document.value ? (
                        <img
                          src={document.src}
                          alt={document.label}
                          className="h-40 w-72 object-cover border border-grayBordered rounded-t-lg mx-auto"
                        />
                      ) : (
                        <img
                          src={NoData}
                          alt={document.label}
                          className="h-40 w-72 object-cover border border-grayBordered rounded-t-lg mx-auto"
                        />
                      )}
                    </div>
                    <div className="w-72 h-16 rounded-b-lg border bg-grayBordered flex justify-between items-center px-4">
                      <h1 className="font-medium text-lg">{document.label}</h1>
                      <button
                        className="px-3 py-2 cursor-pointer bg-white rounded-lg"
                        onClick={() =>
                          handleDownload(document.value, document.fileName)
                        }
                      >
                        <img src={DownArrow} alt="Download" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8 pb-10">
              <h1 className="pt-6 pl-10 text-xl font-semibold">
                Additional Documents
              </h1>
              <div className="px-20 flex flex-wrap justify-start gap-12">
                {employeeAdditionalCertificates?.map((document, index) => (
                  <div key={index}>
                    <div className="w-72 cursor-pointer border-[#E8E8E8]">
                      {document.value ? (
                        <img
                          src={document.src}
                          alt={document.label}
                          className="h-40 w-72 object-fit border border-[#E8E8E8] rounded-t-lg mx-auto"
                        />
                      ) : (
                        <img
                          src={NoData}
                          alt={document.label}
                          className="h-40 w-72 object-center border border-[#E8E8E8] rounded-t-lg mx-auto"
                        />
                      )}
                    </div>
                    <div className="w-72 h-16 rounded-b-lg border bg-[#E8E8E8] flex justify-between items-center px-4">
                      <h1 className="font-medium text-lg">{document.label}</h1>
                      <button
                        className="px-3 py-2 cursor-pointer bg-white rounded-lg"
                        onClick={() =>
                          handleDownload(document.value, document.fileName)
                        }
                      >
                        <img src={DownArrow} alt="Download" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeDocumentTab;
