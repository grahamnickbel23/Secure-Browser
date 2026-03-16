import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Users, Upload, Trash2, Search, Filter, Download, UserPlus, FileSpreadsheet, LogOut } from 'lucide-react';
import { mockStudents, Student } from '../data';
import { api } from '../services/api'; // Import API service

// Mock Teachers Data
const mockTeachers = [
  { id: 'T001', name: 'Dr. Sarah Johnson', department: 'CSE', email: 'sarah.j@uem.edu.in', subject: 'Data Structures' },
  { id: 'T002', name: 'Prof. Michael Chen', department: 'ECE', email: 'michael.c@uem.edu.in', subject: 'Digital Electronics' },
  { id: 'T003', name: 'Dr. Emily Davis', department: 'ME', email: 'emily.d@uem.edu.in', subject: 'Thermodynamics' },
];

type Teacher = typeof mockTeachers[0];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadMode, setUploadMode] = useState<'add' | 'delete'>('add');
  const [loading, setLoading] = useState(false);

  // API Integration: Fetch Data on Mount
  /*
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsData, teachersData] = await Promise.all([
          api.admin.getStudents(),
          api.admin.getTeachers()
        ]);
        setStudents(studentsData);
        setTeachers(teachersData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  */

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // API Integration: Upload File
    /*
    try {
      setLoading(true);
      if (activeTab === 'students') {
        const response = await api.admin.uploadStudents(file);
        alert(`Successfully processed students: ${response.message}`);
        // Refresh list
        const updatedStudents = await api.admin.getStudents();
        setStudents(updatedStudents);
      } else {
        const response = await api.admin.uploadTeachers(file);
        alert(`Successfully processed teachers: ${response.message}`);
        // Refresh list
        const updatedTeachers = await api.admin.getTeachers();
        setTeachers(updatedTeachers);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
    return; // Stop execution of mock logic below if API is active
    */

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (uploadMode === 'add') {
        if (activeTab === 'students') {
          // Map excel data to Student type (simplified for demo)
          const newStudents = data.map((row: any, index: number) => ({
            id: row.id || `${Date.now()}-${index}`,
            name: row.name || 'Unknown',
            rollNo: row.rollNo || 'N/A',
            department: row.department || 'General',
            year: row.year || '1st',
            section: row.section || 'A',
            email: row.email || '',
            enrollment: row.enrollment || '',
            status: 'Offline',
            lastActivity: 'Never',
            examId: ''
          } as Student));
          setStudents(prev => [...prev, ...newStudents]);
          alert(`Successfully added ${newStudents.length} students.`);
        } else {
          const newTeachers = data.map((row: any, index: number) => ({
            id: row.id || `${Date.now()}-${index}`,
            name: row.name || 'Unknown',
            department: row.department || 'General',
            email: row.email || '',
            subject: row.subject || 'N/A'
          } as Teacher));
          setTeachers(prev => [...prev, ...newTeachers]);
          alert(`Successfully added ${newTeachers.length} teachers.`);
        }
      } else {
        // Delete Mode
        const idsToDelete = new Set(data.map((row: any) => row.id));
        if (activeTab === 'students') {
          const initialCount = students.length;
          setStudents(prev => prev.filter(s => !idsToDelete.has(s.id)));
          alert(`Successfully deleted ${initialCount - students.length} students.`);
        } else {
          const initialCount = teachers.length;
          setTeachers(prev => prev.filter(t => !idsToDelete.has(t.id)));
          alert(`Successfully deleted ${initialCount - teachers.length} teachers.`);
        }
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      // API Integration: Delete Account
      /*
      try {
        setLoading(true);
        if (activeTab === 'students') {
          await api.admin.deleteStudent(id);
          setStudents(prev => prev.filter(s => s.id !== id));
        } else {
          await api.admin.deleteTeacher(id);
          setTeachers(prev => prev.filter(t => t.id !== id));
        }
        alert('Account deleted successfully');
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete account.');
      } finally {
        setLoading(false);
      }
      return;
      */

      if (activeTab === 'students') {
        setStudents(prev => prev.filter(s => s.id !== id));
      } else {
        setTeachers(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      navigate('/admin-login');
    }
  };

  // Filter Logic
  const filteredData = activeTab === 'students'
    ? students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()))
    : teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.department.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 text-white p-2 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">User Management System</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-bold text-sm uppercase tracking-wider transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>

      <div className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-black text-gray-900">{students.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-xl text-purple-600">
              <UserPlus size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Teachers</p>
              <h3 className="text-2xl font-black text-gray-900">{teachers.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-xl text-green-600">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Status</p>
              <h3 className="text-2xl font-black text-gray-900">Active</h3>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Toolbar */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-50/50">

            {/* Tabs */}
            <div className="flex bg-gray-200 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab('teachers')}
                className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'teachers' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Teachers
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">

              <label className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm uppercase tracking-wider shadow-md transition-transform hover:scale-105 ${activeTab === 'students' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}>
                <Upload size={18} />
                {activeTab === 'students' ? 'Upload Students' : 'Upload Teachers'}
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {activeTab === 'students' ? (
                    <>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Roll No</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Section</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider ">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length > 0 ? (
                  filteredData.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      {activeTab === 'students' ? (
                        <>
                          <td className="p-6 font-mono text-sm text-gray-600">{item.id}</td>
                          <td className="p-6 font-bold text-gray-900">{item.name}</td>
                          <td className="p-6 font-mono text-sm text-gray-600">{item.rollNo}</td>
                          <td className="p-6 text-sm text-gray-600">{item.department}</td>
                          <td className="p-6 text-sm text-gray-600">{item.year}</td>
                          <td className="p-6 text-sm text-gray-600">{item.section}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-6 font-mono text-sm text-gray-600">{item.id}</td>
                          <td className="p-6 font-bold text-gray-900">{item.name}</td>
                          <td className="p-6 text-sm text-gray-600">{item.email}</td>
                          <td className="p-6 text-sm text-gray-600">{item.department}</td>
                          <td className="p-6 text-sm text-gray-600">{item.subject}</td>
                        </>
                      )}
                      <td className="p-6 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-600 px-3 py-2 rounded-lg transition-all font-bold text-xs uppercase tracking-wider border border-red-200 hover:border-red-600 shadow-sm"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">
                      No {activeTab} found. Try uploading a file or changing filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
