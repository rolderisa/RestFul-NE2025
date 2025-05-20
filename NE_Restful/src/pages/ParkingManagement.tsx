import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import {  Plus, Edit, Trash2 } from 'lucide-react';
import { authorizedAPI } from '../constants/api';

interface Parking {
  id: string;
  code: string;
  name: string;
  location: string;
  totalSpaces: number;
  availableSpaces: number;
  hourlyFee: number;
}

interface ParkingFormData {
  code: string;
  name: string;
  location: string;
  totalSpaces: number;
  hourlyFee: number;
}


const ParkingManagement: React.FC = () => {
  const { isAdmin } = useUser();
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ParkingFormData>({
    code: '',
    name: '',
    location: '',
    totalSpaces: 0,
    hourlyFee: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    try {
      setLoading(true);
      const response = await authorizedAPI.get(`/parkings`);
      setParkings(response.data.data);
    } catch (error) {
      console.error('Error fetching parkings:', error);
      toast.error('Failed to load parking data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalSpaces' || name === 'hourlyFee' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await authorizedAPI.put(`/parkings/${editingId}`, formData);
        toast.success('Parking updated successfully');
      } else {
        await authorizedAPI.post(`/parkings`, formData);
        toast.success('Parking created successfully');
      }
      
      resetForm();
      fetchParkings();
    } catch (error) {
      console.error('Error saving parking:', error);
      toast.error('Failed to save parking');
    }
  };

  const handleEdit = (parking: Parking) => {
    setFormData({
      code: parking.code,
      name: parking.name,
      location: parking.location,
      totalSpaces: parking.totalSpaces,
      hourlyFee: parking.hourlyFee
    });
    setEditingId(parking.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this parking?')) {
      try {
        await authorizedAPI.delete(`/parkings/${id}`);
        toast.success('Parking deleted successfully');
        fetchParkings();
      } catch (error) {
        console.error('Error deleting parking:', error);
        toast.error('Failed to delete parking');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      location: '',
      totalSpaces: 0,
      hourlyFee: 0
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading && parkings.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Parking Management</h1>
          <p className="text-gray-600">Manage parking locations and spaces</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            {showForm ? 'Cancel' : (
              <>
                <Plus size={18} className="mr-1" />
                Add Parking
              </>
            )}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Parking' : 'Add New Parking'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Parking Code</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Parking Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="totalSpaces" className="block text-sm font-medium text-gray-700 mb-1">Total Spaces</label>
                <input
                  type="number"
                  id="totalSpaces"
                  name="totalSpaces"
                  value={formData.totalSpaces}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="hourlyFee" className="block text-sm font-medium text-gray-700 mb-1">Fee Per Hour ($)</label>
                <input
                  type="number"
                  id="hourlyFee"
                  name="hourlyFee"
                  value={formData.hourlyFee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
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
                {editingId ? 'Update Parking' : 'Add Parking'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spaces</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee/Hour</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parkings.length > 0 ? (
                parkings.map((parking) => (
                  <tr key={parking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{parking.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parking.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parking.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parking.totalSpaces}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        parking.availableSpaces > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {parking.availableSpaces}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parking.hourlyFee}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(parking)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(parking.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No parking locations found
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

export default ParkingManagement;