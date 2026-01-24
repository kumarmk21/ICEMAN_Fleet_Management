import { FileText, Download } from 'lucide-react';

export function ReportsList() {
  const reports = [
    {
      name: 'Trip Summary Report',
      description: 'Comprehensive report of all trips with revenue and costs',
      icon: FileText,
    },
    {
      name: 'Vehicle Running and Fuel Report',
      description: 'KM run, fuel consumption, and KMPL analysis by vehicle',
      icon: FileText,
    },
    {
      name: 'Vehicle Maintenance Report',
      description: 'Detailed maintenance history and costs per vehicle',
      icon: FileText,
    },
    {
      name: 'Truck-wise Profitability Report',
      description: 'Complete P&L statement for each vehicle',
      icon: FileText,
    },
    {
      name: 'Driver Performance Report',
      description: 'Driver-wise trips, revenue, and efficiency metrics',
      icon: FileText,
    },
    {
      name: 'Customer Revenue Report',
      description: 'Revenue analysis by customer',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold">Reports & MIS</h2>
        <p className="text-sm text-gray-600 mt-2">
          Generate and export various management reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => {
          const Icon = report.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{report.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    <Download className="w-4 h-4" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
