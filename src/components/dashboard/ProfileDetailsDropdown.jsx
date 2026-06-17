import React, { useEffect, useState, useRef } from "react";
import profileImage from "../../assets/images/adminDashboard/profile.png";
import { Link, useNavigate } from "react-router-dom";
import { ADMINDASHBOARD, PROFILE, SIGNIN } from "../routes/RouteConstants";
import { clearCredentials } from "../../features/auth/authSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../ui/common/ShowToast";
import { usePostMutation } from "../../api/apiSlice";

const ProfileDetailsDropdown = ({}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useSelector((state) => state?.auth);

  const dropdownRef = useRef(null); // Ref to track the dropdown element
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutMutation, { isLoading: isLoggingOut }] = usePostMutation();

  // Real logout: revoke the Sanctum token on the server, then clear local
  // state. If the API call fails (offline, token already invalid) we still
  // clear locally so the user is signed out on the client.
  const handleLogout = async (e) => {
    e?.preventDefault?.();
    try {
      await logoutMutation({
        path: "/admin/authentication/logout",
        body: {},
      }).unwrap();
    } catch (_err) {
      /* still log out locally */
    } finally {
      dispatch(clearCredentials());
      localStorage.removeItem("token");
      localStorage.removeItem("rememberMe");
      setShowDropdown(false);
      showToast("Signed out successfully", "success");
      navigate(SIGNIN, { replace: true });
    }
  };

  const handleClick = () => {
    setShowDropdown(!showDropdown);
  };

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    // Add event listener for clicks
    document.addEventListener("mousedown", handleOutsideClick);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Prefer the avatar on the live Redux user (updates instantly when the
  // profile photo changes), then the cached localStorage value, then default.
  const adminProfileImage =
    user?.avatar?.file_url || localStorage.getItem("adminProfileImage");

  const role = user?.role;
  // Anyone past the admin-login gate belongs on the admin dashboard.
  // Backend blocks `user` and `teacher` at login — mirror that here.
  const hasAdminAccess = !!role && !["user", "teacher"].includes(role);
  return (
    <div ref={dropdownRef}>
      {" "}
      {/* Wrap the component in a ref */}
      <button
        data-dropdown-toggle="dropdownAvatarName"
        className="flex items-center text-sm font-medium text-gray-900 rounded-full pe-1 hover:text-brown btn-focus-gradient font"
        type="button"
        onClick={handleClick}
      >
        <img
          className="object-fill w-8 h-8 rounded-full me-2"
          src={adminProfileImage ? adminProfileImage : profileImage}
          alt="Admin photo"
        />
        {`${user?.first_name}`}
        <svg
          className="w-2.5 h-2.5 ms-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 10 6"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>
      {showDropdown && (
        <div
          id="dropdownAvatar"
          className="absolute z-10 w-32 mt-1 font-medium bg-white divide-y divide-gray-100 rounded-lg shadow right-1 top-16 dark:divide-gray-600 dark:bg-gray-700"
        >
          <ul
            className="py-0 text-sm text-grayCheckbox font-poppins"
            aria-labelledby="dropdownUserAvatarButton"
          >
            {hasAdminAccess && (
              <li>
                <Link
                  to={ADMINDASHBOARD}
                  onClick={handleClick}
                  className="block px-4 py-2 rounded-t-lg hover:bg-brown hover:text-white"
                >
                  Dashboard
                </Link>
              </li>
            )}

            <li>
              <Link
                to={PROFILE}
                className="block px-4 py-2 hover:bg-brown hover:text-white"
                onClick={handleClick}
              >
                Profile
              </Link>
            </li>
          </ul>
          <div className="py-2 rounded-b-lg hover:bg-brown">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="block w-full px-4 py-1 text-sm text-left text-gray-700 bg-transparent border-0 cursor-pointer hover:text-white text-grayCheckbox disabled:opacity-60"
            >
              {isLoggingOut ? "Signing out…" : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDetailsDropdown;
