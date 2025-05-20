import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Car, ParkingCircle, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { authorizedAPI } from '../constants/api';

interface DashboardStats {
  totalParkings: number;
  availableSpaces: number;
  occupiedSpaces: number;
  totalVehicles: number;
  totalUsers?: number; // Admin-only
  recentEntries: VehicleEntry[];
}

interface VehicleEntry {
  id: string;
  plateNumber: string;
  parkingCode: string;
  parkingName: string;
  entryDateTime: string;
  exitDateTime: string | null;
 hourlyFee: number | null;
}

interface Parking {
  code: string;
  name: string;
  totalSpaces: number;
  availableSpaces: number;
  hourlyFee: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch parkings
        const parkingsResponse = await authorizedAPI.get('/parkings');
        const parkings = parkingsResponse.data.data;

        // Fetch active entries
        const activeEntriesResponse = await authorizedAPI.get('/entries/active');
        const activeEntries = activeEntriesResponse.data.data;

        // Fetch all entries (limited for recent entries)
        const entriesResponse = await authorizedAPI.get('/entries');
        const allEntries = entriesResponse.data.data;

        // Fetch users (admin only)
        let totalUsers = 0;
        if (isAdmin) {
          try {
            const usersResponse = await authorizedAPI.get<User[]>('/users');
            totalUsers = usersResponse.data.length;
          } catch (userError) {
            console.error('Error fetching users:', userError);
            toast.error('Failed to load user data');
          }
        }

        // Calculate stats
        const totalParkings = parkings.length;
        const availableSpaces = parkings.reduce((sum: number, p: Parking) => sum + p.availableSpaces, 0);
        const occupiedSpaces = activeEntries.length;
        const totalVehicles = allEntries.length;
        const recentEntries = allEntries
          .sort((a: VehicleEntry, b: VehicleEntry) => new Date(b.entryDateTime).getTime() - new Date(a.entryDateTime).getTime())
          .slice(0, 5) // Limit to 5 recent entries
          .map((entry: VehicleEntry) => ({
            ...entry,
            parkingName: parkings.find((p: Parking) => p.code === entry.parkingCode)?.name || 'Unknown',
          }));

        setStats({
          totalParkings,
          availableSpaces,
          occupiedSpaces,
          totalVehicles,
          totalUsers: isAdmin ? totalUsers : undefined,
          recentEntries,
        });
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast.error(error.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user?.token, isAdmin]);

  // Wrap all JSX in a single parent element
  return (
    <>
      {!user?.token ? (
        <Navigate to="/login" />
      ) : (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstname} {user?.lastname}!
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Total Parkings</p>
                      <h3 className="text-2xl font-bold mt-1">{stats?.totalParkings || 0}</h3>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <ParkingCircle className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Available Spaces</p>
                      <h3 className="text-2xl font-bold mt-1">{stats?.availableSpaces || 0}</h3>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <ArrowUpRight className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Occupied Spaces</p>
                      <h3 className="text-2xl font-bold mt-1">{stats?.occupiedSpaces || 0}</h3>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full">
                      <ArrowDownRight className="text-red-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">{isAdmin ? 'Total Vehicles' : 'Your Vehicles'}</p>
                      <h3 className="text-2xl font-bold mt-1">{stats?.totalVehicles || 0}</h3>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Car className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Total Users</p>
                        <h3 className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</h3>
                      </div>
                      <div className="bg-indigo-100 p-3 rounded-full">
                        <Users className="text-indigo-600" size={24} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="font-bold text-lg">Recent Vehicle Entries</h2>
                </div>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats?.recentEntries && stats.recentEntries.length > 0 ? (
                        stats.recentEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.plateNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.parkingName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(entry.entryDateTime).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.exitDateTime ? new Date(entry.exitDateTime).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {entry.exitDateTime ? (
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
                              {entry.hourlyFee ? `$${entry.hourlyFee.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No recent entries found
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
      )}
    </>
  );
};

export default Dashboard;