import React, { useState } from "react";
import CodeLabLogo from "../../assets/images/park logo.png";
import BackArrow from "../../assets/icons/BackArrow";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useGetQuery } from "../../api/apiSlice";
import easyPaisa from "../../assets/images/fee/easyPaisa.png";
import JazzCash from "../../assets/images/fee/jazzcash.png";
import HBL from "../../assets/images/fee/hbl.png";

const FeeVoucherComponent = ({ setFeeTab, id }) => {
  const [data, setData] = useState({
    col2Row2: "",
    col2Row3: "",
    col2Row4: "",
    col2Row5: "",
  });

  const fineValue = data.col2Row3;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
    });
  };

  const handleShare = async () => {
    const arrowElement = document.getElementById("arrow");
    const shareButtonElement = document.getElementById("shareButton");
    if (arrowElement) arrowElement.style.display = "none";
    if (shareButtonElement) shareButtonElement.style.display = "none";
    const element = document.getElementById("FeeVoucher");
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/jpeg", 0.7);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    const pdfBlob = pdf.output("blob");

    // Create a Blob URL
    const blobURL = URL.createObjectURL(pdfBlob);

    // Check if the Web Share API is supported
    if (
      navigator.canShare &&
      navigator.canShare({
        files: [
          new File([pdfBlob], "FeeVoucher.pdf", { type: "application/pdf" }),
        ],
      })
    ) {
      try {
        await navigator.share({
          files: [
            new File([pdfBlob], "FeeVoucher.pdf", { type: "application/pdf" }),
          ],
          title: "Fee Voucher",
          text: "Please find the attached fee voucher PDF.",
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: Open WhatsApp with the Blob URL
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        blobURL
      )}`;
      window.open(whatsappUrl, "_blank");
    }
    // Restore the visibility of the hidden elements
    if (arrowElement) arrowElement.style.display = "";
    if (shareButtonElement) shareButtonElement.style.display = "";
  };

  const {
    data: singleStudent,
    error: studentError,
    isLoading: studentIsLoading,
    refetch: refetchStudent,
  } = useGetQuery({
    path: `/admin/student/${id}`,
  });

  const activeBatch = singleStudent?.data?.batches?.find(
    (batch) => batch.is_active === true
  );

  const mappedSingleData = {
    studentName: singleStudent?.data?.first_name,
    fatherName: singleStudent?.data?.last_name,
    batchName: activeBatch?.name || "No active batch",
    fixedFee: singleStudent?.data?.fixed_fee,
    course: activeBatch?.course_name,
  };

  return (
    <div
      className="flex flex-col w-full bg-white rounded-md gap-y-6 font-poppins "
      id="FeeVoucher"
    >
      <div className="flex items-center justify-between p-4 cursor-pointer ">
        <img src={CodeLabLogo} alt="CodelabLogo" className="w-28" />
        <BackArrow onClick={() => setFeeTab(false)} id="arrow" />
      </div>
      <div className="flex flex-col items-center justify-center gap-12">
        <div className="text-3xl font-semibold tracking-tight text-center underline font-poppins ">
          <h1>Fees Voucher</h1>
        </div>
        <div className="flex  flex-wrap w-[80%] mx-auto gap-10 items-center justify-center">
          <div className="flex justify-center ">
            <h1 className="w-48 text-2xl font-medium">Student Name :</h1>
            <p className="w-56 text-center capitalize border-b-2 ">
              {mappedSingleData.studentName}
            </p>
          </div>
          <div className="flex justify-center">
            <h1 className="w-48 text-2xl font-medium">Father Name :</h1>
            <p className="w-56 text-center capitalize border-b-2 ">
              {mappedSingleData.fatherName}
            </p>
          </div>
          <div className="flex justify-center">
            <h1 className="w-48 text-2xl font-medium">Course :</h1>
            <p className="w-56 text-center capitalize border-b-2 ">
              {mappedSingleData.course}
            </p>
          </div>
          <div className="flex justify-center">
            <h1 className="w-48 text-2xl font-medium"> Batch Name :</h1>
            <p className="w-56 text-center capitalize border-b-2 ">
              {mappedSingleData.batchName}
            </p>
          </div>
        </div>
        <table className="w-[80%]  border border-black">
          <thead>
            <tr>
              <th className="p-4 border border-black w-80">Details</th>
              <th className="border border-black w-">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-4 border border-black">Current Month Fee</td>
              <td className="border border-black">
                <p className="text-center"> {mappedSingleData.fixedFee}</p>
                {/* <input
                  type="text"
                  name="col2Row2"
                  value={data.col2Row2}
                  onChange={handleChange}
                  className="w-full p-3 text-center focus:outline-none"
                /> */}
              </td>
            </tr>
            <tr>
              <td className="p-4 border border-black">Others</td>
              <td className="border border-black">
                <input
                  type="number"
                  name="col2Row3"
                  value={data.col2Row3}
                  onChange={handleChange}
                  className="w-full p-3 text-center focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="p-4 border border-black">Total</td>
              <td className="border border-black">
                <p className="text-center">
                  {Number(mappedSingleData.fixedFee) + Number(data.col2Row3)}
                </p>
                {/* <input
                  type="text"
                  name="col2Row4"
                  value={data.col2Row4}
                  onChange={handleChange}
                  className="w-full p-3 text-center focus:outline-none"
                /> */}
              </td>
            </tr>
            <tr>
              <td className="p-4 border border-black">Note</td>
              <td className="border border-black">
                <input
                  type="text"
                  name="col2Row5"
                  value={data.col2Row5}
                  onChange={handleChange}
                  className="w-full p-3 text-center focus:outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="flex gap-3 font-poppins mx-auto w-[80%]">
          <label className="text-2xl"> Date :</label>
          <input
            type="date"
            className="w-56 border-b-2 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="w-40 mx-auto font-poppins " id="shareButton">
          <button
            className="w-full p-3 mb-3 font-bold text-white custom-Delete rounded-xl hover:bg-red-600 "
            onClick={handleShare}
          >
            Share
          </button>
        </div>
      </div>
      <div className="flex flex-col justify-center mx-auto text-center item-center gap-y-10 mb-7">
        <p className="w-[83%] mx-auto">
          In addition to paying in person, you can also transfer your fees
          online using the following methods:
        </p>
        <div className="flex items-center justify-center gap-x-10 ">
          <img src={easyPaisa} alt="easypaisa" />
          <img src={JazzCash} alt="Jazzcash" />
          <img src={HBL} alt="HBL" />
        </div>
      </div>
    </div>
  );
};

export default FeeVoucherComponent;
