import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import { Car, Plus, LogIn, LogOut, Printer } from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';
import { authorizedAPI } from '../constants/api';

interface Parking {
  id: string;
  code: string;
  name: string;
  availableSpaces: number;
  chargingFeePerHour: number;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  parkingCode: string;
  parkingName: string;
  entryDateTime: string;
  exitDateTime: string | null;
  hourlyFee: number;
}

interface VehicleEntryFormData {
  plateNumber: string;
  parkingCode: string;
}

const VehicleManagement: React.FC = () => {
  const { user } = useUser();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [formData, setFormData] = useState<VehicleEntryFormData>({
    plateNumber: '',
    parkingCode: ''
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [showBill, setShowBill] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchParkings();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await authorizedAPI.get(`/entries`);
      setVehicles(response.data.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const fetchParkings = async () => {
    try {
      const response = await authorizedAPI.get(`/parkings`);      
      setParkings(response.data.data);
    } catch (error) {
      console.error('Error fetching parkings:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await authorizedAPI.post(`/entries`, formData);
      toast.success('Vehicle entry recorded successfully');
      setSelectedVehicle(response.data);
      setShowTicket(true);
      resetForm();
      fetchVehicles();
      fetchParkings(); // Refresh parking data to update available spaces
    } catch (error) {
      console.error('Error recording vehicle entry:', error);
      toast.error('Failed to record vehicle entry');
    }
  };

  const handleExit = async (id: string) => {
    try {
      const response = await authorizedAPI.put(`/entries/${id}/exit`);
      toast.success('Vehicle exit recorded successfully');
      setSelectedVehicle(response.data);
      setShowBill(true);
      fetchVehicles();
      fetchParkings(); // Refresh parking data to update available spaces
    } catch (error) {
      console.error('Error recording vehicle exit:', error);
      toast.error('Failed to record vehicle exit');
    }
  };

  const resetForm = () => {
    setFormData({
      plateNumber: '',
      parkingCode: ''
    });
    setShowEntryForm(false);
  };


 function calculateParkingFee(
  hourlyFee: number,
  entryDateTime: string | Date,
  exitDateTime?: string | Date | null
): number {
  // Handle invalid inputs
  if (!hourlyFee || hourlyFee <= 0 || !entryDateTime) {
    return 0;
  }

  // Convert to Date objects
  const entry = new Date(entryDateTime);
  const exit = exitDateTime ? new Date(exitDateTime) : new Date();

  // Validate dates
  if (isNaN(entry.getTime()) || isNaN(exit.getTime()) || exit < entry) {
    return 0;
  }

  // Calculate duration in minutes
  const durationMinutes = (exit.getTime() - entry.getTime()) / (1000 * 60);

  // Round up to the nearest hour (e.g., 5 mins → 1 hour, 61 mins → 2 hours)
  const hoursCharged = Math.ceil(durationMinutes / 60);

  // Calculate fee
  return hoursCharged * hourlyFee;
}

  const printTicket = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Parking Ticket</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .ticket { max-width: 300px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .details { margin-bottom: 20px; }
              .footer { text-align: center; font-size: 12px; margin-top: 20px; }
              table { width: 100%; }
              td { padding: 5px 0; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h2>XWYZ PARKING</h2>
                <p>PARKING TICKET</p>
              </div>
              <div class="details">
                <table>
                  <tr>
                    <td><strong>Ticket #:</strong></td>
                    <td>${selectedVehicle?.id.substring(0, 8)}</td>
                  </tr>
                  <tr>
                    <td><strong>Plate Number:</strong></td>
                    <td>${selectedVehicle?.plateNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>Parking:</strong></td>
                    <td>${selectedVehicle?.parkingName}</td>
                  </tr>
                  <tr>
                    <td><strong>Entry Time:</strong></td>
                    <td>${format(new Date(selectedVehicle?.entryDateTime || ''), 'PPpp')}</td>
                  </tr>
                  <tr>
                    <td><strong>Fee/Hour:</strong></td>
                    <td>$${parkings.find(p => p.code === selectedVehicle?.parkingCode)?.chargingFeePerHour.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              <div class="footer">
                <p>Please keep this ticket safe.</p>
                <p>Present this ticket when exiting the parking.</p>
                <p>Thank you for choosing XWYZ Parking!</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    setShowTicket(false);
  };

  const printBill = () => {
    if (!selectedVehicle || !selectedVehicle.exitDateTime) return;
    
    const entryTime = new Date(selectedVehicle.entryDateTime);
    const exitTime = new Date(selectedVehicle.exitDateTime);
    const duration = formatDistanceStrict(exitTime, entryTime);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Parking Bill</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .bill { max-width: 300px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .details { margin-bottom: 20px; }
              .amount { font-size: 24px; text-align: center; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; font-size: 12px; margin-top: 20px; }
              table { width: 100%; }
              td { padding: 5px 0; }
            </style>
          </head>
          <body>
            <div class="bill">
              <div class="header">
                <h2>XWYZ PARKING</h2>
                <p>PARKING BILL</p>
              </div>
              <div class="details">
                <table>
                  <tr>
                    <td><strong>Bill #:</strong></td>
                    <td>${selectedVehicle.id.substring(0, 8)}</td>
                  </tr>
                  <tr>
                    <td><strong>Plate Number:</strong></td>
                    <td>${selectedVehicle.plateNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>Parking:</strong></td>
                    <td>${selectedVehicle.parkingName}</td>
                  </tr>
                  <tr>
                    <td><strong>Entry Time:</strong></td>
                    <td>${format(entryTime, 'PPpp')}</td>
                  </tr>
                  <tr>
                    <td><strong>Exit Time:</strong></td>
                    <td>${format(exitTime, 'PPpp')}</td>
                  </tr>
                  <tr>
                    <td><strong>Duration:</strong></td>
                    <td>${duration}</td>
                  </tr>
                </table>
              </div>
              <div class="amount">
                TOTAL: $${selectedVehicle.hourlyFee}
              </div>
              <div class="footer">
                <p>Thank you for choosing XWYZ Parking!</p>
                <p>Visit us again soon.</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    setShowBill(false);
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicle Management</h1>
          <p className="text-gray-600">Record vehicle entries and exits</p>
        </div>
        <button
          onClick={() => setShowEntryForm(!showEntryForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          {showEntryForm ? 'Cancel' : (
            <>
              <Plus size={18} className="mr-1" />
              New Entry
            </>
          )}
        </button>
      </div>

      {showEntryForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Record Vehicle Entry</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                <input
                  type="text"
                  id="plateNumber"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="parkingCode" className="block text-sm font-medium text-gray-700 mb-1">Parking Location</label>
                <select
                  id="parkingCode"
                  name="parkingCode"
                  value={formData.parkingCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Parking</option>
                  {parkings.map(parking => (
                    <option 
                      key={parking.id} 
                      value={parking.code}
                      disabled={parking.availableSpaces <= 0}
                    >
                      {parking.name} ({parking.availableSpaces} spaces available)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Record Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {showTicket && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Parking Ticket</h2>
            <div className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Ticket #:</div>
                <div>{selectedVehicle.id.substring(0, 8)}</div>
                
                <div className="text-gray-600">Plate Number:</div>
                <div>{selectedVehicle.plateNumber}</div>
                
                <div className="text-gray-600">Parking:</div>
                <div>{selectedVehicle.parkingName}</div>
                
                <div className="text-gray-600">Entry Time:</div>
                <div>{format(new Date(selectedVehicle.entryDateTime), 'PPpp')}</div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTicket(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={printTicket}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Printer size={18} className="mr-1" />
                Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {showBill && selectedVehicle && selectedVehicle.exitDateTime && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Parking Bill</h2>
            <div className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Bill #:</div>
                <div>{selectedVehicle.id.substring(0, 8)}</div>
                
                <div className="text-gray-600">Plate Number:</div>
                <div>{selectedVehicle.plateNumber}</div>
                
                <div className="text-gray-600">Parking:</div>
                <div>{selectedVehicle.parkingName}</div>
                
                <div className="text-gray-600">Entry Time:</div>
                <div>{format(new Date(selectedVehicle.entryDateTime), 'PPpp')}</div>
                
                <div className="text-gray-600">Exit Time:</div>
                <div>{format(new Date(selectedVehicle.exitDateTime), 'PPpp')}</div>
                
                <div className="text-gray-600">Duration:</div>
                <div>{formatDistanceStrict(
                  new Date(selectedVehicle.exitDateTime),
                  new Date(selectedVehicle.entryDateTime)
                )}</div>
                
                <div className="text-gray-600 font-bold">Total Amount:</div>
                <div className="font-bold">${calculateParkingFee(selectedVehicle.hourlyFee , selectedVehicle.entryDateTime, selectedVehicle.exitDateTime)}</div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBill(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={printBill}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Printer size={18} className="mr-1" />
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.plateNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.parkingName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(vehicle.entryDateTime), 'PPpp')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.exitDateTime ? format(new Date(vehicle.exitDateTime), 'PPpp') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.exitDateTime ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Exited
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Parked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.hourlyFee ? `$${vehicle.hourlyFee}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!vehicle.exitDateTime ? (
                        <button
                          onClick={() => handleExit(vehicle.id)}
                          className="text-green-600 hover:text-green-900 flex items-center justify-end"
                        >
                          <LogOut size={18} className="mr-1" />
                          Record Exit
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowBill(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                        >
                          <Printer size={18} className="mr-1" />
                          Print Bill
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No vehicle entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VehicleManagement;