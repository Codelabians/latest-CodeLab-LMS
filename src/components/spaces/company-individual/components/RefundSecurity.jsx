import React, { useState } from 'react';
import { XCircle, Calendar, Coins } from 'lucide-react';
import { toast } from 'react-toastify';
import { usePostMutation } from '../../../../api/apiSlice';
import FormInput from '../../../ui/FormInput';
import { FaMoneyBill } from 'react-icons/fa';

const RefundSecurity = ({ isOpen, onClose, securityAmount, companyUuid, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: securityAmount || 0,
    refund_date: new Date().toISOString().split('T')[0],
  });

  const [refundSecurity, { isLoading }] = usePostMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.refund_date) {
      toast.error('Please select a refund date');
      return;
    }

    try {
      await refundSecurity({
        path: `/admin/clients/refund-security/${companyUuid}`,
        body: {
          amount: formData.amount,
          refund_date: formData.refund_date,
        },
      }).unwrap();

      toast.success('Security refund processed successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to process refund:', err);
      const msg = err?.data?.message || 'Failed to process security refund';
      toast.error(`Error: ${msg}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="custom-Background p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Coins className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Refund Security Payment</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormInput
            type="text"
            label="Security Amount"
            name="amount"
            value={`PKR ${Number(formData.amount).toLocaleString()}`}
            placeholder="Security amount"
            required
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />

          <FormInput
            type="date"
            label="Refund Date"
            name="refund_date"
            value={formData.refund_date}
            onChange={handleInputChange}
            required
          />

          
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-1 px-6 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                isLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'custom-Background text-white hover:opacity-90'
              }`}
            >
              <Coins className="w-5 h-5" />
              {isLoading ? 'Processing...' : 'Process Refund'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-1 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundSecurity;