import * as Yup from "yup";
export const signUPValidation = Yup.object({
  firstName: Yup.string().required("First Name is required"),
  lastName: Yup.string().required("Last Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  cnic: Yup.string().required("CNIC is required"),
  phoneNo: Yup.string().required("Phone No is required"),
  qualification: Yup.string().required("Qualification is required"),
  currentInstitute: Yup.string().required("Current Institute is required"),
  guardianName: Yup.string().required("Guardian Name is required"),
  guardianPhoneNo: Yup.string().required("Guardian Phone No is required"),
  address: Yup.string().required("Address is required"),
  gender: Yup.string().required("Gender is required"),
  dateOfBirth: Yup.date().required("Date of Birth is required"),
  // image: Yup.mixed().required("Profile Image is required"),
  city: Yup.string().required("City is required"),
});
