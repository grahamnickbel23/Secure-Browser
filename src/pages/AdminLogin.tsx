import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api'; // Import API service

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      // API Integration Example:
      /*
      try {
        setLoading(true);
        const response = await api.auth.adminLogin({ email, password });
        // Store token, e.g., localStorage.setItem('adminToken', response.token);
        navigate('/admin-dashboard');
      } catch (error) {
        console.error('Admin login failed:', error);
        alert('Admin login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
      */

      // Mock Login for Demo
      navigate('/admin-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl h-[500px] animate-in fade-in zoom-in duration-500">
        
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 bg-gray-900 p-12 flex flex-col justify-center items-center text-white relative">
          <h2 className="text-4xl font-black mb-8 tracking-widest text-white uppercase">Admin Portal</h2>
          
          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1 ml-1">ADMIN ID</label>
              <input
                type="text"
                placeholder="Enter Admin ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 text-white placeholder-gray-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1 ml-1">PASSWORD</label>
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 text-white placeholder-gray-500 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full shadow-lg transition-all transform hover:scale-105 mt-6"
            >
              ACCESS DASHBOARD
            </button>
          </form>

          <button 
            onClick={() => navigate('/')}
            className="mt-6 text-gray-500 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors"
          >
            Back to Login
          </button>
        </div>

        {/* Right Side - Logo */}
        <div className="w-full md:w-1/2 bg-gray-100 flex flex-col justify-center items-center p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gray-200 rounded-full -mr-32 -mt-32 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-300 rounded-full -ml-24 -mb-24 opacity-50"></div>
            
            <div className="flex-1 bg-white p-8 md:p-12 flex items-center justify-center">
          <div className="text-center">
            <img
              src="src/assets/UEM.png"
              alt="UEM Logo"
              className="w-32 md:w-48 mx-auto mb-4"
            />
          </div>
        </div>

            <div className="text-center relative z-10">
                <h3 className="text-gray-900 font-black text-2xl uppercase tracking-tight">System Administration</h3>
                <div className="h-1 w-24 bg-blue-600 mx-auto my-4 rounded-full"></div>
                <p className="text-gray-500 font-bold tracking-widest text-sm">SECURE ACCESS ONLY</p>
            </div>
        </div>
      </div>
    </div>
  );
}
