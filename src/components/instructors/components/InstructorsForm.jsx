import { useState } from "react";
import FormInput from "../../ui/FormInput";

export default function InstructorForm() {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    experience: "",
    cnic: "",
    phone: "",
    qualification: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    gender: "",
    city: "",
    designation: "",
    basicSalary: "",
    note: "",
    isHostelite: false,
    isIntern: false,
    maritalStatus: "",
    dateOfBirth: "",
    facilities: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    alert("Form submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d61111] to-[#d61111] py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-[#d61111] to-[#d61111] bg-clip-text text-transparent">
          Instructor Registration
        </h1>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormInput
              label="First Name"
              name="firstName"
              value={data.firstName}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Last Name"
              name="lastName"
              value={data.lastName}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={data.email}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Phone"
              name="phone"
              type="tel"
              value={data.phone}
              onChange={handleChange}
              required
            />
            <FormInput
              label="CNIC"
              name="cnic"
              value={data.cnic}
              onChange={handleChange}
              placeholder="xxxxx-xxxxxxx-x"
              required
            />
            <FormInput
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={data.dateOfBirth}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Gender"
              name="gender"
              type="select"
              value={data.gender}
              onChange={handleChange}
              options={["Male", "Female", "Other"]}
              required
            />
            <FormInput
              label="Marital Status"
              name="maritalStatus"
              type="select"
              value={data.maritalStatus}
              onChange={handleChange}
              options={["Single", "Married", "Divorced", "Widowed"]}
              required
            />
            <FormInput
              label="City"
              name="city"
              value={data.city}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Qualification"
              name="qualification"
              value={data.qualification}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Experience (years)"
              name="experience"
              type="number"
              value={data.experience}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Designation"
              name="designation"
              value={data.designation}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Basic Salary"
              name="basicSalary"
              type="number"
              value={data.basicSalary}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Facilities"
              name="facilities"
              type="select"
              value={data.facilities}
              onChange={handleChange}
              options={[
                "Medical",
                "Transport",
                "Housing",
                "Medical + Transport",
                "All Facilities",
              ]}
            />
            <FormInput
              label="Guardian Name"
              name="guardianName"
              value={data.guardianName}
              onChange={handleChange}
            />
            <FormInput
              label="Guardian Phone"
              name="guardianPhone"
              type="tel"
              value={data.guardianPhone}
              onChange={handleChange}
            />
          </div>

          <FormInput
            label="Address"
            name="address"
            type="textarea"
            value={data.address}
            onChange={handleChange}
            rows={3}
            required
          />
          <FormInput
            label="Note"
            name="note"
            type="textarea"
            value={data.note}
            onChange={handleChange}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4 mb-5">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isHostelite"
                checked={data.isHostelite}
                onChange={handleChange}
                className="w-5 h-5 accent-[#aa0e0e]"
              />
              <span className="text-sm font-semibold text-gray-700">
                Is Hostelite
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isIntern"
                checked={data.isIntern}
                onChange={handleChange}
                className="w-5 h-5 accent-[#aa0e0e]"
              />
              <span className="text-sm font-semibold text-gray-700">
                Is Intern
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormInput
              label="Profile Image"
              name="profileImage"
              type="file"
              accept="image/*"
              onChange={handleChange}
            />
            <FormInput
              label="CNIC Upload"
              name="cnicUpload"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleChange}
            />
            <FormInput
              label="Contract PDF"
              name="contractPdf"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
            />
            <FormInput
              label="Resume"
              name="resumeUpload"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
            />
            <FormInput
              label="Education PDF"
              name="educationPdf"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
            />
            <FormInput
              label="Experience PDF"
              name="experiencePdf"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
            />
            <FormInput
              label="Security Clearance PDF"
              name="securityClearancePdf"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full mt-6 py-4 bg-gradient-to-r from-[#d61111] to-[#d61111] text-white font-bold rounded-lg hover:from-[#aa0e0e] hover:to-[#aa0e0e] transition-all duration-300 shadow-lg"
          >
            Submit Registration
          </button>
        </div>
      </div>
    </div>
  );
}
