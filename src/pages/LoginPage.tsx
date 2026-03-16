import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { getProfile, loginUser, type StudentProfileResponse } from '../api';
import uemLogo from '../assets/UEM.png';

export function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");
    const [profile, setProfile] = useState<StudentProfileResponse | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await getProfile();
                    if (res.success) {
                        navigate('/student');
                        return;
                    }
                } catch (e) {
                    // Profile check failed, token might be invalid
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setProfile(null);
        setLoading(true);

        try {
            await loginUser(email, password);

            const profileResponse = await getProfile();
            setProfile(profileResponse);
            setSuccess('Login successful. Session cookie set.');
            navigate('/student');
        } catch (err) {
            console.error('Login Error:', err);

            if (err instanceof Error) {
                setError(err.message || 'Login failed. Please check your credentials.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-w-4xl w-full md:h-[500px]"
            >
                {/* Left Side - Form */}
                <div className="flex-1 bg-sky-500 p-8 md:p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-600 opacity-90"></div>

                    <form
                        onSubmit={handleLogin}
                        className="relative z-10 w-full max-w-xs space-y-6"
                    >
                        <h2 className="text-3xl font-black text-black mb-8 tracking-wider uppercase font-mono">
                            SIGN IN
                        </h2>

                        <input
                            type="text"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-white/80 border-none rounded-lg py-3 px-4 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-800 outline-none transition-all shadow-inner font-bold"
                        />

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="PASSWORD"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-white/80 border-none rounded-lg py-3 pl-4 pr-12 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-800 outline-none transition-all shadow-inner font-bold"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {error && (
                            <p className="text-red-700 font-semibold text-sm">{error}</p>
                        )}

                        {success && (
                            <p className="text-green-800 font-semibold text-sm">{success}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 mt-4"
                        >
                            {loading ? "VERIFYING..." : "LOG IN"}
                        </button>
                    </form>
                </div>

                {/* Right Side - Logo */}
                <div className="flex-1 bg-white p-8 md:p-12 flex items-center justify-center">
                    <div className="text-center">
                        <img
                            src={uemLogo}
                            alt="UEM Logo"
                            className="w-32 md:w-48 mx-auto mb-4"
                        />
                        <p>a single piece of paper can't decide your future</p>
                        <p>GOOD LUCK BUDDIES</p>

                        {profile && (
                            <pre className="mt-6 p-3 bg-gray-100 rounded text-left text-xs overflow-auto max-h-64">
                                {JSON.stringify(profile, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
