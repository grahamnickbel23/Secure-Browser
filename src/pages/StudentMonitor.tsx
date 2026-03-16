import React, { useState, useEffect } from 'react';
import { mockStudents, mockExams } from '../data';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search, Filter } from 'lucide-react';
import { api } from '../services/api'; // Import API service

export default function StudentMonitor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [students, setStudents] = useState(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentExam = id ? mockExams.find(e => e.id === id) : null;

  // API Integration: Fetch Monitor Data
  /*
  useEffect(() => {
    const fetchMonitorData = async () => {
      if (id) {
        try {
          const data = await api.monitor.getExamStatus(id);
          // Update students with real-time data
          // setStudents(data.students);
        } catch (error) {
          console.error('Failed to fetch monitor data:', error);
        }
      }
    };
    // Poll every 5 seconds
    const interval = setInterval(fetchMonitorData, 5000);
    return () => clearInterval(interval);
  }, [id]);
  */

  // Simulate polling
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update statuses for demo
      setStudents(prev => prev.map(s => ({
        ...s,
        status: Math.random() > 0.8 ? 'Active' : s.status
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Suspicious': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Camera Off': return 'bg-red-100 text-red-800 border-red-200';
      case 'Tab Switch': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enrollment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = id ? s.examId === id : true;
    return matchesSearch && matchesExam;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">Student Monitor</h1>
            {currentExam && <p className="text-blue-600 font-bold text-sm uppercase">{currentExam.name} ({currentExam.code})</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Student ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
            <Filter size={20} />
          </button>
          <button className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 shadow-md">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">SL No.</th>
                <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Name</th>
                <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Enrollment</th>
                <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Dept</th>
                <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Section</th>
                <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Roll No.</th>
                <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-6 font-medium text-gray-900">{index + 1}</td>
                    <td className="p-6 font-bold text-gray-800">{student.name}</td>
                    <td className="p-6 font-mono text-sm text-gray-600">{student.enrollment}</td>
                    <td className="p-6 text-gray-600">{student.department}</td>
                    <td className="p-6 text-gray-600">{student.section}</td>
                    <td className="p-6 font-mono text-sm text-gray-600">{student.rollNo}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-6 text-sm text-gray-500">{student.lastActivity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-medium">
                    No students found for this exam.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
