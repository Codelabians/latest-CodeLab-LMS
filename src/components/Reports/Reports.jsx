import React, { useState } from 'react';
import { Download, Eye, Calendar, Users, DollarSign, GraduationCap, UserCheck, FileText, Clock, History, Zap } from 'lucide-react';
import ReportPreview from './components/ReportPreview';


const REPORT_CATEGORIES = [
  {
    id: 'attendance',
    title: 'Attendance Reports',
    icon: Users,
    reports: [
      {
        id: 'batch-attendance',
        name: 'Batch-wise Attendance',
        filters: [
          { label: 'Batch', type: 'select', options: ['All Batches', 'Morning Batch', 'Evening Batch', 'Weekend Batch'] },
          { label: 'From', type: 'date' },
          { label: 'To', type: 'date' }
        ],
        hasExcel: true
      },
      {
        id: 'daily-attendance',
        name: 'Daily Attendance Summary',
        filters: [
          { label: 'Date', type: 'date' },
          { label: 'Course', type: 'select', options: ['All Courses', 'Web Development', 'Data Science'] }
        ],
        hasExcel: false
      }
    ]
  },
  {
    id: 'financial',
    title: 'Financial Reports',
    icon: DollarSign,
    reports: [
      {
        id: 'monthly-expenses',
        name: 'Monthly Expenses',
        filters: [
          { label: 'Month', type: 'select', options: ['Current Month', 'Last Month', 'Custom Range'] },
          { label: 'Category', type: 'select', options: ['All Categories', 'Salaries', 'Infrastructure', 'Equipment'] }
        ],
        hasExcel: true
      },
      {
        id: 'fee-collection',
        name: 'Fee Collection Report',
        filters: [
          { label: 'Period', type: 'select', options: ['This Month', 'Last Month', 'Quarter'] },
          { label: 'Status', type: 'select', options: ['All', 'Paid', 'Pending', 'Overdue'] }
        ],
        hasExcel: false
      }
    ]
  },
  {
    id: 'student',
    title: 'Student Reports',
    icon: GraduationCap,
    reports: [
      {
        id: 'course-enrollment',
        name: 'Course-wise Enrollment',
        filters: [
          { label: 'Course', type: 'select', options: ['All Courses', 'Web Development', 'Data Science', 'Mobile Development'] },
          { label: 'Status', type: 'select', options: ['All Students', 'Active', 'Completed', 'Dropped'] }
        ],
        hasExcel: true
      },
      {
        id: 'student-performance',
        name: 'Student Performance Report',
        filters: [
          { label: 'Course', type: 'select', options: ['All Courses', 'Web Development', 'Data Science'] },
          { label: 'Assessment', type: 'select', options: ['All Assessments', 'Mid-term', 'Final', 'Projects'] }
        ],
        hasExcel: false
      }
    ]
  },
  {
    id: 'staff',
    title: 'Staff Reports',
    icon: UserCheck,
    reports: [
      {
        id: 'staff-attendance',
        name: 'Staff Attendance',
        filters: [
          { label: 'Month', type: 'select', options: ['Current Month', 'Last Month'] },
          { label: 'Department', type: 'select', options: ['All Departments', 'Teaching Staff', 'Administrative'] }
        ],
        hasExcel: false
      },
      {
        id: 'payroll',
        name: 'Payroll Summary',
        status: 'processing',
        filters: [
          { label: 'Pay Period', type: 'select', options: ['Current Month', 'Previous Month'] }
        ],
        hasExcel: false
      }
    ]
  }
];



