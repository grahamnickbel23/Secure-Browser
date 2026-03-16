import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { api } from '../services/api'; // Import API service

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        setLoading(true);
        const response: any = await api.auth.login({ email, password });
        if (response?.success || response?.message === "Login successful" || response?.access_token || response?.token) {
          if (response.access_token) localStorage.setItem('token', response.access_token);
          else if (response.token) localStorage.setItem('token', response.token);
          else if (response.data && response.data.access_token) localStorage.setItem('token', response.data.access_token);
          else if (response.data && response.data.token) localStorage.setItem('token', response.data.token);

          navigate('/dashboard');
        } else {
          alert('Login failed. Please check your credentials.');
        }
      } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl h-[500px] animate-in fade-in zoom-in duration-500">

          {/* Left Side - Login Form */}
          <div className="w-full md:w-1/2 bg-sky-500 p-12 flex flex-col justify-center items-center text-white relative">
            <h2 className="text-4xl font-black mb-8 tracking-widest text-black uppercase">Sign In</h2>

            <form onSubmit={handleLogin} className="w-full space-y-6">
              <div>
                <label className="block text-sm font-bold text-black mb-1 ml-1">ID / EMAIL</label>
                <input
                  type="text"
                  placeholder="Enter your ID or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/20 text-white placeholder-white/70 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/10 transition-all backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1 ml-1">PASSWORD</label>
                <input
                  type="password"
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/20 text-white placeholder-white/70 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/10 transition-all backdrop-blur-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-full shadow-lg transition-all transform hover:scale-105 mt-6 border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
              >
                LOG IN
              </button>
            </form>

            <button
              onClick={() => navigate('/admin-login')}
              className="mt-6 text-white/70 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Admin Access
            </button>
          </div>

          {/* Right Side - Logo */}
          <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full -ml-24 -mb-24 opacity-50"></div>

            <div className="flex-1 bg-white p-8 md:p-12 flex items-center justify-center">
              <div className="text-center">
                <img
                  src="src/assets/UEM.png"
                  alt="UEM Logo"
                  className="w-32 md:w-48 mx-auto mb-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
