import React from 'react';
import Select from 'react-select';

const FormInput = ({
  type = 'text',
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  options = [],
  accept,
  rows = 4,
  className = '',
  isMulti = false,
  isLoading = false,
  ...props
}) => {
  const baseClasses = `w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${error ? 'border-red-500' : ''} ${className}`;

  const renderInput = () => {
    switch (type) {
      case 'select':
        // Normalize options (support both array and object with .data)
        const normalizedOptions = Array.isArray(options)
          ? options
          : Array.isArray(options?.data)
          ? options.data
          : [];

        // If multi-select, use react-select
        if (isMulti) {
          // Convert value array to selected options format
          const selectedOptions = normalizedOptions.filter(option => 
            value?.includes(option.value)
          );

          return (
            <Select
              name={name}
              value={selectedOptions}
              onChange={onChange}
              options={normalizedOptions}
              isMulti
              isLoading={isLoading}
              placeholder={placeholder || 'Select options...'}
              className="react-select-container"
              classNamePrefix="react-select"
              required={required}
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                  '&:hover': {
                    borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
                  },
                  padding: '4px',
                  minHeight: '48px',
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#014376',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: 'white',
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: 'white',
                  ':hover': {
                    backgroundColor: '#31918D',
                    color: 'white',
                  },
                }),
              }}
              {...props}
            />
          );
        }

        // Regular single select
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className={baseClasses}
            required={required}
            {...props}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {normalizedOptions.map((option, index) => {
              // Support {value, label} objects or plain strings
              const val = option.value ?? option.uuid ?? option;
              const lbl = option.label ?? option.name ?? option;
              return (
                <option key={index} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`${baseClasses} resize-vertical`}
            rows={rows}
            required={required}
            {...props}
          />
        );

      case 'file':
        return (
          <input
            type="file"
            name={name}
            onChange={onChange}
            accept={accept}
            className={`${baseClasses} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-[#014376] file:to-[#31918D] file:text-white file:font-medium hover:file:from-[#31918D] hover:file:to-[#014376]`}
            required={required}
            {...props}
          />
        );

      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={baseClasses}
            required={required}
            {...props}
          />
        );
    }
  };

  return (
    <div className="mb-5">
      {label && (
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="flex items-center mt-2 text-sm text-red-600">
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;