import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useGetQuery,
  usePostMutation,
  usePutMutation,
} from "../../../api/apiSlice";
import Loader from "../../ui/common/LoaderComponent";
import FormInput from "../../ui/FormInput";

const CompanyWorkSpaceForm = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const isEditMode = !!uuid;

  const [formData, setFormData] = useState({
    company_name: "",
    ceo_name: "",
    phone: "",
    email: "",
    cnic: "",
    address: "",
    category_id: "",
    type_id: "",
    workspace_id: "",
    rooms_taken: "",
    seats_taken: "",
    security_payment: "",
    count: "1",
    contractStartDate: "",
    contractEndDate: "",
    cnic_front_image: null,
    cnic_back_image: null,
    contract_image: null,
    pcc: null,
    pccExpiry: "",
  });

  // Fetch workspace categories
  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesIsLoading,
  } = useGetQuery({ path: "/admin/workspace-categories" });

  // Fetch workspace types based on selected category
  const {
    data: typesData,
    error: typesError,
    isLoading: typesIsLoading,
  } = useGetQuery({
    path: `/admin/workspace-types?category_id=${formData.category_id}`,
    skip: !formData.category_id,
  });

  // Fetch available workspaces based on selected type
  const {
    data: availableWorkspaces,
    error: workspacesError,
    isLoading: workspacesIsLoading,
  } = useGetQuery({
    path: `/admin/workspaces/get/available?type_id=${formData.type_id}`,
    skip: !formData.type_id,
  });

  const { data: bookingData, isLoading: bookingIsLoading } = useGetQuery({
    path: `/admin/company-bookings/get-booking/${uuid}`,
    skip: !isEditMode,
  });

  const [createBooking, { isLoading: isCreating }] = usePostMutation();
  const [updateBooking, { isLoading: isUpdating }] = usePutMutation();

  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (isEditMode && bookingData) {
      const booking = bookingData.data || bookingData;

      setFormData({
        company_name: booking.company_name || "",
        ceo_name: booking.ceo_name || "",
        phone: booking.contact_number || booking.phone || "",
        email: booking.email || "",
        cnic: booking.cnic || "",
        address: booking.address || "",
        category_id: booking.workspace?.type?.category?.id || "",
        type_id: booking.workspace?.type?.id || "",
        workspace_id: booking.workspace?.id || booking.workspace_id || "",
        rooms_taken: booking.rooms_taken || "",
        seats_taken: booking.seats_taken || "",
        count: booking.count || "1",
        contractStartDate:
          booking.start_date || booking.contractStartDate || "",
        contractEndDate: booking.end_date || booking.contractEndDate || "",
        pccExpiry:
          booking.police_verification_expiry || booking.pccExpiry || "",
        cnic_front_image: null,
        cnic_back_image: null,
        contract_image: null,
        security_payment: booking.security_payment,
        pcc: null,
      });
    }
  }, [isEditMode, bookingData]);

  const selectedWorkspace = availableWorkspaces?.data?.find(
    (ws) => ws.id === Number(formData.workspace_id)
  );

  const workspaceTypeName = selectedWorkspace?.type?.name?.toLowerCase() || "";
  const workspaceDesc = selectedWorkspace?.description?.toLowerCase() || "";

  const showRoomsInput =
    workspaceTypeName.includes("room") || workspaceDesc.includes("room");

  const showSeatsInput =
    workspaceTypeName.includes("seat") || workspaceDesc.includes("seat");

  const showCountInput =
    workspaceTypeName.includes("individual") ||
    workspaceDesc.includes("individual");

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // Reset dependent fields when parent dropdown changes
    if (name === "category_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
        type_id: "",
        workspace_id: "",
      }));
    } else if (name === "type_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
        workspace_id: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.workspace_id) {
      toast.error("Please select a workspace");
      return;
    }

    const form = new FormData();

    form.append("workspace_id", formData.workspace_id);

    form.append("company_name", formData.company_name);
    form.append("name", formData.ceo_name);
    form.append("email", formData.email);
    form.append("cnic", formData.cnic);
    form.append("contact_number", formData.phone);
    form.append("address", formData.address);
    form.append("rooms_taken", formData.rooms_taken || "0");
    form.append("seats_taken", formData.seats_taken || "0");
    form.append("quantity", formData.count || "1");
    form.append("start_date", formData.contractStartDate);
    form.append("end_date", formData.contractEndDate);
    form.append("police_verification_expiry", formData.pccExpiry);
    form.append("security_payment", formData.security_payment);
    form.append("is_company", "1");

    // files
    if (formData.cnic_front_image)
      form.append("cnic_front_image", formData.cnic_front_image);
    if (formData.cnic_back_image)
      form.append("cnic_back_image", formData.cnic_back_image);
    if (formData.contract_image)
      form.append("contract_image", formData.contract_image);
    if (formData.pcc)
      form.append("police_verification_certificate", formData.pcc);

    try {
      if (isEditMode) {
        await updateBooking({
          path: `/admin/company-bookings/get/${uuid}`,
          body: form,
        }).unwrap();
        toast.success("Company booking updated successfully!");
      } else {
        await createBooking({
          path: "admin/clients",
          body: form,
        }).unwrap();
        toast.success("Company booking created successfully!");
      }

      handleReset();
      navigate(-1);
    } catch (err) {
      console.error("Booking failed:", err);
      const msg =
        err?.data?.message ||
        `Failed to ${isEditMode ? "update" : "create"} company booking`;
      toast.error(`Error: ${msg}`);
    }
  };

  const handleReset = () => {
    setFormData({
      company_name: "",
      ceo_name: "",
      phone: "",
      email: "",
      cnic: "",
      address: "",
      category_id: "",
      type_id: "",
      workspace_id: "",
      rooms_taken: "",
      seats_taken: "",
      count: "1",
      contractStartDate: "",
      contractEndDate: "",
      cnic_front_image: null,
      cnic_back_image: null,
      contract_image: null,
      pcc: null,
      pccExpiry: "",
    });
  };

  // Prepare category options
  const categoryOptions =
    categoriesData?.data?.map((cat) => ({
      value: cat.id.toString(),
      label: cat.name,
    })) || [];

  // Prepare type options
  const typeOptions =
    typesData?.data?.map((type) => ({
      value: type.id.toString(),
      label: `${type.name} (${type.workspaces_count} available)`,
    })) || [];

  // Prepare workspace options
  const workspaceOptions =
    availableWorkspaces?.data?.map((ws) => ({
      value: ws.id.toString(),
      label: `${ws.type?.name} - Rs. ${parseFloat(ws.price).toFixed(2)}${
        ws.description ? ` (${ws.description})` : ""
      }`,
    })) || [];

  if (categoriesIsLoading || (isEditMode && bookingIsLoading))
    return <Loader />;

  if (categoriesError) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-500 font-medium">
            Error loading workspace categories. Please try again later.
          </p>
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
              className="w-6 h-6 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
            />
          </div>

          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] bg-clip-text text-transparent">
            {isEditMode ? "Edit Company Registration" : "Company Registration"}
          </h1>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="Enter company name"
                required
              />
              <FormInput
                label="CEO Name"
                name="ceo_name"
                value={formData.ceo_name}
                onChange={handleInputChange}
                placeholder="Enter CEO name"
                required
              />
              <FormInput
                label="Phone no."
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter Phone No."
                required
              />
              <FormInput
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter Email"
                required
              />
              <FormInput
                label="CNIC"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                placeholder="Enter CNIC"
                required
              />
              <FormInput
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter full address"
                required
              />
            </div>

            {/* Workspace Selection Section */}
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-semibold mb-4                  text-gray-700">
                Workspace Selection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormInput
                  type="select"
                  label="Workspace Category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  options={categoryOptions}
                  placeholder="Select category"
                  required
                />

                <FormInput
                  type="select"
                  label="Workspace Type"
                  name="type_id"
                  value={formData.type_id}
                  onChange={handleInputChange}
                  options={typeOptions}
                  placeholder={
                    formData.category_id
                      ? "Select type"
                      : "Select category first"
                  }
                  disabled={!formData.category_id || typesIsLoading}
                  required
                />

                <FormInput
                  type="select"
                  label="Available Workspace"
                  name="workspace_id"
                  value={formData.workspace_id}
                  onChange={handleInputChange}
                  options={workspaceOptions}
                  placeholder={
                    formData.type_id ? "Select workspace" : "Select type first"
                  }
                  disabled={!formData.type_id || workspacesIsLoading}
                  required
                />
              </div>
            </div>

            {showCountInput && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  type="number"
                  label="Count (Number of Seats)"
                  name="count"
                  value={formData.count}
                  onChange={handleInputChange}
                  placeholder="Enter count"
                  min="1"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showRoomsInput && (
                <FormInput
                  type="number"
                  label="Rooms Taken"
                  name="rooms_taken"
                  value={formData.rooms_taken}
                  onChange={handleInputChange}
                  placeholder="e.g. 1"
                  min="0"
                />
              )}
              {showSeatsInput && !showCountInput && (
                <FormInput
                  type="number"
                  label="Seats Taken"
                  name="seats_taken"
                  value={formData.seats_taken}
                  onChange={handleInputChange}
                  placeholder="e.g. 5"
                  min="0"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                type="date"
                label="Contract Start Date"
                name="contractStartDate"
                value={formData.contractStartDate}
                onChange={handleInputChange}
                required
              />
              <FormInput
                type="date"
                label="Contract End Date"
                name="contractEndDate"
                value={formData.contractEndDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                type="file"
                label="CNIC Front Image"
                name="cnic_front_image"
                onChange={handleInputChange}
                accept="image/jpeg,image/png,application/pdf"
                required={!isEditMode}
              />
              <FormInput
                type="file"
                label="CNIC Back Image"
                name="cnic_back_image"
                onChange={handleInputChange}
                accept="image/jpeg,image/png,application/pdf"
                required={!isEditMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                type="file"
                label="Contract Document"
                name="contract_image"
                onChange={handleInputChange}
                accept="image/jpeg,image/png,application/pdf"
                required={!isEditMode}
              />
              <FormInput
                type="file"
                label="Police Clearance Certificate (PCC)"
                name="pcc"
                onChange={handleInputChange}
                accept="image/jpeg,image/png,application/pdf"
                required={!isEditMode}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                type="date"
                label="PCC Expiry Date"
                name="pccExpiry"
                value={formData.pccExpiry}
                onChange={handleInputChange}
                required
              />
              <FormInput
                label="Security Payment"
                name="security_payment"
                value={formData.security_payment}
                onChange={handleInputChange}
                placeholder="Enter secourty payment"
                required
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isSubmitting
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] text-white hover:from-[#d61111] hover:to-[#d61111]"
                }`}
              >
                {isSubmitting
                  ? "Submitting..."
                  : isEditMode
                  ? "Update Registration"
                  : "Submit Registration"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300"
              >
                Reset Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyWorkSpaceForm;
