import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { toast } from 'react-hot-toast';
import { Car } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
 <div className="min-h-screen flex bg-gray-50">
      {/* Left side with background image and overlay */}
      <div
        className="hidden lg:block lg:w-1/2 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://parkenterpriseconstruction.com/site/wp-content/uploads/2020/07/image4.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
          {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-0"></div>

        {/* Branding message */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 text-center px-10">
          <Car className="h-12 w-12 mb-4" />
          <h1 className="text-3xl font-bold">Smart Parking, Smarter Life</h1>
          <p className="mt-2 text-lg">
            Reserve your spot before someone else grabs it.
          </p>
        </div>
      </div>

      {/* Right: Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 text-center">Welcome Back</h2>
          <p className="text-gray-600 text-center mb-6">Sign in to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition disabled:bg-gray-400"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-4">
            <a href="/forgotPassword" className="text-sm text-blue-600 hover:underline block">
              Forgot password?
            </a>
            <p className="text-sm text-gray-600 mt-2">
              Don’t have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
