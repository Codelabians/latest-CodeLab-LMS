import * as Yup from "yup";
export const signUPValidation = Yup.object().shape({
  firstName: Yup.string()
    .min(3, "First Name must be at least 3 characters")
    .required("First Name is required"),
  lastName: Yup.string()
    .min(3, "First Name must be at least 3 characters")
    .required("Last Name is required"),
  email: Yup.string()
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email address"
    )
    .email("Invalid email address")
    .required("Email is required"),
  experience: Yup.string().required("Experience is required"),
  cnic: Yup.string()
    .min(13, "Cnic must be at least 13 characters")
    .required("CNIC is required"),
  // phoneNo: Yup.string().required("Phone No is required"),
  phoneNo: Yup.string()
    .matches(/^03/, "Enter a valid phone number (03)")
    .min(11, "Phone no must be at least 11 characters")
    .required("Phone No is required"),
  qualification: Yup.string().required("Qualification is required"),
  // currentInstitute: Yup.string().required("Current Institute is required"),
  guardianName: Yup.string()
    .min(3, "First Name must be at least 3 characters")
    .required("Guardian Name is required"),
  guardianPhoneNo: Yup.string()
    .matches(/^03/, "Enter a valid phone number (03)")
    .min(11, "Phone no must be at least 11 characters")
    .required("Guardian Phone No is required"),
  address: Yup.string().required("Address is required"),
  gender: Yup.string().required("Gender is required"),
  dateOfBirth: Yup.date().required("Date of Birth is required"),
  city: Yup.string().required("City is required"),
  bio: Yup.string().required("Note is required"),
  marital_status: Yup.string().required("Marital Status is required"),
  designation: Yup.string().required("Designation is required"),
  basic_salary: Yup.string().required("Basic Salary is required"),
  facilities: Yup.string().required("Facilities is required"),
  // joinningDate: Yup.string().required("Joinning Date is required"),
  user_image: Yup.mixed().required("Profile Image is required"),
  cnic_doc: Yup.mixed().required("Cnic Image is required"),
  contract: Yup.mixed().required("Contract PDF is required"),
  resume: Yup.mixed().required("Resume PDF is required"),
});
