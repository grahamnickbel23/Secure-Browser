import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, LogOut, AlertTriangle } from 'lucide-react';
import { verifyExamCode, getProfile, logoutUser, StudentProfile } from '../api';

export function StudentLoginPage() {
    const navigate = useNavigate();

    const [examCode, setExamCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showBlockedPopup, setShowBlockedPopup] = useState(false);

    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getProfile().then(res => {
            if (res.success && res.data) {
                setProfile(res.data);
            } else {
                navigate("/");
            }
        }).catch(err => {
            console.error("Failed to fetch profile", err);
            navigate("/");
        });
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setShowProfilePopup(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logoutUser();
        navigate("/");
    };

    const handleStart = async () => {
        if (!examCode.trim()) {
            setError("Exam code is required");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await verifyExamCode(examCode);

            if (response.success && response.data?.url) {
                localStorage.setItem("examSession", JSON.stringify(response.data));
                if (window.electronAPI && window.electronAPI.enterFullScreen) {
                    window.electronAPI.enterFullScreen();
                }
                navigate("/exam");
            } else {
                setError("Failed to verify exam code");
            }
        } catch (err: any) {
            if (err.message === "You are blocked from this exam") {
                setShowBlockedPopup(true);
            } else {
                setError(err.message || "Invalid or expired exam code");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 relative">
            {/* Header/Profile Section */}
            <div className="absolute top-4 right-4 z-50" ref={popupRef}>
                <button
                    onClick={() => setShowProfilePopup(!showProfilePopup)}
                    className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md hover:bg-blue-700 transition"
                >
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : <User />}
                </button>

                <AnimatePresence>
                    {showProfilePopup && profile && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-[400px] bg-white rounded-3xl shadow-2xl p-4 text-gray-900 border border-gray-200"
                        >
                            <div className="flex flex-col items-center mb-4 mt-2">
                                <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold mb-3 shadow-inner">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-2xl font-medium">Hi, {profile.name.split(' ')[0]}!</h3>
                                <p className="text-sm text-gray-600 mt-1 mb-2">{profile.email}</p>
                            </div>

                            <div className="space-y-3 bg-gray-50 rounded-3xl p-5 mb-2 mx-1 shadow-inner border border-gray-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Name</span>
                                    <span className="font-medium text-gray-900">{profile.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Enrollment ID</span>
                                    <span className="font-medium text-gray-900">{profile.enrollmentId}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Department</span>
                                    <span className="font-medium text-gray-900 truncate max-w-[200px]" title={profile.department}>{profile.department}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Section</span>
                                    <span className="font-medium text-gray-900">{profile.section}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Roll No</span>
                                    <span className="font-medium text-gray-900">{profile.roll}</span>
                                </div>
                            </div>

                            <div className="mt-4 mb-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-4 px-4 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center space-x-2 transition-colors font-medium border border-gray-200"
                                >
                                    <LogOut size={20} />
                                    <span>Sign out</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-sky-300 rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center border-4 border-white/20 relative"
            >
                <Link
                    to="/"
                    className="absolute top-4 left-4 text-black/50 hover:text-black"
                >
                    <ArrowLeft size={32} />
                </Link>

                <h2 className="text-3xl md:text-4xl font-black text-black mb-8 tracking-wider uppercase font-mono">
                    SIGN IN
                </h2>

                <div className="space-y-8 max-w-md mx-auto">
                    <input
                        type="text"
                        placeholder="EXAM CODE"
                        value={examCode}
                        onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                        className="w-full bg-white/80 border-none rounded-lg py-4 px-6 text-xl text-center text-gray-800 placeholder-gray-500 focus:ring-4 focus:ring-blue-500 outline-none transition-all shadow-inner font-bold uppercase"
                    />

                    {error && (
                        <p className="text-red-700 font-semibold">{error}</p>
                    )}

                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-12 rounded-full text-lg shadow-xl transform transition hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                        {loading ? "VERIFYING..." : "START"}
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {showBlockedPopup && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-red-50 border-4 border-red-500 rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center relative"
                        >
                            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-10 h-10 text-red-600" />
                            </div>
                            <h3 className="text-3xl font-black text-red-800 mb-4 uppercase">Access Blocked</h3>
                            <p className="text-red-700 font-semibold text-lg mb-8">
                                Your device has been blacklisted due to a suspected attempt to use another application. To resume the exam, please contact your examiner.
                            </p>
                            <button
                                onClick={() => setShowBlockedPopup(false)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-10 rounded-full shadow-lg transition hover:scale-105 active:scale-95"
                            >
                                CLOSE
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
