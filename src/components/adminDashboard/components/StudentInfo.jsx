/* eslint-disable react/prop-types */
import studentImage from "../../../assets/images/adminDashboard/student.png";
import DroupoutStudent from "../../../assets/images/adminDashboard/dropoutStudent.png";
import maleImage from "../../../assets/images/adminDashboard/male.png";
import femaleImage from "../../../assets/images/adminDashboard/female.png";
import militaryMale from '../../../assets/images/adminDashboard/military male.png';
import militaryFemale from '../../../assets/images/adminDashboard/military female.png';
import { useNavigate } from "react-router-dom";
import { STUDENTS } from "../../routes/RouteConstants";
import SummaryCard from "../../ui/SummaryCard";
import { Users, UsersRound } from "lucide-react";

const StudentInfo = ({ dashboardData }) => {
  const navigate = useNavigate();

  const handleNavigate = (type, status, gender) => {
    let queryParams = "";
    if (gender) {
      queryParams += `?gender=${gender}`;
    }
    if (status !== null) {
      // If queryParams already contains a '?', use '&' for the next parameter
      queryParams += queryParams
        ? `&active_status=${status}`
        : `?active_status=${status}`;
    }
    navigate(`${STUDENTS}${queryParams}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Students Card  */}
      <div className="w-full flex-col md:flex-row flex  items-center p-6 bg-white rounded-[15px] gap-4">
        <div>
          <img src={studentImage} alt="Example" className="w-10" />
        </div>
        <div>
          <div className="mb-3 text-xl font-normal leading-6">Students</div>
          <div className="flex flex-col gap-5 font-light md:flex-row text -sm">
            <div>
              <span
                className="font-medium cursor-pointer"
                onClick={() => handleNavigate("students", null)}
              >
                All:
              </span>{" "}
              {dashboardData?.students?.all_students ?? 0}
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span
                className="font-medium cursor-pointer "
                onClick={() => handleNavigate("students", 1)}
              >
                Active:
              </span>{" "}
              {dashboardData?.students?.current_students ?? 0}
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span
                className="font-medium cursor-pointer"
                onClick={() => handleNavigate("students", 0)}
              >
                In-active:
              </span>{" "}
              {dashboardData?.students?.inactive_students ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Male Card  */}
      <div className=" w-full flex flex-col md:flex-row items-center p-6 bg-white rounded-[15px]  gap-4">
        <div>
          <img src={maleImage} alt="Example" className="w-16" />
        </div>
        <div>
          <div className="mb-3 text-xl font-normal leading-6">Male</div>
          <div className="flex flex-col gap-5 text-sm font-light md:flex-row">
            <div>
              <span
                className="font-medium cursor-pointer"
                onClick={() => handleNavigate("all", null, "male")}
              >
                All:
              </span>{" "}
              {dashboardData?.students?.total_male_students ?? 0}
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span
                className="font-medium cursor-pointer"
                onClick={() => handleNavigate("students", 1, "male")}
              >
                Active:
              </span>{" "}
              {dashboardData?.students?.male_active_students ?? 0}
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span
                className="font-medium cursor-pointer"
                onClick={() => handleNavigate("students", 0, "male")}
              >
                In-active:
              </span>{" "}
              {dashboardData?.students?.male_inactive_students ?? 0}
            </div>
          </div>
        </div>
      </div>


      {/* Female Card  */}
      <div className="flex flex-col md:flex-row items-center p-6 bg-white rounded-[15px] w-full gap-4">
        <div>
          <img src={femaleImage} alt="Example" className="w-10"  />
        </div>
        <div>
          <div className="mb-3 text-xl font-normal leading-6">Female</div>
          <div className="flex flex-col gap-5 text-sm font-light md:flex-row">
            <div>
              <span
                className="font-medium cursor-pointer"
                onClick={() => handleNavigate("students", null, "female")}
              >
                All:
              </span>{" "}
              {dashboardData?.students?.total_female_students ?? 0}
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span
                className="font-medium cursor-pointer"
                onClick={() => handleNavigate("students", 1, "female")}
              >
                Active:
              </span>{" "}
              {dashboardData?.students?.female_active_students ?? 0}
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span
                className="font-medium cursor-pointer"
                onClick={() => handleNavigate("students", 0, "female")}
              >
                In-active:
              </span>{" "}
              {dashboardData?.students?.female_inactive_students ?? 0}
            </div>
          </div>
        </div>
      </div>

      
      {/* Military male */}
      <div className="flex flex-col md:flex-row items-center p-5 bg-white rounded-[15px]  w-full gap-4">
        <div>
          <img src={militaryMale} alt="Example"  className="w-10" />
        </div>
        <div className="text-center md:text-start">
          <div className="mb-1 text-lg font-medium leading-6">
            Military Male
          </div>
          <div className="flex flex-col justify-center gap-4 text-sm font-light md:flex-row">
            <div>
              <div className="block text-base font-medium cursor-pointer">
                Daily
              </div>
              <div>
                {dashboardData?.drop_outs?.weekly_dropout_count ?? 0} Students
              </div>
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <div className="text-base font-medium cursor-pointer">Weekly</div>
              <div>
                {dashboardData?.drop_outs?.monthly_dropout_count ?? 0} Students
              </div>
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span className="text-base font-medium cursor-pointer">
                Monthly
              </span>
              <div>
                {dashboardData?.drop_outs?.daily_dropout_count ?? 0} Students
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {/* Military Female Students */}
      <div className="flex flex-col md:flex-row items-center p-5 bg-white rounded-[15px]  w-full gap-4">
        <div>
          <img src={militaryFemale} alt="Example"  className="w-10" />
        </div>
        <div className="text-center md:text-start">
          <div className="mb-1 text-lg font-medium leading-6">
            Military Female 
          </div>
          <div className="flex flex-col gap-4 text-sm font-light md:flex-row">
            <div>
              <div className="block text-base font-medium cursor-pointer">
                Daily
              </div>
              <div>
                {dashboardData?.drop_outs?.weekly_dropout_count ?? 0} Students
              </div>
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <div className="text-base font-medium cursor-pointer">Weekly</div>
              <div>
                {dashboardData?.drop_outs?.monthly_dropout_count ?? 0} Students
              </div>
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span className="text-base font-medium cursor-pointer">
                Monthly
              </span>
              <div>
                {dashboardData?.drop_outs?.daily_dropout_count ?? 0} Students
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {/* Dropout Students */}
      <div className="flex flex-col md:flex-row items-center p-5 bg-white rounded-[15px]  w-full gap-4">
        <div>
          <img src={DroupoutStudent} alt="Example"  className="w-10" />
        </div>
        <div className="text-center md:text-start">
          <div className="mb-1 text-lg font-medium leading-6">
            Dropout Students
          </div>
          <div className="flex flex-col gap-4 text-sm font-light md:flex-row">
            <div>
              <div className="block text-base font-medium cursor-pointer">
                Daily
              </div>
              <div>
                {dashboardData?.drop_outs?.weekly_dropout_count ?? 0} Students
              </div>
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <div className="text-base font-medium cursor-pointer">Weekly</div>
              <div>
                {dashboardData?.drop_outs?.monthly_dropout_count ?? 0} Students
              </div>
            </div>
            <div className="bg-lightGray w-[0.5px]"></div>
            <div>
              <span className="text-base font-medium cursor-pointer">
                Monthly
              </span>
              <div>
                {dashboardData?.drop_outs?.daily_dropout_count ?? 0} Students
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInfo;
