import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import { BarChart3, Download, Car, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { authorizedAPI } from '../constants/api';

interface Vehicle {
  id: string;
  plateNumber: string;
  parkingCode: string;
  parkingName: string;
  entryDateTime: string;
  exitDateTime: string | null;
  chargedAmount: number | null;
}

interface ReportSummary {
  totalVehicles: number;
  totalRevenue: number;
}

const Reports: React.FC = () => {
  const { user } = useUser();
  const [reportType, setReportType] = useState<'entries' | 'exits'>('entries');
  const [startDate, setStartDate] = useState<string>(format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      const response = await authorizedAPI.get(`/reports/${reportType}`, {
        params: {
          startDate,
          endDate,
        },
      });

      const fetchedVehicles: Vehicle[] = response.data.data || [];

      if (fetchedVehicles.length === 0) {
        toast.error('No reports for the selected date range');
        setVehicles([]);
        setSummary(null);
        setReportGenerated(false); // Prevent rendering empty report
        return;
      }

      // Compute summary locally
      const totalVehicles = fetchedVehicles.length;
      const totalRevenue = fetchedVehicles
        .filter(v => v.chargedAmount !== null)
        .reduce((sum, v) => sum + (v.chargedAmount || 0), 0);

      setVehicles(fetchedVehicles);
      setSummary({ totalVehicles, totalRevenue });
      setReportGenerated(true);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
      setVehicles([]);
      setSummary(null);
      setReportGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!vehicles.length) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Plate Number', 'Parking', 'Entry Time', 'Exit Time', 'Duration', 'Amount'];

    const csvRows = [
      headers.join(','),
      ...vehicles.map(vehicle => {
        const entryTime = new Date(vehicle.entryDateTime);
        const exitTime = vehicle.exitDateTime ? new Date(vehicle.exitDateTime) : null;
        const duration = exitTime
          ? ((exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60)).toFixed(2) + ' hours'
          : '-';

        return [
          vehicle.plateNumber,
          vehicle.parkingName,
          format(entryTime, 'yyyy-MM-dd HH:mm:ss'),
          exitTime ? format(exitTime, 'yyyy-MM-dd HH:mm:ss') : '-',
          duration,
          vehicle.chargedAmount !== null ? `$${vehicle.chargedAmount.toFixed(2)}` : '-',
        ].join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}-report-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600">Generate and view parking reports</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Generate Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'entries' | 'exits')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="entries">Vehicle Entries</option>
              <option value="exits">Vehicle Exits (with Revenue)</option>
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center">
                  <BarChart3 size={18} className="mr-1" />
                  Generate Report
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {reportGenerated && vehicles.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Total Vehicles</p>
                  <h3 className="text-2xl font-bold mt-1">{summary?.totalVehicles || 0}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Car className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            {reportType === 'exits' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Total Revenue</p>
                    <h3 className="text-2xl font-bold mt-1">${summary?.totalRevenue.toFixed(2) || '0.00'}</h3>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">
                {reportType === 'entries' ? 'Vehicle Entries' : 'Vehicle Exits'} Report
              </h2>
              <button onClick={exportToCsv} className="flex items-center text-blue-600 hover:text-blue-800">
                <Download size={18} className="mr-1" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plate Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry Time
                    </th>
                    {reportType === 'exits' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exit Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => {
                      const entryTime = new Date(vehicle.entryDateTime);
                      const exitTime = vehicle.exitDateTime ? new Date(vehicle.exitDateTime) : null;
                      const duration = exitTime
                        ? ((exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60)).toFixed(2) + ' hours'
                        : '-';

                      return (
                        <tr key={vehicle.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {vehicle.plateNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.parkingName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(entryTime, 'PPpp')}
                          </td>
                          {reportType === 'exits' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {exitTime ? format(exitTime, 'PPpp') : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{duration}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {vehicle.chargedAmount !== null ? `$${vehicle.chargedAmount.toFixed(2)}` : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={reportType === 'exits' ? 6 : 3}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No data found for the selected period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;