import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useExams } from '../context/ExamContext';
import { ArrowLeft, Users, Play, Square, Edit3, Save, X, Search, Filter, RefreshCw, Eye, Monitor, Clock, ExternalLink, AlertCircle, Copy, Check } from 'lucide-react';
import { api } from '../services/api'; // Import API service
import ConfirmDialog from '../components/ConfirmDialog';

export default function ExamClassroom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState<any>(null);

  // Local state for timer
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Student Monitor State
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Depts');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [blockedStudents, setBlockedStudents] = useState<string[]>([]);
  const [unblockConfirmStudent, setUnblockConfirmStudent] = useState<{ enrollment: string; examCode: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    date: '',
    time: '',
    duration: '',
    url: ''
  });

  const fetchExamDetails = async () => {
    if (!id) return;
    try {
      const res: any = await api.exams.read(id);
      if (res.success && res.data) {
        setExamData(res.data);

        // Initialize edit form
        const validDate = res.data.examTime ? new Date(res.data.examTime) : new Date();
        setEditForm({
          name: res.data.name || '',
          date: !isNaN(validDate.getTime()) ? validDate.toISOString().split('T')[0] : '',
          time: !isNaN(validDate.getTime()) ? validDate.toTimeString().slice(0, 5) : '',
          duration: res.data.duration ? Math.floor(res.data.duration / 60).toString() : '',
          url: res.data.url || ''
        });

        const mappedStudents = res.data.students.map((s: any) => ({
          id: s._id,
          examId: res.data._id,
          name: s.name,
          rollNo: s.roll?.toString() || '',
          enrollment: s.enrollmentId?.toString() || '',
          department: s.department || '',
          section: s.section || '',
          year: s.year || '',
          status: 'Offline', // Assuming initial
          lastActivity: 'Never',
          email: s.email
        }));
        setStudents(mappedStudents);
      }
    } catch (error) {
      console.error("Failed to fetch exam:", error);
    }
  };

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!examData || !id) return;
    try {
      if (editForm.name !== examData.name) {
        await api.exams.updateField(id, 'name', editForm.name);
      }
      if (editForm.url !== examData.url) {
        await api.exams.updateField(id, 'url', editForm.url);
      }
      const newDuration = (parseInt(editForm.duration) * 60).toString();
      if (newDuration !== examData.duration?.toString()) {
        await api.exams.updateField(id, 'duration', newDuration);
      }
      const newExamTime = new Date(`${editForm.date}T${editForm.time}`).toISOString();
      if (newExamTime !== examData.examTime) {
        await api.exams.updateField(id, 'examTime', newExamTime);
      }

      setIsEditing(false);
      fetchExamDetails(); // Refresh data to show updated stats
    } catch (error) {
      console.error('Failed to save exam edits:', error);
      alert('Failed to save edits. Please try again.');
    }
  };

  const isActive = examData?.isActive || false;

  // Initialize timer when exam becomes active
  useEffect(() => {
    if (isActive && examData && timeLeft === 0) {
      setTimeLeft(examData.duration * 1000);
    }
  }, [isActive, examData]);

  // Timer countdown local
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 50 && prev > 0) {
            handleEndExam();
            return 0;
          }
          return Math.max(0, prev - 50);
        });
      }, 50);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  // Simulate polling for student status
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setStudents(prev => prev.map(s => ({
        ...s,
        status: Math.random() > 0.8 ? 'Active' : s.status
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleCopyCode = () => {
    if (examData?.code) {
      navigator.clipboard.writeText(examData.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // WebSocket connection for monitoring blocked students
  useEffect(() => {
    if (!isActive) return;

    const wsUrl = `ws://127.0.0.1:8000/monitoring`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established.');
      ws.send(JSON.stringify({
        type: 'join',
        examCode: examData?.code
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'blocked_students' && Array.isArray(message.data)) {
          const blockedIds = message.data.map((student: any) => student.id);
          setBlockedStudents(blockedIds);
        } else if (message.type === 'timer_update' && message.data) {
          const newTime = message.data.timeLeftMs;
          if (typeof newTime === 'number' && newTime > 0) {
            setTimeLeft(newTime);
          } else if (typeof newTime === 'number' && newTime <= 0) {
            setTimeLeft(0);
            handleEndExam();
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed.');
    };

    return () => {
      ws.close();
    };
  }, [isActive]);

  const handleStartExam = async () => {
    if (examData) {
      try {
        const res: any = await api.exams.start(id || examData._id);
        if (res.success) {
          const duration = res.data?.duration || examData.duration;
          setTimeLeft(duration * 1000);
          setExamData({ ...examData, isActive: true, duration });
        }
      } catch (error) {
        console.error('Failed to start exam:', error);
        alert('Failed to start exam. Please try again.');
      }
    }
  };

  const handleEndExam = async () => {
    if (examData) {
      try {
        const res: any = await api.exams.stop(id || examData._id);
        if (res.success) {
          setTimeLeft(0);
          setExamData({ ...examData, isActive: false });
        }
      } catch (error) {
        console.error('Failed to end exam:', error);
        alert('Failed to stop exam. Please try again.');
      }
    }
  };

  const renderSpeedometer = () => {
    const totalDurationMs = (examData?.duration || 7200) * 1000;
    const progressPercentage = Math.max(0, Math.min(100, (timeLeft / totalDurationMs) * 100));

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center mt-4">
        <div className="flex flex-col items-center justify-center mb-8">
          <span className="text-6xl sm:text-7xl font-black text-gray-800 tracking-tighter tabular-nums drop-shadow-sm">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">
            Remaining
          </span>
        </div>
        
        {/* Straight line gauge */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-red-500 transition-all duration-75 ease-linear"
            style={{ width: `${isNaN(progressPercentage) ? 0 : progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  const formatTime = (milliseconds: number) => {
    const mins = Math.floor(milliseconds / 60000);
    const secs = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

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

  if (!examData) return <div>Loading...</div>;

  const examStatusText: string = isActive ? 'Active' : 'Scheduled'; // or Completed based on your logic
  const durationInMins = examData.duration ? Math.floor(examData.duration / 60) : 0;
  const displayDate = new Date(examData.examTime).toLocaleString();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">Exam Classroom</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Card */}
        {!isActive && (
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className={`p-8 text-white relative overflow-hidden transition-colors duration-500 ${isActive ? 'bg-green-500' : 'bg-blue-600'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex-1 mr-4">
                  {isEditing ? (
                    <div className="space-y-4 max-w-lg mb-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-white/20 border border-white/30 text-white placeholder-white/50 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white font-black text-2xl uppercase tracking-wider"
                      />
                      <div className="flex gap-4">
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                          className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white font-medium"
                        />
                        <input
                          type="time"
                          value={editForm.time}
                          onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                          className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white font-medium"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black uppercase tracking-wider">{examData.name}</h2>
                      <p className="text-white/80 font-medium mt-2">Exam Scheduled At : {displayDate}</p>
                    </>
                  )}
                </div>
                {isActive && (
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 flex items-center gap-2 animate-pulse">
                    <Clock size={20} />
                    <span className="font-mono font-bold text-xl">{formatTime(timeLeft)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-700 font-medium leading-relaxed">{examData.description}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Exam URL</h3>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.url}
                    onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm font-mono"
                  />
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-xl text-sm font-mono truncate flex items-center">
                      {examData.url}
                    </div>
                    <a
                      href={examData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-colors text-sm whitespace-nowrap"
                    >
                      <ExternalLink size={16} /> Open Exam Link
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Code</h4>
                  <p className="text-xl font-black text-gray-800">{examData.code}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</h4>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={editForm.duration}
                        onChange={e => setEditForm({ ...editForm, duration: e.target.value })}
                        className="w-24 bg-white border border-gray-300 text-gray-900 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      />
                      <span className="text-gray-500 font-bold text-sm">Mins</span>
                    </div>
                  ) : (
                    <p className="text-xl font-black text-gray-800">{durationInMins} Mins</p>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</h4>
                  <p className={`text-xl font-black ${isActive ? 'text-green-600' : 'text-gray-800'}`}>
                    {examStatusText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Actions Card */}
        <div className={isActive ? "lg:col-span-3 space-y-4 w-full" : "space-y-4"}>
          {isActive ? (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100 flex flex-col items-center justify-center animate-in zoom-in duration-300">
              <h3 className="text-xl font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                Exam in Progress
              </h3>

              {renderSpeedometer()}

              <div className="mt-8 flex flex-col md:flex-row w-full max-w-2xl gap-6">
                <div className="flex-1 text-center bg-gray-50 py-4 rounded-2xl border border-gray-100 flex flex-col justify-center relative group cursor-pointer hover:bg-white transition-colors hover:shadow-sm" onClick={handleCopyCode} title="Copy Exam Code">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Exam Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-black text-gray-900 tracking-widest">{examData?.code}</p>
                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors bg-gray-100 group-hover:bg-blue-50 p-2 rounded-xl">
                      {isCopied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </div>
                  </div>
                  {isCopied && <span className="absolute top-2 right-4 text-[10px] font-bold text-green-500 uppercase tracking-wider animate-bounce">Copied!</span>}
                </div>

                <div className="flex-1 flex">
                  <button
                    onClick={() => setShowEndConfirm(true)}
                    className="w-full py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-3 transition-all transform hover:scale-105 font-black uppercase tracking-widest text-xl bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
                  >
                    <Square size={24} fill="currentColor" />
                    END EXAM
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col h-full">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">
                Control Panel
              </h3>

              <div className="flex-1 flex items-center justify-center text-center px-4 mb-6">
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  Clicking <strong className="text-gray-700">Start Exam</strong> will begin the monitoring session. Once the exam starts, teachers will see a live list of students with their risk scores. Examiners are requested to physically verify students that show a high risk score.
                </p>
              </div>

              <div className="space-y-4 mt-auto">
                {examStatusText !== 'Completed' && (
                  <button
                    onClick={() => setShowStartConfirm(true)}
                    className="w-full py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] font-bold uppercase tracking-widest text-sm bg-[#00C853] hover:bg-green-600 text-white"
                  >
                    <Play size={20} fill="currentColor" />
                    Start Exam
                  </button>
                )}

                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowSaveConfirm(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm"
                    >
                      <Save size={18} />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset edits on cancel
                        const validDate = examData.examTime ? new Date(examData.examTime) : new Date();
                        setEditForm({
                          name: examData.name || '',
                          date: !isNaN(validDate.getTime()) ? validDate.toISOString().split('T')[0] : '',
                          time: !isNaN(validDate.getTime()) ? validDate.toTimeString().slice(0, 5) : '',
                          duration: examData.duration ? Math.floor(examData.duration / 60).toString() : '',
                          url: examData.url || ''
                        });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-sm"
                  >
                    <Edit3 size={18} />
                    Edit Details
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student List Section */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight flex items-center gap-2">
            <Users size={24} />
            Student Monitor
          </h3>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Student..."
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
                {!isActive && (
                  <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Email</th>
                )}
                {isActive && (
                  <>
                    <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Activity</th>
                    <th className="p-6 text-xs font-black text-gray-500 uppercase tracking-wider">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/other-profiles/${student.enrollment}`, { state: { type: 'student' } })}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-6 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{index + 1}</td>
                    <td className="p-6 font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{student.name}</td>
                    <td className="p-6 font-mono text-sm text-gray-600">{student.enrollment}</td>
                    <td className="p-6 text-gray-600">{student.department}</td>
                    <td className="p-6 text-gray-600">{student.section}</td>
                    <td className="p-6 font-mono text-sm text-gray-600">{student.rollNo}</td>
                    {!isActive && (
                      <td className="p-6 text-gray-600">{student.email}</td>
                    )}
                    {isActive && (
                      <>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${blockedStudents.includes(student.enrollment) ? 'bg-red-100 text-red-800 border-red-200' : getStatusColor(student.status)}`}>
                            {blockedStudents.includes(student.enrollment) ? 'BLOCKED' : student.status}
                          </span>
                        </td>
                        <td className="p-6 text-sm text-gray-500">{student.lastActivity}</td>
                        <td className="p-6 flex gap-2">
                          {blockedStudents.includes(student.enrollment) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUnblockConfirmStudent({ enrollment: student.enrollment, examCode: examData.code });
                              }}
                              className="text-white bg-red-600 hover:bg-red-700 p-2 text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1"
                              title="Unblock Student"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentId(student.id);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                              title="View Screen"
                            >
                              <Eye size={18} />
                              View
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isActive ? 9 : 7} className="p-12 text-center text-gray-400 font-medium">
                    No students found for this exam.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshot Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in" onClick={() => setSelectedStudentId(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl animate-in zoom-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-full text-red-600">
                  <Monitor size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Screen Monitor</h3>
                  <p className="text-xs text-gray-500">Viewing Student ID: {selectedStudentId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentId(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative group">
              <img
                src={`https://picsum.photos/seed/${selectedStudentId}/800/450`}
                alt="Screen"
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      <ConfirmDialog
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={() => {
          handleSaveEdit();
          setShowSaveConfirm(false);
        }}
        title="Save Changes?"
        description="Are you sure you want to save the new exam details?"
        confirmText="Yes, Save"
        icon={<AlertCircle size={32} />}
        colorTheme="blue"
      />

      {/* Start Confirmation Modal */}
      <ConfirmDialog
        isOpen={showStartConfirm}
        onClose={() => setShowStartConfirm(false)}
        onConfirm={() => {
          handleStartExam();
          setShowStartConfirm(false);
        }}
        title="Start Exam?"
        description="Are you sure you want to start monitoring for this exam?"
        confirmText="Yes, Start"
        icon={<Play size={32} />}
        colorTheme="green"
      />

      {/* End Confirmation Modal */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={() => {
          handleEndExam();
          setShowEndConfirm(false);
        }}
        title="End Exam?"
        description="Are you sure you want to stop monitoring? This action cannot be easily undone."
        confirmText="Yes, End"
        icon={<Square size={32} />}
        colorTheme="red"
      />

      {/* Unblock Confirmation Modal */}
      <ConfirmDialog
        isOpen={unblockConfirmStudent !== null}
        onClose={() => setUnblockConfirmStudent(null)}
        onConfirm={() => {
          if (unblockConfirmStudent) {
            api.monitor.unblock(unblockConfirmStudent.enrollment, unblockConfirmStudent.examCode).then(() => {
              setUnblockConfirmStudent(null);
            }).catch(err => {
              console.error(err);
              setUnblockConfirmStudent(null);
            });
          }
        }}
        title="Unblock Student?"
        description="Are you sure you want to unblock this student? This will allow them to resume the examination."
        confirmText="Yes, Unblock"
        icon={<AlertCircle size={32} />}
        colorTheme="blue"
      />
    </div>
  );
}
