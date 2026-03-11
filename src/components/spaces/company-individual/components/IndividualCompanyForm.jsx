import React, { useState, useEffect } from "react";
import {
  useGetQuery,
  usePostMutation,
  usePutMutation,
} from "../../../../api/apiSlice";
import Loader from "../../../ui/common/LoaderComponent";
import FormInput from "../../../ui/FormInput";
import { X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const IndividualCompanyForm = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const isEditMode = !!uuid;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cnic: "",
    address: "",
    workspace: "",
    rooms_taken: "",
    seats_taken: "",
    dateOfTendency: "",
    periodOfTendency: "",
    contractStartDate: "",
    contractEndDate: "",
    rentPaid: "",
    cnic_front_image: null,
    cnic_back_image: null,
    contract_image: null,
    pcc: null,
    pccExpiry: "",
    detail: "",
    isAffiliatedWithCompany: "no",
    company_uuid: "",
  });

  const {
    data: workspacesData,
    error: workspacesError,
    isLoading: workspacesIsLoading,
  } = useGetQuery({
    path: "/admin/workspaces",
  });

  const { data: companiesData, isLoading: companiesIsLoading } = useGetQuery({
    path: "admin/company-bookings",
  });

  const { data: bookingData, isLoading: bookingIsLoading } = useGetQuery({
    path: `/admin/individual-bookings/get/${uuid}`,
    skip: !isEditMode,
  });

  const [createBooking, { isLoading: isCreating }] = usePostMutation();
  const [updateBooking, { isLoading: isUpdating }] = usePutMutation();

  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (isEditMode && bookingData) {
      const booking = bookingData.data || bookingData;

      setFormData({
        name: booking.name || "",
        phone: booking.contact_number || booking.phone || "",
        email: booking.email || "",
        cnic: booking.cnic || "",
        address: booking.address || "",
        workspace: booking.workspace_uuid || booking.workspace || "",
        rooms_taken: booking.rooms_taken || "",
        seats_taken: booking.seats_taken || "",
        dateOfTendency:
          booking.date_of_tendency || booking.dateOfTendency || "",
        periodOfTendency:
          booking.period_of_tendency || booking.periodOfTendency || "",
        contractStartDate:
          booking.start_date || booking.contractStartDate || "",
        contractEndDate: booking.end_date || booking.contractEndDate || "",
        rentPaid: booking.rent_paid || booking.rentPaid || "",
        pccExpiry:
          booking.police_verification_expiry || booking.pccExpiry || "",
        detail: booking.detail || "",
        isAffiliatedWithCompany: booking.company_uuid ? "yes" : "no",
        company_uuid: booking.company_uuid || "",
        cnic_front_image: null,
        cnic_back_image: null,
        contract_image: null,
        pcc: null,
      });
    }
  }, [isEditMode, bookingData]);

  const selectedWorkspace = workspacesData?.data?.find(
    (ws) => ws.uuid === formData.workspace
  );
  const isSeatType = selectedWorkspace?.type?.name
    ?.toLowerCase()
    .includes("seat");

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "isAffiliatedWithCompany" && value === "no") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        company_uuid: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  const handleSubmit = async () => {
    const form = new FormData();

    form.append("name", formData.name);
    form.append("email", formData.email);
    form.append("contact_number", formData.phone);
    form.append("cnic", formData.cnic);
    form.append("address", formData.address);
    form.append("workspace_uuid", formData.workspace);
    form.append("rooms_taken", formData.rooms_taken || "0");
    form.append("seats_taken", 1);
    form.append("date_of_tendency", formData.dateOfTendency);
    form.append("period_of_tendency", formData.periodOfTendency);
    form.append("start_date", formData.contractStartDate);
    form.append("end_date", formData.contractEndDate);
    form.append("rent_paid", formData.rentPaid);
    form.append("police_verification_expiry", formData.pccExpiry);
    form.append("detail", formData.detail || "");

    if (formData.cnic_front_image)
      form.append("cnic_front_image", formData.cnic_front_image);
    if (formData.cnic_back_image)
      form.append("cnic_back_image", formData.cnic_back_image);
    if (formData.contract_image)
      form.append("contract_image", formData.contract_image);
    if (formData.pcc)
      form.append("police_verification_certificate", formData.pcc);
    if (formData.company_uuid) {
      form.append("company_booking_uuid", formData.company_uuid);
    }

    try {
      if (isEditMode) {
        await updateBooking({
          path: `/admin/individual-bookings/${uuid}`,
          body: form,
        }).unwrap();
        toast.success("Booking updated successfully!");
      } else {
        await createBooking({
          path: "/admin/individual-company-bookings",
          body: form,
        }).unwrap();
        toast.success("Booking created successfully!");
      }

      handleReset();
      navigate(-1);
    } catch (err) {
      console.error("Booking failed:", err);
      const msg =
        err?.data?.message ||
        `Failed to ${isEditMode ? "update" : "create"} booking`;
      toast.error(`Error: ${msg}`);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      cnic: "",
      address: "",
      workspace: "",
      rooms_taken: "",
      seats_taken: "",
      dateOfTendency: "",
      periodOfTendency: "",
      contractStartDate: "",
      contractEndDate: "",
      rentPaid: "",
      cnic_front_image: null,
      cnic_back_image: null,
      contract_image: null,
      pcc: null,
      pccExpiry: "",
      detail: "",
      isAffiliatedWithCompany: "no",
      company_uuid: "",
    });
  };
  const uniqueWorkspaceMap = new Map();

  workspacesData?.data?.forEach((ws) => {
    const key = `${ws.type.category.name}|${ws.type.name}`;
    if (!uniqueWorkspaceMap.has(key)) {
      uniqueWorkspaceMap.set(key, ws.uuid);
    }
  });

  const workspaceOptions = Array.from(uniqueWorkspaceMap.entries()).map(
    ([key, uuid]) => {
      const [category, typeName] = key.split("|");
      return {
        value: uuid,
        label: `${category} – ${typeName}`,
      };
    }
  );

  const companyOptions =
    companiesData?.data?.map((company) => ({
      value: company.uuid,
      label: company.company_name,
    })) || [];

  if (workspacesIsLoading || (isEditMode && bookingIsLoading))
    return <Loader />;

  if (workspacesError) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-500 font-medium">
            Error loading workspace options
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
              className="w-6 h-6 text-gray-500 hover:text-gray-700 cursor-pointer"
            />
          </div>

          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[#014376] to-[#31918D] bg-clip-text text-transparent">
            {isEditMode ? "Edit Startup Registration" : "Startup Registration"}
          </h1>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter name"
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
                placeholder="XXXXX-XXXXXXX-X"
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

              <FormInput
                type="select"
                label="Workspace"
                name="workspace"
                value={formData.workspace}
                onChange={handleInputChange}
                options={workspaceOptions}
                placeholder="Select workspace"
                required
              />

              {/* <FormInput
                type="select"
                label="Affiliated with Company?"
                name="isAffiliatedWithCompany"
                value={formData.isAffiliatedWithCompany}
                onChange={handleInputChange}
                options={[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Yes' }
                ]}
                required
              /> */}
            </div>

            {/* {formData.isAffiliatedWithCompany === 'yes' && ( */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                type="select"
                label="Select Company"
                name="company_uuid"
                value={formData.company_uuid}
                onChange={handleInputChange}
                options={companyOptions}
                placeholder="Select company"
                required
              />
            </div>
            {/* // )} */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                type="date"
                label="Date of Tendency"
                name="dateOfTendency"
                value={formData.dateOfTendency}
                onChange={handleInputChange}
                required
              />
              <FormInput
                label="Period of Tendency"
                name="periodOfTendency"
                value={formData.periodOfTendency}
                onChange={handleInputChange}
                placeholder="e.g., 6 months"
                required
              />
              <FormInput
                type="file"
                label="Contract Document"
                name="contract_image"
                onChange={handleInputChange}
                accept="image/jpeg,image/png,application/pdf"
                required={!isEditMode}
              />
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
              <FormInput
                type="number"
                label="Rent Paid"
                name="rentPaid"
                value={formData.rentPaid}
                onChange={handleInputChange}
                placeholder="00"
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
                label="Police Clearance Certificate (PCC)"
                name="pcc"
                onChange={handleInputChange}
                accept="image/jpeg,image/png,application/pdf"
                required={!isEditMode}
              />
              <FormInput
                type="date"
                label="PCC Expiry Date"
                name="pccExpiry"
                value={formData.pccExpiry}
                onChange={handleInputChange}
                required
              />
            </div>

            <FormInput
              type="textarea"
              label="Additional Details"
              name="detail"
              value={formData.detail}
              onChange={handleInputChange}
              placeholder="Enter any additional information"
              rows={4}
            />

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isSubmitting
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-[#014376] to-[#31918D] text-white hover:from-[#31918D] hover:to-[#014376]"
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

export default IndividualCompanyForm;
