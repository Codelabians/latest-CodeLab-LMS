import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { useGetQuery, usePostMutation } from "../../../../api/apiSlice";
import FormInput from "../../../ui/FormInput";

const PayRentModal = ({ isOpen, onClose, companyUuid, rentAmount }) => {
  const [formData, setFormData] = useState({
    client_id: "",
    amount: "",
    payment_date: "",
    description: "",
  });

  const {
    data: clientsData,
    isLoading: clientsLoading,
  } = useGetQuery({
    path: `/admin/clients?is_company=1&company_uuid=${companyUuid}`,
    skip: !isOpen || !companyUuid,
  });

  const [payRent, { isLoading: isSubmitting }] = usePostMutation();

  useEffect(() => {
    if (isOpen && rentAmount) {
      // Auto-fill rent amount when modal opens
      setFormData((prev) => ({
        ...prev,
        amount: rentAmount,
      }));
    }
    
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        client_id: "",
        amount: "",
        payment_date: "",
        description: "",
      });
    }
  }, [isOpen, rentAmount]);

 const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-fill rent amount when client is selected
    if (name === "client_id" && value) {
      const selectedClient = clientsData?.data?.find(
        (client) => client.id === Number(value)
      );
      if (selectedClient) {
        setFormData((prev) => ({
          ...prev,
          amount: selectedClient.total_price || selectedClient.rent || "",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      client_id: Number(formData.client_id),
      price: String(formData.amount),
      date: formData.payment_date,
      description: formData.description,
    };

    try {
      await payRent({
        path: `/admin/clients/pay-rent/${companyUuid}`,
        body: payload,
      }).unwrap();

      toast.success("Rent payment recorded successfully!");
      onClose();
    } catch (err) {
      console.error("Payment failed:", err);
      const msg = err?.data?.message || "Failed to record rent payment";
      toast.error(`Error: ${msg}`);
    }
  };

  if (!isOpen) return null;

  // Transform clients data for dropdown
  const clientOptions = clientsData?.data?.map((client) => ({
    value: client.id,
    label: client.name || client.company_name,
  })) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] bg-clip-text text-transparent">
          Pay Rent
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* <FormInput
            type="select"
            label="Select Client"
            name="client_id"
            value={formData.client_id}
            onChange={handleInputChange}
            options={clientOptions}
            placeholder="Select a client"
            isLoading={clientsLoading}
            required
          /> */}

          <FormInput
            type="number"
            label="Rent Amount (PKR)"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter rent amount"
            min="0"
            step="0.01"
            required
          />

          <FormInput
            type="date"
            label="Payment Date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleInputChange}
            required
          />

          <FormInput
            type="textarea"
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter payment description (optional)"
            rows={3}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                isSubmitting
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] text-white hover:from-[#d61111] hover:to-[#d61111]"
              }`}
            >
              {isSubmitting ? "Processing..." : "Pay Rent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayRentModal;