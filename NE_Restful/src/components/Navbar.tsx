import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Car, LogOut, ParkingCircle, BarChart3, Home } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <ParkingCircle size={24} />
            <span className="text-xl font-bold">XWYZ Parking</span>
          </div>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/dashboard" className="flex items-center space-x-1 hover:text-blue-200">
              <Home size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/parking" className="flex items-center space-x-1 hover:text-blue-200">
              <ParkingCircle size={18} />
              <span>Parking</span>
            </Link>
            <Link to="/vehicles" className="flex items-center space-x-1 hover:text-blue-200">
              <Car size={18} />
              <span>Vehicles</span>
            </Link>
            <Link to="/reports" className="flex items-center space-x-1 hover:text-blue-200">
              <BarChart3 size={18} />
              <span>Reports</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="block">Welcome, {user?.firstname}</span>
              <span className="block text-xs opacity-75">{user?.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;