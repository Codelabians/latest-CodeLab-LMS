import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import FormInput from "../../ui/FormInput";
import Loader from "../../ui/common/LoaderComponent";

const AddMembers = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cnic: "",
    contact_number: "",
    company_id: "",
  });

  const {
    data: companiesData,
    error: companiesError,
    isLoading: companiesIsLoading,
  } = useGetQuery({
    path: "/admin/clients?is_company=1",
  });

  const [createEmployee, { isLoading: isCreating }] = usePostMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      company_id: Number(formData.company_id),
      name: formData.name,
      cnic: formData.cnic,
      email: formData.email,
      contact_number: formData.contact_number,
    };

    try {
      await createEmployee({
        path: "/admin/clients/members",
        body: payload,
      }).unwrap();

      toast.success("Employee created successfully!");
      handleReset();
      navigate(-1);
    } catch (err) {
      console.error("Employee creation failed:", err);
      const msg = err?.data?.message || "Failed to create employee";
      toast.error(`Error: ${msg}`);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      cnic: "",
      contact_number: "",
      company_id: "",
    });
  };

  // Transform companies data for dropdown options
  const companyOptions =
    companiesData?.data?.map((company) => ({
      value: company.id,
      label: company.company_name || company.name,
    })) || [];

  if (companiesIsLoading) return <Loader />;

  if (companiesError) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-500 font-medium">Error loading companies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="w-11/12 mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="float-right">
            <X
              onClick={() => navigate(-1)}
              className="w-6 h-6 text-gray-500 hover:text-gray-700 cursor-pointer"
            />
          </div>

          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[#014376] to-[#31918D] bg-clip-text text-transparent">
            Add New Employee
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Employee Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter employee name"
                required
              />

              <FormInput
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />

              <FormInput
                label="CNIC"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                placeholder="Enter CNIC number"
                required
              />

              <FormInput
                label="Contact Number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                placeholder="Enter contact number"
                required
              />

              <FormInput
                type="select"
                label="Company"
                name="company_id"
                value={formData.company_id}
                onChange={handleInputChange}
                options={companyOptions}
                placeholder="Select company"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isCreating
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-[#014376] to-[#31918D] text-white hover:from-[#31918D] hover:to-[#014376]"
                }`}
              >
                {isCreating ? "Creating..." : "Create Employee"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMembers;
