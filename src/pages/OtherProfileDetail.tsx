import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Building2, GraduationCap, ChevronLeft, ShieldCheck, Mail, Hash, UserPlus, Edit2, Save, X, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function OtherProfileDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<any>(null);
    const [exams, setExams] = useState<any[]>([]);
    const [totalCreatedExams, setTotalCreatedExams] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const storedUser = localStorage.getItem('teacherProfile');
    const isAdmin = storedUser ? JSON.parse(storedUser).admin === true : false;

    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', department: '', password: '' });

    const handleOpenEditModal = () => {
        setEditFormData({
            name: profile.name || '',
            email: profile.email || '',
            department: profile.department || '',
            password: ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveAllFields = async () => {
        const allowedFields = ["name", "email", "department", "password"];
        let updatedProfile = { ...profile };
        let anySuccess = false;
        let currentEmail = profile.email;

        try {
            for (const field of allowedFields) {
                const newValue = editFormData[field as keyof typeof editFormData];
                if (field === 'password' && !newValue) continue;
                if (field !== 'password' && newValue === profile[field]) continue;

                const response = await api.student.update(currentEmail, field, newValue) as any;
                if (response.success || response.message?.includes('success')) {
                    anySuccess = true;
                    updatedProfile[field] = newValue;
                    if (field === 'email') {
                        currentEmail = newValue; // Update identifier for consecutive calls
                    }
                }
            }
            if (anySuccess) {
                setProfile(updatedProfile);
                setIsEditModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Error saving profile updates.");
        }
    };

    const handleSaveField = async (field: string) => {
        try {
            // Note: Currently backend relies on email as identifier based on spec
            const response = await api.student.update(profile.email, field, editValue) as any;
            if (response.success || response.message?.includes('success')) {
                setProfile({ ...profile, [field]: editValue });
                setEditingField(null);
            } else {
                alert(response.message || "Failed to update field.");
            }
        } catch (error) {
            console.error(`Failed to update ${field}`, error);
            alert("Error saving field update.");
        }
    };

    const executeDeleteAccount = async () => {
        try {
            const response = await api.student.delete(profile.email) as any;
            if (response.success || response.message?.includes('success')) {
                navigate('/other-profiles');
            } else {
                alert(response.message || "Failed to delete student account.");
            }
        } catch (error) {
            console.error("Failed to delete account", error);
            alert("Error deleting student account.");
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const type = location.state?.type;
                if (!type || !id) {
                    setIsLoading(false);
                    return;
                }

                const token = localStorage.getItem('token') || '';
                const response = await api.search.profile(type, id, token) as any;
                if (response.success) {
                    if (type === 'student') {
                        setProfile(response.data.student);
                        setExams(response.data.enrolledExams || []);
                    } else if (type === 'teacher') {
                        setProfile(response.data.teacher);
                        setExams(response.data.createdExams || []);
                        setTotalCreatedExams(response.data.totalCreatedExams || 0);
                    } else {
                        // Fallback for admin or unexpected structure
                        setProfile(response.data.admin || response.data);
                        setExams([]);
                    }
                } else {
                    setProfile(null);
                    setExams([]);
                }
            } catch (error) {
                console.error("Failed to fetch profile details", error);
                setProfile(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [id, location.state]);

    const formatDateIST = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return `Account created with ${date.toLocaleString('en-US', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            })} IST`;
        } catch {
            return `Account created with ${dateString}`;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <p className="text-gray-500 font-medium animate-pulse">Loading profile data...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
                <button
                    onClick={() => navigate('/other-profiles')}
                    className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors w-fit mb-6"
                >
                    <ChevronLeft size={20} /> Back to Search
                </button>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Profile Not Found</h2>
                    <p className="text-gray-500 font-medium">The requested user profile does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const accountType = location.state?.type || 'student';
    const role = accountType === 'admin' ? 'Administrator' : accountType === 'teacher' ? 'Teacher' : 'Student';
    const avatarInitials = profile.name ? profile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?';


    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300 max-w-4xl mx-auto w-full pb-20">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/other-profiles')}
                    className="p-2 bg-white text-gray-600 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">User Profile</h1>
            </div>

            {/* Top Area - Avatar, Name, Connect Button (Centered) */}
            <div className="flex flex-col items-center justify-center w-full mb-10 mt-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-6">
                    <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center shadow-lg mb-2 border-4 border-white outline outline-1 outline-gray-200 ${role === 'Administrator' ? 'bg-red-900' :
                        role === 'Teacher' ? 'bg-[#115e3b]' : 'bg-[#115e3b]'
                        }`}>
                        <span className={`text-6xl sm:text-7xl font-black tracking-tighter shadow-sm ${role === 'Administrator' ? 'text-yellow-500' : 'text-white'
                            }`}>
                            {avatarInitials}
                        </span>
                    </div>

                    <div className={`absolute bottom-4 right-1 w-11 h-11 rounded-full flex items-center justify-center shadow-md border-[3px] border-white ${role === 'Administrator' ? 'bg-red-500' :
                        role === 'Teacher' ? 'bg-[#00c853]' : 'bg-[#00c853]'
                        }`}>
                        {role === 'Administrator' ? <ShieldCheck size={20} className="text-white" /> :
                            role === 'Teacher' ? <Building2 size={20} className="text-white" /> :
                                <GraduationCap size={20} className="text-white" />}
                    </div>
                </div>

                <h2 className="text-4xl sm:text-5xl font-black text-[#0f172a] uppercase tracking-tight text-center relative group">
                    {editingField === 'name' ? (
                        <div className="flex items-center gap-2 justify-center mt-2">
                            <input
                                type="text"
                                className="text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight text-center border-b-4 border-blue-500 bg-transparent focus:outline-none w-full max-w-sm"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                            />
                            <button onClick={() => handleSaveField('name')} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                                <Save size={24} />
                            </button>
                            <button onClick={() => setEditingField(null)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                                <X size={24} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-3">
                            <span>{profile.name}</span>
                            {isAdmin && role === 'Student' && (
                                <button
                                    onClick={() => { setEditingField('name'); setEditValue(profile.name); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl"
                                >
                                    <Edit2 size={20} />
                                </button>
                            )}
                        </div>
                    )}
                </h2>

                <span className={`inline-block mt-4 mb-6 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest ${role === 'Administrator' ? 'bg-red-100 text-red-800' :
                    role === 'Teacher' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#dcfce7] text-[#166534]'
                    }`}>
                    {role}
                </span>

                <div className="flex items-center gap-3 w-full max-w-[280px]">
                    <button className="bg-[#1d4ed8] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 flex-1 hover:shadow-lg active:scale-95 text-lg">
                        <UserPlus size={22} />
                        <span>Connect</span>
                    </button>
                    {isAdmin && role === 'Student' && (
                        <button
                            onClick={handleOpenEditModal}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold p-3.5 rounded-2xl shadow-sm transition-all flex items-center justify-center hover:shadow-md active:scale-95"
                            aria-label="Edit Profile"
                        >
                            <Edit2 size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Middle Area - Details Card */}
            <div className="w-full max-w-2xl mx-auto mb-12">
                <div className="bg-[#f8fafc] rounded-[2rem] p-8 sm:p-10 border border-gray-100 shadow-sm space-y-7">
                    {/* Items vertical stack */}
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white rounded-[1.25rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-500 shrink-0 border border-gray-100 flex items-center justify-center">
                            <Mail size={22} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Address</span>
                            <span className="text-[#0f172a] font-semibold text-lg">{profile.email}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 group">
                        <div className="w-14 h-14 bg-white rounded-[1.25rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-500 shrink-0 border border-gray-100 flex items-center justify-center">
                            {role === 'Student' ? <GraduationCap size={22} /> : <Building2 size={22} />}
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Department</span>
                            {editingField === 'department' ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="text"
                                        className="text-[#0f172a] font-semibold text-lg border-b-2 border-blue-500 bg-transparent focus:outline-none w-full"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={() => handleSaveField('department')} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                                        <Save size={18} />
                                    </button>
                                    <button onClick={() => setEditingField(null)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-[#0f172a] font-semibold text-lg">{profile.department || 'N/A'}</span>
                                    {isAdmin && role === 'Student' && (
                                        <button
                                            onClick={() => { setEditingField('department'); setEditValue(profile.department || ''); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {profile.enrollmentId && (
                        <div className="flex items-center gap-6 group">
                            <div className="w-14 h-14 bg-white rounded-[1.25rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-500 shrink-0 border border-gray-100 flex items-center justify-center">
                                <Hash size={22} />
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Enrollment No.</span>
                                {editingField === 'enrollmentId' ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="text"
                                            className="text-[#0f172a] font-bold text-lg border-b-2 border-blue-500 bg-transparent focus:outline-none w-full"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => handleSaveField('enrollmentId')} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                                            <Save size={18} />
                                        </button>
                                        <button onClick={() => setEditingField(null)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#0f172a] font-bold text-lg">{profile.enrollmentId}</span>
                                        {isAdmin && role === 'Student' && (
                                            <button
                                                onClick={() => { setEditingField('enrollmentId'); setEditValue(profile.enrollmentId); }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-200 pt-8 mt-6">
                        <div className="flex flex-col w-full mb-6">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">System ID</span>
                            <span className="text-gray-500 font-mono text-sm break-all bg-[#f1f5f9] px-4 py-3 rounded-xl inline-block w-full">
                                {profile._id || profile.id}
                            </span>
                        </div>
                        <div className="w-full text-left pt-2">
                            <p className="text-[13px] font-semibold text-gray-500 italic">
                                {formatDateIST(profile.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exams Section Full Width */}
            {exams && exams.length > 0 && (
                <div className="w-full mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                            {role === 'Teacher' ? 'Created Exams' : 'Enrolled Exams'}
                        </h3>
                        {role === 'Teacher' && totalCreatedExams > 0 && (
                            <span className="text-sm font-black bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                Total: {totalCreatedExams}
                            </span>
                        )}
                    </div>
                    <div className="space-y-4">
                        {exams.map((exam: any, idx) => {
                            const examDate = new Date(exam.examTime);
                            const isScheduled = examDate.getTime() > Date.now();
                            const formattedDate = `${examDate.getDate().toString().padStart(2, '0')} ${examDate.toLocaleString('default', { month: 'short' }).toUpperCase()} ${examDate.getFullYear()}, ${examDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

                            return (
                                <div key={exam._id || idx} className="bg-white rounded-xl border border-gray-200 flex flex-col md:flex-row shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 hidden md:block transition-colors ${isScheduled ? 'bg-teal-500' : 'bg-gray-500'}`}></div>
                                    <div className="p-4 md:p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 md:pl-6 relative z-20">
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-[#1e293b] text-[17px] tracking-tight uppercase mb-2">
                                                {exam.name}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                <span className={`px-2 py-0.5 rounded-sm shadow-sm whitespace-nowrap ${isScheduled ? 'bg-teal-50 text-teal-700' : 'bg-[#f1f5f9] text-[#334155]'}`}>
                                                    CLASS • {isScheduled ? 'SCHEDULED' : 'COMPLETED'}
                                                </span>
                                                <span className="whitespace-nowrap">{formattedDate} • 180 MINS</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-2 md:mt-0 lg:border-l lg:border-gray-100 lg:pl-6">
                                            {exam.creatorId && role === 'Student' && (
                                                <span className="text-[13px] text-gray-500 flex items-center gap-2 font-medium">
                                                    Created by {exam.creatorId.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* Admin Delete Action */}
            {isAdmin && role === 'Student' && (
                <div className="w-full flex justify-center pb-8 mt-4">
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border-2 border-red-200 hover:border-red-600 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1"
                    >
                        <Trash2 size={24} />
                        <span>Delete Student Account</span>
                    </button>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight">Edit Student Profile</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Update profile information</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-gray-800"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-gray-800"
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                                <input
                                    type="text"
                                    value={editFormData.department}
                                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-gray-800"
                                    placeholder="Enter department"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                <input
                                    type="password"
                                    value={editFormData.password}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-gray-800"
                                    placeholder="Leave blank to keep current"
                                />
                                <p className="text-[10px] text-gray-400 font-medium ml-1 mt-1">Only specify if changing the user's password.</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAllFields}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Update Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} className="text-red-600" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Delete Account?</h3>
                        <p className="text-gray-500 font-medium mb-8">
                            Are you absolutely sure you want to delete <strong className="text-gray-800">{profile.name}</strong>? This action cannot be undone and will permanently remove all associated data.
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDeleteAccount}
                                className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