// Filter Component
const FilterGroup = ({ label, type = "select", options = [], value, onChange, ...props }) => (
  <div className="flex flex-col">
    <label className="mb-2 text-sm font-medium text-gray-600">{label}</label>
    {type === "select" ? (
      <select 
        value={value || ''} 
        onChange={(e) => onChange?.(e.target.value)}
        className="px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
        style={{ focusRingColor: '#31918D' }}
        onFocus={(e) => e.target.style.borderColor = '#31918D'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      >
        {options.map((option, idx) => (
          <option key={idx} value={option}>{option}</option>
        ))}
      </select>
    ) : (
      <input 
        type={type}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
        style={{ focusRingColor: '#31918D' }}
        onFocus={(e) => e.target.style.borderColor = '#31918D'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        {...props}
      />
    )}
  </div>
);

// Action Buttons Component
const ActionButtons = ({ onView, onDownloadPDF,  }) => {
  const buttons = [
    { label: 'View Report', icon: Eye, onClick: onView, bg: '#014376' },
    { label: 'Download PDF', icon: Download, onClick: onDownloadPDF, bg: '#31918D' }
  ];
  

  return (
    <div className="flex flex-wrap gap-3">
      {buttons.map((button, idx) => (
        <button 
          key={idx}
          onClick={button.onClick}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-all transform rounded-lg hover:-translate-y-1"
          style={{ backgroundColor: button.bg }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          <button.icon size={16} />
          {button.label}
        </button>
      ))}
    </div>
  );
};



// Report Item Component
const ReportItem = ({ report, onGenerate, onDownloadPDF, onDownloadExcel }) => (
  <div className="p-6 transition-all duration-200 bg-white border border-gray-200 rounded-xl hover:shadow-lg" 
       style={{ 
         borderColor: '#e5e7eb',
         ':hover': { borderColor: '#31918D', backgroundColor: '#f0fffe' }
       }}
       onMouseEnter={(e) => {
         e.currentTarget.style.borderColor = '#31918D';
         e.currentTarget.style.backgroundColor = '#f0fffe';
       }}
       onMouseLeave={(e) => {
         e.currentTarget.style.borderColor = '#e5e7eb';
         e.currentTarget.style.backgroundColor = 'white';
       }}>
  
    
    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
      {report.filters.map((filter, idx) => (
        <FilterGroup 
          key={idx}
          label={filter.label}
          type={filter.type}
          options={filter.options}
        />
      ))}
    </div>
    
    <ActionButtons 
      onView={() => onGenerate(report.id)}
      onDownloadPDF={() => onDownloadPDF(report.id)}
      onDownloadExcel={() => onDownloadExcel(report.id)}
      hasExcel={report.hasExcel}
    />
  </div>
);

// Category Card Component
const CategoryCard = ({ category, onGenerate, onDownloadPDF, onDownloadExcel }) => {
  const Icon = category.icon;
  
  return (
    <div className="p-8 transition-all duration-300 border-2 border-gray-200 bg-gray-50 rounded-2xl hover:-translate-y-2 hover:shadow-xl"
         onMouseEnter={(e) => e.currentTarget.style.borderColor = '#31918D'}
         onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-8 h-8 mr-3 text-white rounded-full"
             style={{ background: 'linear-gradient(135deg, #014376 0%, #31918D 100%)' }}>
          <Icon size={20} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">{category.title}</h3>
      </div>
      <div className="space-y-4">
        {category.reports.map((report) => (
          <ReportItem 
            key={report.id}
            report={report}
            onGenerate={onGenerate}
            onDownloadPDF={onDownloadPDF}
            onDownloadExcel={onDownloadExcel}
          />
        ))}
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};


// Main Dashboard Component
const Reports = () => {
  const [modalState, setModalState] = useState({ isOpen: false, title: '', content: null });

  const showNotification = (message) => {
    alert(message);
  };

  const handleDownload = (reportId, format) => {
    const fileName = `${reportId}_${new Date().toISOString().split('T')[0]}.${format}`;
    showNotification(`Downloading ${fileName}...`);
  };

  const generateReport = (reportId) => {
    setModalState({
      isOpen: true,
      title: `${reportId.replace('-', ' ')} Report`,
      content: <ReportPreview reportId={reportId} onDownload={(format) => handleDownload(reportId, format)} />
    });
  };


  return (
    <div className="min-h-screen">
      <div className="w-11/12 mx-auto overflow-hidden">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>      
        <div className="mt-6">
       
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {REPORT_CATEGORIES.map((category) => (
              <CategoryCard 
                key={category.id}
                category={category}
                onGenerate={generateReport}
                onDownloadPDF={(reportId) => handleDownload(reportId, 'pdf')}
                onDownloadExcel={(reportId) => handleDownload(reportId, 'excel')}
              />
            ))}
          </div>
        </div>
      </div>
      
      <Modal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, title: '', content: null })}
        title={modalState.title}
      >
        {modalState.content}
      </Modal>
    </div>
  );
};

export default Reports;