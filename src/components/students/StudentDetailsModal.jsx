import React from "react";
import { useGetQuery } from "../../api/apiSlice";

const StudentDetailsModal = ({ setIsOpen, isOpen, selectedID }) => {
  // const {
  //   data,
  //   error: studentError,
  //   isLoading: studentIsLoading,
  //   refetch: refetchStudent,
  // } = useGetQuery({
  //   path: `/admin/student/${selectedID}`,
  // });

  const {
    data,
    error: studentError,
    isLoading: studentIsLoading,
    refetch: refetchStudent,
  } = useGetQuery(
    selectedID
      ? {
          path: `/admin/student/${selectedID}`,
        }
      : null,
    {
      skip: !selectedID,
    }
  );

  const studentData = data?.data;

  const details = [
    {
      label: "Name",
      value: studentData?.first_name + " " + studentData?.last_name,
    },
    { label: "Father Name", value: studentData?.father_name },
    { label: "E-mail", value: studentData?.email },
    { label: "Fees Date", value: studentData?.fixed_fee_date },
    { label: "Batch Name", value: studentData?.batch_name },
    { label: "Instructor Name", value: studentData?.teacher_name },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className="bg-white p-6 w-[700px] h-[500px] rounded-md shadow-lg"
            onMouseOver={() => {
              setIsOpen(true);
            }}
            onMouseOut={() => {
              setIsOpen(false);
            }}
            onClick={() => setIsOpen(true)}
          >
            <div className="text-center h-full">
              <h1 className="text-2xl font-semibold tracking-wide mb-8">
                About {studentData?.first_name} {studentData?.last_name}
              </h1>
              <div className="flex justify-evenly items-start">
                <img
                  src="https://images.pexels.com/photos/1759530/pexels-photo-1759530.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt={`${studentData?.first_name} ${studentData?.last_name}`}
                  className="rounded h-56 w-56 object-cover mb-4"
                />
                <div className="space-y-5">
                  {details.map((detail, index) => (
                    <p
                      key={index}
                      className="flex flex-row justify-between gap-28"
                    >
                      <span className="font-semibold">{detail.label}</span>
                      <span className="">{detail.value}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDetailsModal;
