import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Edit2, Save, X, UserPlus, GraduationCap, Building2, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const initialUser = {
    "_id": "69a0e3edd792746b2bc8094a",
    "name": "Chiradeep Mukherjee",
    "email": "chiradeepmukherjee@uem.edu.in",
    "department": "CST-CSIT-CSE(CS)-CSE(NW)",
    "admin": true,
    "createdAt": "2026-02-27T00:23:09.487Z",
    "updatedAt": "2026-02-27T00:34:43.153Z",
    "__v": 0
};

export default function Profile() {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('teacherProfile');
        return stored ? JSON.parse(stored) : initialUser;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(() => {
        const storedUser = localStorage.getItem('teacherProfile') ? JSON.parse(localStorage.getItem('teacherProfile')!) : initialUser;
        return { name: storedUser.name, department: storedUser.department, email: storedUser.email };
    });
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const navigate = useNavigate();

    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Add Teacher State
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
    const [addingTeacher, setAddingTeacher] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [teacherStatus, setTeacherStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [teacherError, setTeacherError] = useState('');
    const [teacherForm, setTeacherForm] = useState({
        name: '', email: '', password: '', department: '', admin: false
    });

    const [studentMode, setStudentMode] = useState<'batch' | 'manual'>('batch');
    const [addingStudent, setAddingStudent] = useState(false);
    const [studentStatus, setStudentStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [studentError, setStudentError] = useState('');
    const [showStudentConfirmModal, setShowStudentConfirmModal] = useState(false);
    const [studentForm, setStudentForm] = useState({
        enrollmentId: '', name: '', email: '', password: '', department: '', section: '', roll: ''
    });

    const handleSaveProfile = async () => {
        const token = localStorage.getItem('token') || '';

        try {
            if (editForm.name !== user.name) {
                await api.auth.updateProfile(token, 'name', editForm.name);
            }
            if (editForm.department !== user.department) {
                await api.auth.updateProfile(token, 'department', editForm.department);
            }
            if (editForm.email !== user.email) {
                await api.auth.updateProfile(token, 'email', editForm.email);
            }

            const updatedUser = { ...user, name: editForm.name, department: editForm.department, email: editForm.email };
            setUser(updatedUser);
            localStorage.setItem('teacherProfile', JSON.stringify(updatedUser));
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Failed to update profile changes.");
        }
    };

    const handleCancelEdit = () => {
        setEditForm({ name: user.name, department: user.department, email: user.email });
        setIsEditing(false);
    };

    const handleDeleteAccount = async () => {
        const token = localStorage.getItem('token') || '';

        try {
            await api.auth.deleteAccount(token);
            localStorage.removeItem('token');
            localStorage.removeItem('teacherProfile');
            navigate('/');
        } catch (error) {
            console.error('Delete account failed:', error);
            alert('Failed to delete account.');
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const formatDateIST = (isoString: string) => {
        const date = new Date(isoString);
        const options: Intl.DateTimeFormatOptions = {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return `Account created with ${date.toLocaleString('en-IN', options).replace(' at ', ' ')}`;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if excel
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            setUploadStatus('error');
            setErrorMessage('Please upload a valid Excel file (.xlsx or .xls)');
            return;
        }

        try {
            setUploading(true);
            setUploadStatus('idle');
            setErrorMessage('');

            await api.admin.uploadStudents(file);

            setUploadStatus('success');
            setTimeout(() => setUploadStatus('idle'), 3000);
        } catch (error: any) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setErrorMessage(error.message || 'Failed to upload students. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const handleAddTeacher = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const confirmAddTeacher = async () => {
        setShowConfirmModal(false);
        try {
            setAddingTeacher(true);
            setTeacherStatus('idle');
            setTeacherError('');

            await api.auth.addTeacher(teacherForm);

            setTeacherStatus('success');
            setTeacherForm({ name: '', email: '', password: '', department: '', admin: false });
            setTimeout(() => setTeacherStatus('idle'), 3000);
        } catch (error: any) {
            console.error('Add teacher failed:', error);
            setTeacherStatus('error');
            setTeacherError(error.message || 'Failed to add teacher. Please try again.');
        } finally {
            setAddingTeacher(false);
        }
    };

    const handleAddStudentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowStudentConfirmModal(true);
    };

    const confirmAddStudent = async () => {
        setShowStudentConfirmModal(false);
        try {
            setAddingStudent(true);
            setStudentStatus('idle');
            setStudentError('');

            await api.auth.addStudent(studentForm);

            setStudentStatus('success');
            setStudentForm({ enrollmentId: '', name: '', email: '', password: '', department: '', section: '', roll: '' });
            setTimeout(() => setStudentStatus('idle'), 3000);
        } catch (error: any) {
            console.error('Add student failed:', error);
            setStudentStatus('error');
            setStudentError(error.message || 'Failed to add student. Please try again.');
        } finally {
            setAddingStudent(false);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full animate-in fade-in duration-300">
                <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight mb-8">User Profile</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side - Profile Details */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 flex-1 border-t-4 border-red-700">
                        <div className="flex flex-col items-center">
                            {/* Profile Picture */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-red-900 flex items-center justify-center shadow-lg mb-6 border-4 border-white outline outline-2 outline-gray-200">
                                    <span className="text-5xl font-black text-yellow-500 tracking-tighter shadow-sm">{getInitials(user.name)}</span>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="text-center w-full space-y-4 relative">
                                {user.admin && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="absolute -top-16 right-0 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center shadow-sm"
                                        title="Edit Profile"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                )}

                                <div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="text-3xl font-black text-gray-900 uppercase tracking-tight text-center w-full border-b-2 border-blue-500 focus:outline-none bg-blue-50/50 rounded-t-lg px-2 py-1"
                                        />
                                    ) : (
                                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{user.name}</h2>
                                    )}
                                    <span className="inline-block mt-2 px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {user.admin ? 'Administrator' : 'Teacher'}
                                    </span>
                                </div>

                                <div className="w-full bg-gray-50 rounded-2xl p-6 mt-6 border border-gray-100 space-y-4 text-left">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</span>
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="w-full border-2 border-blue-200 focus:border-blue-500 focus:outline-none bg-white rounded-lg px-3 py-2 font-semibold text-gray-900"
                                            />
                                        ) : (
                                            <span className="text-gray-900 font-semibold">{user.email}</span>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Department</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.department}
                                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                                className="w-full border-2 border-blue-200 focus:border-blue-500 focus:outline-none bg-white rounded-lg px-3 py-2 font-semibold text-gray-900"
                                            />
                                        ) : (
                                            <span className="text-gray-900 font-semibold">{user.department}</span>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">User ID</span>
                                        <span className="text-gray-600 font-mono text-sm">{user._id}</span>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-center gap-3 pt-2">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="flex items-center gap-2 px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                                        >
                                            <X size={18} /> Cancel
                                        </button>
                                        <button
                                            onClick={() => setShowSaveConfirm(true)}
                                            className="flex items-center gap-2 px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-md"
                                        >
                                            <Save size={18} /> Save
                                        </button>
                                    </div>
                                )}

                                {!isEditing && (
                                    <div className="pt-4 text-center flex flex-col items-center gap-4">
                                        <p className="text-sm font-medium text-gray-500 italic">
                                            {formatDateIST(user.createdAt)}
                                        </p>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="text-red-600 hover:text-red-700 font-bold text-sm uppercase tracking-wider flex items-center gap-1 transition-colors group"
                                        >
                                            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                            <span className="underline underline-offset-4 decoration-red-200 group-hover:decoration-red-600 transition-colors">Delete Account</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Add Student/Teacher Component */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 flex-1 flex flex-col border-t-4 border-blue-700 w-full lg:max-w-md">

                        {/* Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                            <button
                                onClick={() => setActiveTab('student')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${activeTab === 'student'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <GraduationCap size={18} /> Student
                            </button>
                            <button
                                onClick={() => setActiveTab('teacher')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${activeTab === 'teacher'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Building2 size={18} /> Teacher
                            </button>
                        </div>

                        {activeTab === 'student' ? (
                            <>
                                <div className="mb-6 border-b border-gray-100 pb-4 flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                            {studentMode === 'batch' ? <FileSpreadsheet size={24} /> : <UserPlus size={24} />}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Add Student</h2>
                                            <p className="text-sm text-gray-500 font-medium">{studentMode === 'batch' ? 'Batch upload student accounts' : 'Create a new student account manually'}</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-gray-50 p-1 rounded-lg w-full max-w-sm">
                                        <button
                                            onClick={() => setStudentMode('batch')}
                                            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${studentMode === 'batch' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Batch Upload
                                        </button>
                                        <button
                                            onClick={() => setStudentMode('manual')}
                                            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${studentMode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Manual Entry
                                        </button>
                                    </div>
                                </div>

                                {studentMode === 'batch' ? (
                                    <div className="flex-1 flex flex-col justify-center items-center animate-in fade-in zoom-in duration-300">
                                        <div
                                            className={`w-full border-2 border-dashed rounded-2xl p-8 transition-colors text-center ${uploadStatus === 'error' ? 'border-red-300 bg-red-50' :
                                                uploadStatus === 'success' ? 'border-green-300 bg-green-50' :
                                                    'border-blue-200 bg-blue-50/30 hover:bg-blue-50'
                                                }`}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept=".xlsx, .xls"
                                                className="hidden"
                                                id="excel-upload"
                                            />

                                            <label
                                                htmlFor="excel-upload"
                                                className="cursor-pointer flex flex-col items-center justify-center w-full h-full space-y-4 min-h-[150px]"
                                            >
                                                {uploadStatus === 'success' ? (
                                                    <CheckCircle2 size={48} className="text-green-500 mb-2" />
                                                ) : uploadStatus === 'error' ? (
                                                    <AlertCircle size={48} className="text-red-500 mb-2" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
                                                        <Upload size={28} className="text-blue-600" />
                                                    </div>
                                                )}

                                                <div className="space-y-1">
                                                    {uploading ? (
                                                        <p className="text-lg font-bold text-gray-700">Uploading...</p>
                                                    ) : uploadStatus === 'success' ? (
                                                        <>
                                                            <p className="text-lg font-bold text-green-700">Upload Successful!</p>
                                                            <p className="text-sm text-green-600">Students have been added to the system.</p>
                                                        </>
                                                    ) : uploadStatus === 'error' ? (
                                                        <>
                                                            <p className="text-lg font-bold text-red-700">Upload Failed</p>
                                                            <p className="text-sm text-red-600 max-w-xs">{errorMessage}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-lg font-bold text-blue-900">Click to browse files</p>
                                                            <p className="text-sm text-gray-500">Supported formats: .xlsx, .xls</p>
                                                        </>
                                                    )}
                                                </div>
                                            </label>
                                        </div>

                                        {uploadStatus === 'idle' && !uploading && (
                                            <div className="mt-8 bg-gray-50 p-4 rounded-xl w-full border border-gray-100">
                                                <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">Instructions:</h4>
                                                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                                                    <li>Ensure the file has columns for Name, Email, and Department.</li>
                                                    <li>First row should be the header.</li>
                                                    <li>Emails must be unique and valid.</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleAddStudentSubmit} className="flex-1 flex flex-col space-y-4 animate-in fade-in zoom-in duration-300 overflow-y-auto pr-2 pb-2 custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Enrollment ID</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={studentForm.enrollmentId}
                                                    onChange={e => setStudentForm({ ...studentForm, enrollmentId: e.target.value })}
                                                    className="w-full border border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-lg px-3 py-2 font-medium text-sm text-gray-900 transition-colors"
                                                    placeholder="120240036008"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={studentForm.name}
                                                    onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                                                    className="w-full border border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-lg px-3 py-2 font-medium text-sm text-gray-900 transition-colors"
                                                    placeholder="Student Name"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={studentForm.email}
                                                    onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                                                    className="w-full border border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-lg px-3 py-2 font-medium text-sm text-gray-900 transition-colors"
                                                    placeholder="Email Address"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={studentForm.password}
                                                    onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                                                    className="w-full border border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-lg px-3 py-2 font-medium text-sm text-gray-900 transition-colors"
                                                    placeholder="Secure password"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Department</label>
                                            <input
                                                type="text"
                                                required
                                                value={studentForm.department}
                                                onChange={e => setStudentForm({ ...studentForm, department: e.target.value })}
                                                className="w-full border border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-lg px-3 py-2 font-medium text-sm text-gray-900 transition-colors"
                                                placeholder="CST-CSIT-CSE(CS)-CSE(NW)"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Section</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={studentForm.section}
                                                    onChange={e => setStudentForm({ ...studentForm, section: e.target.value })}
                                                    className="w-full border border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-lg px-3 py-2 font-medium text-sm text-gray-900 transition-colors"
                                                    placeholder="2A"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Roll</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={studentForm.roll}
                                                    onChange={e => setStudentForm({ ...studentForm, roll: e.target.value })}
                                                    className="w-full border border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-lg px-3 py-2 font-medium text-sm text-gray-900 transition-colors"
                                                    placeholder="07"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            {studentStatus === 'success' && (
                                                <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium animate-in fade-in">
                                                    Student created successfully!
                                                </div>
                                            )}
                                            {studentStatus === 'error' && (
                                                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-in fade-in">
                                                    {studentError}
                                                </div>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={addingStudent}
                                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {addingStudent ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <><UserPlus size={18} /> Add Student</>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="mb-6 border-b border-gray-100 pb-4 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <UserPlus size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Add Teacher</h2>
                                        <p className="text-sm text-gray-500 font-medium">Create a new teacher account manually</p>
                                    </div>
                                </div>

                                <form onSubmit={handleAddTeacher} className="flex-1 flex flex-col space-y-4 animate-in fade-in zoom-in duration-300">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={teacherForm.name}
                                            onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                                            className="w-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-xl px-4 py-2 font-medium text-gray-900 transition-colors"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={teacherForm.email}
                                            onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                                            className="w-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-xl px-4 py-2 font-medium text-gray-900 transition-colors"
                                            placeholder="Email Address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={teacherForm.password}
                                            onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                                            className="w-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-xl px-4 py-2 font-medium text-gray-900 transition-colors"
                                            placeholder="Secure password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Department</label>
                                        <input
                                            type="text"
                                            required
                                            value={teacherForm.department}
                                            onChange={e => setTeacherForm({ ...teacherForm, department: e.target.value })}
                                            className="w-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white rounded-xl px-4 py-2 font-medium text-gray-900 transition-colors"
                                            placeholder="Department Name"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 ml-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="isAdmin"
                                            checked={teacherForm.admin}
                                            onChange={e => setTeacherForm({ ...teacherForm, admin: e.target.checked })}
                                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                        />
                                        <label htmlFor="isAdmin" className="text-sm font-bold text-gray-700 cursor-pointer">
                                            Grant Administrator Access
                                        </label>
                                    </div>

                                    <div className="pt-2 mt-auto">
                                        {teacherStatus === 'success' && (
                                            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 font-medium">
                                                <CheckCircle2 size={20} className="text-green-500" />
                                                Teacher added successfully!
                                            </div>
                                        )}
                                        {teacherStatus === 'error' && (
                                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl flex flex-col font-medium">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle size={20} className="text-red-500" />
                                                    Error adding teacher
                                                </div>
                                                <span className="text-sm mt-1 ml-7">{teacherError}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={addingTeacher || teacherStatus === 'success'}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wider"
                                        >
                                            {addingTeacher ? 'Creating...' : (
                                                <>
                                                    <UserPlus size={20} />
                                                    Add Teacher
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>

                {/* Add Teacher Confirmation Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 translate-y-0 scale-100 opacity-100 animate-in fade-in slide-in-from-bottom-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <UserPlus size={36} className="text-blue-600 ml-2" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Confirm Teacher</h3>
                                <p className="text-gray-500 mb-6 px-4 text-sm font-medium">
                                    Are you sure you want to add a new teacher account with the following details?
                                </p>

                                <div className="bg-gray-50 rounded-2xl p-5 text-left mb-8 border border-gray-100 space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</span>
                                        <span className="text-base text-gray-900 font-bold">{teacherForm.name}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</span>
                                        <span className="text-sm text-gray-900 font-semibold">{teacherForm.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-200 mt-2 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</span>
                                            <span className="text-sm text-gray-900 font-bold">{teacherForm.department}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Role</span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${teacherForm.admin ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                                {teacherForm.admin ? 'Administrator' : 'Teacher'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setShowConfirmModal(false)}
                                        className="flex-1 py-3 px-6 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors uppercase text-sm tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmAddTeacher}
                                        className="flex-1 py-3 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-white transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase text-sm tracking-widest"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Profile Confirmation Modal */}
                {showSaveConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowSaveConfirm(false)}>
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 translate-y-0 scale-100 opacity-100 animate-in fade-in zoom-in border border-blue-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Save Profile?</h3>
                                <p className="text-gray-500 mb-8 font-medium">Are you sure you want to save the new profile details?</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowSaveConfirm(false)}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors uppercase text-sm tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSaveProfile();
                                            setShowSaveConfirm(false);
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-600/20 uppercase text-sm tracking-wider"
                                    >
                                        Yes, Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Account Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteConfirm(false)}>
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 translate-y-0 scale-100 opacity-100 animate-in fade-in zoom-in border border-red-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 text-center bg-red-50/30">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-red-900 mb-2 uppercase tracking-tight">Delete Account?</h3>
                                <p className="text-red-700/80 mb-8 font-medium">
                                    Are you absolutely sure you want to permanently delete your account? <br />
                                    <strong className="text-red-800">This action cannot be undone.</strong>
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors uppercase text-sm tracking-wider shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-red-600/30 uppercase text-sm tracking-wider transform hover:-translate-y-0.5"
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Add Student Confirmation Modal */}
                {showStudentConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 translate-y-0 scale-100 opacity-100 animate-in fade-in slide-in-from-bottom-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <UserPlus size={36} className="text-blue-600 ml-2" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Confirm Student</h3>
                                <p className="text-gray-500 mb-6 px-4 text-sm font-medium">
                                    Are you sure you want to create a new student account?
                                </p>

                                <div className="bg-gray-50 rounded-2xl p-5 text-left mb-8 border border-gray-100 space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</span>
                                        <span className="text-base text-gray-900 font-bold">{studentForm.name}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrollment ID</span>
                                            <span className="text-sm text-gray-900 font-bold">{studentForm.enrollmentId}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Roll</span>
                                            <span className="text-sm text-gray-900 font-bold">{studentForm.roll}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</span>
                                        <span className="text-sm text-gray-900 font-semibold">{studentForm.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-200 mt-2 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department & Sec</span>
                                            <span className="text-sm text-gray-900 font-bold">
                                                {studentForm.department} <br />
                                                <span className="text-gray-500 font-medium">Sec: {studentForm.section}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setShowStudentConfirmModal(false)}
                                        className="flex-1 py-3 px-6 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors uppercase text-sm tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmAddStudent}
                                        className="flex-1 py-3 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-white transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase text-sm tracking-widest"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
