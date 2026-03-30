import { Check, X, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import FormInput from '../../ui/FormInput';

const AssignPermissionModal = ({ isOpen, onClose, role, permissions = [], onSave, isSubmitting = false }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({ permissions: [] });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (role) {
            // Pre-fill with existing permissions
            const existingPermissions = role.permissions 
                ? role.permissions.map(p => typeof p === 'object' ? p.id : p)
                : [];
            
            setFormData({ permissions: existingPermissions });
            setErrors({});
        }
    }, [role, isOpen]);

    const handleSubmit = () => {
        const newErrors = {};

        if (!formData.permissions || formData.permissions.length === 0) {
            newErrors.permissions = 'Please select at least one permission';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        onSave(formData.permissions);
    };

    const handleChange = (selectedOptions) => {
        const value = Array.isArray(selectedOptions) 
            ? selectedOptions.map(option => option.value)
            : [];
        
        setFormData({ permissions: value });

        if (errors.permissions) {
            setErrors(prev => ({ ...prev, permissions: '' }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Assign Permissions
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <FormInput
                        label="Role"
                        name="role"
                        value={role?.name || ''}
                        disabled={true}
                        placeholder="Role name"
                    />

                    <FormInput
                        type="select"
                        label="Permissions"
                        name="permissions"
                        value={formData.permissions || []}
                        onChange={handleChange}
                        options={permissions}
                        isMulti
                        error={errors.permissions}
                        disabled={isSubmitting}
                        required
                    />

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-[#d61111] text-white rounded-lg hover:bg-[#2a7d7a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Assign
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AssignPermissionModal