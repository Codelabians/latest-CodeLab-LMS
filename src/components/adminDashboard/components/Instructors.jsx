import React from "react";
import profileImage from "../../../assets/images/adminDashboard/profile.png";

const Instructors = ({ dashboardData }) => {
  const instructorsData = [
    {
      id: 1,
      name: "John Doe",
      profileImageSrc: "path/to/profile1.jpg",
      batch_count: 4,
    },
    {
      id: 2,
      name: "Jane Smith",
      profileImageSrc: "path/to/profile2.jpg",
      batch_count: 3,
    },
    {
      id: 3,
      name: "Mike Johnson",
      profileImageSrc: "path/to/profile3.jpg",
      batch_count: 5,
    },
    {
      id: 4,
      name: "Emily Brown",
      profileImageSrc: "path/to/profile4.jpg",
      batch_count: 2,
    },
  ];

  return (
    <div className="w-full py-5 px-5 bg-white rounded-[15px] max-h-[25rem] overflow-y-auto custom-scrollbar shadow-lg ">
      <div className="flex flex-col">
        <div className="text-2xl font-semibold text-heading font-poppins text-nowrap">
          Tech Trainers
        </div>
        <div className="text-nowrap">
          ({dashboardData?.length} Tech Trainers)
        </div>
      </div>
      {dashboardData?.map((instructor) => (
        <div
          key={instructor?.id}
          className="flex items-center justify-between mt-8"
        >
          <div className="flex items-center">
            <div className="w-12 rounded-[100vw] overflow-hidden">
              <img
                className="object-cover w-full h-full"
                src={
                  instructor?.avatar
                    ? instructor?.avatar?.file_url
                    : profileImage
                }
                alt="profile"
              />
            </div>
            <div className="text-[18px] font-normal leading-6 ml-4 font-nunito">
              {instructor?.name}
            </div>
          </div>
          <div className="text-[15px] ml-4 font-light font-nunito">
            {instructor?.batch_count} Lectures Today
          </div>
        </div>
      ))}
    </div>
  );
};

export default Instructors;
