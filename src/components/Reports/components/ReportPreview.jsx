import { Download } from "lucide-react";

// Sample report data for previews
const SAMPLE_DATA = {
  'batch-attendance': {
    title: 'Summary',
    headers: ['Batch', 'Total Students', 'Average Attendance'],
    rows: [
      ['Morning Batch', '25', '92%'],
      ['Evening Batch', '18', '88%'],
      ['Weekend Batch', '12', '95%']
    ]
  },
  'monthly-expenses': {
    title: 'Expense Breakdown',
    headers: ['Category', 'Amount', '% of Total'],
    rows: [
      ['Staff Salaries', '$15,000', '60%'],
      ['Utilities', '$3,000', '12%'],
      ['Equipment', '$2,500', '10%'],
      ['Total', '$25,000', '100%']
    ],
    totalRow: 3
  },
  'course-enrollment': {
    title: 'Enrollment Statistics',
    headers: ['Course', 'Enrolled', 'Completed', 'Active'],
    rows: [
      ['Web Development', '45', '38', '7'],
      ['Data Science', '32', '25', '7'],
      ['Mobile Development', '28', '20', '8']
    ]
  }
};




// Report Preview Component
const ReportPreview = ({ reportId, onDownload  }) => {
  const data = SAMPLE_DATA[reportId];
  
  if (!data) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 text-6xl">📊</div>
        <h4 className="mb-2 font-semibold">Report Ready</h4>
        <p className="mb-4 text-gray-600">Your report has been generated successfully.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-4 font-semibold">{data.title}</h4>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border border-collapse border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {data.headers.map((header, idx) => (
                <th key={idx} className="p-3 text-left border border-gray-300">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, idx) => (
              <tr key={idx} className={data.totalRow === idx ? 'bg-gray-100 font-bold' : ''}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className={`border border-gray-300 p-3 ${cellIdx > 0 ? 'text-right' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center gap-4">
        {[
          { label: 'Download PDF', format: 'pdf', bg: '#31918D' },
        ].map((button) => (
          <button 
            key={button.format}
            onClick={() => onDownload(button.format)}
            className="flex items-center gap-2 px-6 py-2 text-white transition-all transform rounded-lg hover:-translate-y-1"
            style={{ backgroundColor: button.bg }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Download size={16} />
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportPreview
