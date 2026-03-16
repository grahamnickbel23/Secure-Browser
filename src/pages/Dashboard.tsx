import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Monitor, LogOut, Trash2, LayoutGrid, List, AlertTriangle, X, Search } from 'lucide-react';
import { useExams } from '../context/ExamContext';
import { api } from '../services/api';

interface DashboardProps {
  filter?: 'Scheduled' | 'Completed' | 'Active';
}

const GRADIENTS = [
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-purple-500 to-pink-600',
  'bg-gradient-to-br from-rose-500 to-orange-500',
  'bg-gradient-to-br from-teal-400 to-emerald-600',
  'bg-gradient-to-br from-amber-500 to-red-500',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
];

const BORDER_COLORS = [
  'hover:border-blue-400',
  'hover:border-purple-400',
  'hover:border-rose-400',
  'hover:border-teal-400',
  'hover:border-amber-400',
  'hover:border-cyan-400',
];

const SOLID_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-cyan-500',
];

const TEXT_HOVER_COLORS = [
  'group-hover:text-blue-700',
  'group-hover:text-purple-700',
  'group-hover:text-rose-700',
  'group-hover:text-teal-700',
  'group-hover:text-amber-700',
  'group-hover:text-cyan-700',
];

const BADGE_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
];

const LIGHT_BG_HOVER = [
  'hover:bg-blue-50/50',
  'hover:bg-purple-50/50',
  'hover:bg-rose-50/50',
  'hover:bg-teal-50/50',
  'hover:bg-amber-50/50',
  'hover:bg-cyan-50/50',
];

export default function Dashboard({ filter }: DashboardProps) {
  const navigate = useNavigate();
  const { deleteExam } = useExams();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [classrooms, setClassrooms] = useState<any[]>(() => {
    const cached = localStorage.getItem('teacherClassrooms');
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    const fetchProfile = async () => {
      let token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token found in localStorage. Attempting with empty token just to show API call.");
        token = ""; // User wants to see the API call happen no matter what.
      }

      try {
        const res: any = await api.auth.profile(token);
        if (res?.success && res.data) {
          localStorage.setItem('teacherProfile', JSON.stringify(res.data.teacher));
          localStorage.setItem('teacherClassrooms', JSON.stringify(res.data.classrooms));
          setClassrooms(res.data.classrooms);
        }
      } catch (error) {
        console.error("Failed to fetch profile API:", error);
      }
    };
    fetchProfile();
  }, []);

  const mappedClassrooms = classrooms.map(c => {
    const dateObj = new Date(c.time || new Date().toISOString());
    const dateFormatted = dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(' at ', ' ');
    const durationMins = Math.round((c.duration || 0) / 60);

    const now = new Date();
    const endTime = new Date(dateObj.getTime() + (c.duration || 0) * 1000);
    let status = 'Scheduled';
    if (now > endTime) status = 'Completed';
    else if (now >= dateObj && now <= endTime) status = 'Active';

    return {
      id: c.id,
      name: c.name,
      status: status,
      code: 'CLASS',
      date: dateFormatted,
      duration: durationMins,
      details: 'Assigned Classroom Assessment'
    };
  });

  const filteredExams = mappedClassrooms
    .filter(e => filter ? e.status === filter : true)
    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const title = filter
    ? `${filter} Exams`
    : 'All Exams';

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExamToDelete(id);
  };

  const confirmDelete = async () => {
    if (examToDelete) {
      try {
        await api.exams.delete(examToDelete);
        const updated = classrooms.filter(c => c.id !== examToDelete && c._id !== examToDelete);
        setClassrooms(updated);
        localStorage.setItem('teacherClassrooms', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to delete exam:', error);
        alert('Failed to delete exam');
      }
      setExamToDelete(null);
    }
  };

  const cancelDelete = () => {
    setExamToDelete(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">{title}</h1>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search exams by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 min-w-[200px] md:min-w-[280px] shadow-sm transition-all text-sm font-medium text-gray-700 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <button
            onClick={() => navigate('/create-exam')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <PlusCircle size={20} />
            Create New Exam
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
          {filteredExams.map((exam, index) => (
            <div
              key={exam.id}
              onClick={() => navigate(`/classroom/${exam.id}`)}
              className={`cursor-pointer bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-80 border-2 border-transparent ${BORDER_COLORS[index % BORDER_COLORS.length]} hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group`}
            >
              <div className={`p-6 text-center relative overflow-hidden ${exam.status === 'Active' ? 'bg-green-500' :
                exam.status === 'Completed' ? 'bg-gray-500' : GRADIENTS[index % GRADIENTS.length]
                }`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider relative z-10">{exam.name}</h3>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white uppercase backdrop-blur-sm shadow-sm border border-white/10">
                  {exam.code} • {exam.status}
                </span>
              </div>

              <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center justify-center text-center space-y-2 group-hover:bg-opacity-50 transition-colors">
                <p className="text-gray-600 font-medium text-sm uppercase tracking-wide">{exam.details}</p>
                <div className="w-12 h-1 bg-gray-200 rounded-full group-hover:scale-x-150 transition-transform duration-300"></div>
                <p className="text-gray-400 font-bold text-xs uppercase">{exam.date} • {exam.duration} MINS</p>
              </div>

              <div className="bg-white flex border-t border-gray-100 mt-auto">
                <button
                  onClick={(e) => handleDelete(exam.id, e)}
                  className="w-full bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-bold py-4 uppercase text-sm transition-all focus:outline-none flex items-center justify-center gap-2 group/btn"
                  title="Delete Exam"
                >
                  <Trash2 size={18} className="transition-transform group-hover/btn:scale-110" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-8">
          {filteredExams.map((exam, index) => (
            <div
              key={exam.id}
              onClick={() => navigate(`/classroom/${exam.id}`)}
              className={`cursor-pointer bg-white rounded-2xl shadow-sm border-2 border-transparent ${BORDER_COLORS[index % BORDER_COLORS.length]} ${LIGHT_BG_HOVER[index % LIGHT_BG_HOVER.length]} hover:shadow-md transition-all duration-300 flex items-center justify-between p-4 group`}
            >
              <div className="flex items-center gap-6 flex-1">
                <div className={`w-2 h-16 rounded-full transition-transform group-hover:scale-y-110 ${exam.status === 'Active' ? 'bg-green-500' :
                  exam.status === 'Completed' ? 'bg-gray-500' : SOLID_COLORS[index % SOLID_COLORS.length]
                  }`} />
                <div className="flex-1">
                  <h3 className={`text-xl font-bold text-gray-800 uppercase tracking-tight transition-colors ${exam.status === 'Active' ? 'group-hover:text-green-700' : exam.status === 'Completed' ? 'group-hover:text-gray-700' : TEXT_HOVER_COLORS[index % TEXT_HOVER_COLORS.length]}`}>{exam.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${exam.status === 'Active' ? 'bg-green-100 text-green-700' :
                      exam.status === 'Completed' ? 'bg-gray-100 text-gray-700' : BADGE_COLORS[index % BADGE_COLORS.length]
                      }`}>
                      {exam.code} • {exam.status}
                    </span>
                    <span className="text-gray-500 text-xs font-semibold uppercase">{exam.date} • {exam.duration} MINS</span>
                  </div>
                </div>
                <div className="hidden md:block flex-1 border-l border-gray-200 pl-6 transition-colors opacity-70 group-hover:opacity-100">
                  <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors">{exam.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-6">
                <button
                  onClick={(e) => handleDelete(exam.id, e)}
                  className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 p-2 rounded-xl transition-colors flex items-center justify-center shadow-sm"
                  title="Delete Exam"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 translate-y-0 scale-100 opacity-100 animate-in fade-in slide-in-from-bottom-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Delete Exam?</h3>
              <p className="text-gray-500 mb-8 px-4">
                Are you sure you want to delete this exam? This is an unrecoverable step and all associated data will be lost forever.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-3 px-6 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors uppercase text-sm tracking-wide"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-6 rounded-xl font-bold bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg text-white transition-all transform hover:scale-105 active:scale-95 uppercase text-sm tracking-wide"
                >
                  Yes, Delete It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
