/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import {
  STUDENTS,
  INSTRUCTORS,
  PROJECTS,
  BATCHES,
  EMPLOYEE,
} from "../../components/routes/RouteConstants";

const DashboardCard = ({ image, title, stats, section }) => {
  const navigate = useNavigate();

  const handleNavigate = (statLabel) => {
    let queryParams = [];

    if (title.includes("who paid Fees")) {
      switch (statLabel) {
        case "Daily":
          queryParams.push(`daily_paid_fee=daily`);
          break;
        case "Weekly":
          queryParams.push(`weekly_paid_fee=weekly`);
          break;
        case "Monthly":
          queryParams.push(`monthly_paid_fee=monthly`);
          break;
        default:
          break;
      }
    } else if (title.includes("who don't paid Fees")) {
      switch (statLabel) {
        case "Daily":
          queryParams.push(`daily_pending_fee=daily`);
          break;
        case "Weekly":
          queryParams.push(`weekly_pending_fee=weekly`);
          break;
        case "Monthly":
          queryParams.push(`monthly_pending_fee=monthly`);
          break;
        default:
          break;
      }
    } else if (title === "Fees") {
      switch (statLabel) {
        case "Daily":
          queryParams.push(`daily_fee=daily`);
          break;
        case "Weekly":
          queryParams.push(`weekly_fee=weekly`);
          break;
        case "Monthly":
          queryParams.push(`monthly_fee=monthly`);
          break;
        default:
          break;
      }
    } else if (title.includes("who are hostelized")) {
      queryParams.push(`isHostalize=1`);
      if (statLabel === "Active") {
        queryParams.push(`active_status=1`);
      } else if (statLabel === "In-active") {
        queryParams.push(`active_status=0`);
      }
    } else if (title.includes("who are not Hostelized")) {
      queryParams.push(`isHostalize=0`);
      if (statLabel === "Active") {
        queryParams.push(`active_status=1`);
      } else if (statLabel === "In-active") {
        queryParams.push(`active_status=0`);
      }
    } else if (statLabel === "Active") {
      queryParams.push(`active_status=1`);
    } else if (statLabel === "In-active") {
      queryParams.push(`active_status=0`);
    }

    const path = getPathBySection(section);
    const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";
    navigate(`${path}${queryString}`);
  };

  const getPathBySection = (section) => {
    switch (section) {
      case "Students":
        return STUDENTS;
      case "Employee":
        return EMPLOYEE;
      case "Instructor":
        return INSTRUCTORS;
      case "Projects":
        return PROJECTS;
      case "Batches":
        return BATCHES;
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-[15px] flex flex-col w-full p-4 mb-4 shadow-sm">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start grow">
        <img src={image} alt="icon" className="object-contain w-16 h-16" />
        <div className="flex-1 w-full">
          <div className="text-base font-medium text-center sm:text-lg text-heading font-poppins sm:text-left">
            {title}
          </div>
          <div className="bg-lightGray h-[1px] my-3 w-full" />
          <div className="flex flex-wrap justify-between gap-4 text-sm font-light">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center flex-1 min-w-[80px]">
                <div
                  className="text-base font-medium text-center cursor-pointer"
                  onClick={() => handleNavigate(stat.label)}
                >
                  {stat.label}
                </div>
                <div className="text-center">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
