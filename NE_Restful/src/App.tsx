import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ParkingManagement from './pages/ParkingManagement';
import VehicleManagement from './pages/VehicleManagement';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Toaster position="top-right" />
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parking" 
                element={
                  <ProtectedRoute>
                    <ParkingManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vehicles" 
                element={
                  <ProtectedRoute>
                    <VehicleManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;