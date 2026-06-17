import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useGetQuery, usePostMutation } from '../../../api/apiSlice';
import FormInput from '../../ui/FormInput';
import { toast } from 'react-toastify';


const AddNewWorkspaceModal = ({ isOpen, onClose, onSuccess, companyUuid }) => {
  const [formData, setFormData] = useState({
    category: '',
    type: '',
    workspace_id: '',
    count: '1',
    contract_start_date: '',
    contract_end_date: '',
  });

  const [errors, setErrors] = useState({});

  const { data: categoriesData, isLoading: categoriesLoading } = useGetQuery({
    path: '/admin/workspace-categories',
  });

  const { data: typesData, isLoading: typesLoading } = useGetQuery({
    path: `/admin/workspace-types?category_id=${formData.category}`,
    skip: !formData.category,
  });

  const { data: workspacesData, isLoading: workspacesLoading } = useGetQuery({
    path: `/admin/workspaces/get/available?type_id=${formData.type}`,
    skip: !formData.type,
  });

  const [createWorkspace, { isLoading: isCreating }] = usePostMutation();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        category: '',
        type: '',
        workspace_id: '',
        count: '1',
        contract_start_date: '',
        contract_end_date: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, type: '', workspace_id: '' }));
  }, [formData.category]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, workspace_id: '' }));
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.workspace_id) newErrors.workspace_id = 'Workspace is required';
    if (!formData.contract_start_date) newErrors.contract_start_date = 'Contract start date is required';
    if (!formData.contract_end_date) newErrors.contract_end_date = 'Contract end date is required';

    if (formData.contract_start_date && formData.contract_end_date) {
      if (new Date(formData.contract_end_date) < new Date(formData.contract_start_date)) {
        newErrors.contract_end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const payload = {
        workspace_id: formData.workspace_id,
        start_date: formData.contract_start_date,
        end_date: formData.contract_end_date,
      };

      if (showCountInput) {
        payload.quantity = formData.count;
      }

      await createWorkspace({
        path: `/admin/clients/assign-workspace/${companyUuid}`,
        body: payload,
      }).unwrap();

      toast.success('Workspace assigned successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error assigning workspace:', error);
      const errorMsg = error?.data?.message || 'Failed to assign workspace';
      toast.error(errorMsg);
      setErrors({ submit: errorMsg });
    }
  };

  if (!isOpen) return null;

  const categoryOptions = categoriesData?.data?.map(cat => ({
    value: cat.id.toString(),
    label: cat.name,
  })) || [];

  const typeOptions = typesData?.data?.map(type => ({
    value: type.id.toString(),
    label: `${type.name} (${type.workspaces_count} available)`,
  })) || [];

  const workspaceOptions = workspacesData?.data?.map(ws => ({
    value: ws.id.toString(),
    label: `${ws.type?.name} - Rs. ${parseFloat(ws.price).toFixed(2)}${
      ws.description ? ` (${ws.description})` : ""
    }`,
  })) || [];

  const selectedWorkspace = workspacesData?.data?.find(
    ws => ws.id.toString() === formData.workspace_id
  );
  
  const workspaceTypeName = selectedWorkspace?.type?.name?.toLowerCase() || '';
  const workspaceDesc = selectedWorkspace?.description?.toLowerCase() || '';
  
  const showCountInput = 
    workspaceTypeName.includes('individual') || 
    workspaceDesc.includes('individual') ||
    workspaceTypeName.includes('seats') ||
    workspaceDesc.includes('seats');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New Workspace</h2>
            <p className="text-sm text-gray-600 mt-1">Fill in the details to assign a workspace</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            type="select"
            label="Workspace Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categoryOptions}
            placeholder="Select category"
            required
            error={errors.category}
            disabled={categoriesLoading}
          />

          <FormInput
            type="select"
            label="Workspace Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={typeOptions}
            placeholder={
              formData.category
                ? typesLoading
                  ? 'Loading types...'
                  : 'Select type'
                : 'Select category first'
            }
            required
            error={errors.type}
            disabled={!formData.category || typesLoading}
          />

          <FormInput
            type="select"
            label="Available Workspace"
            name="workspace_id"
            value={formData.workspace_id}
            onChange={handleChange}
            options={workspaceOptions}
            placeholder={
              !formData.type
                ? 'Select type first'
                : workspacesLoading
                ? 'Loading workspaces...'
                : 'Select workspace'
            }
            required
            error={errors.workspace_id}
            disabled={!formData.type || workspacesLoading}
          />

          {showCountInput && (
            <FormInput
              type="number"
              label="Count (Number of Seats)"
              name="count"
              value={formData.count}
              onChange={handleChange}
              placeholder="Enter number of seats"
              min="1"
              required
              error={errors.count}
            />
          )}

          <FormInput
            type="date"
            label="Contract Start Date"
            name="contract_start_date"
            value={formData.contract_start_date}
            onChange={handleChange}
            required
            error={errors.contract_start_date}
          />

          <FormInput
            type="date"
            label="Contract End Date"
            name="contract_end_date"
            value={formData.contract_end_date}
            onChange={handleChange}
            required
            error={errors.contract_end_date}
            min={formData.contract_start_date}
          />

              <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || categoriesLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] text-white rounded-lg hover:from-[#d61111] hover:to-[#d61111] font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Adding...' : 'Add Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewWorkspaceModal;