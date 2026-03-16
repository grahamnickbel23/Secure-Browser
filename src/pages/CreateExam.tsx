import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Copy, Search, Filter, Check, X } from 'lucide-react';
import { mockStudents, Student } from '../data';
import { useExams } from '../context/ExamContext';
import { api } from '../services/api';


export default function CreateExam() {
  const navigate = useNavigate();
  const { addExam } = useExams();

  // Exam Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    details: '',
    date: '',
    time: '',
    duration: '',
    url: '',
  });

  // Student Selection State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    section: ''
  });
  const [studentsData, setStudentsData] = useState<Student[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const json: any = await api.student.getAll();
        if (json.success && json.data) {
          const mapped: Student[] = json.data.map((s: any) => ({
            id: s._id,
            examId: '',
            name: s.name,
            rollNo: s.roll.toString(),
            enrollment: s.enrollmentId.toString(),
            email: s.email,
            department: s.department,
            section: s.section,
            year: '',
            status: 'Offline',
            lastActivity: 'Never'
          }));
          setStudentsData(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
      }
    };
    fetchStudents();
  }, []);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(formData.url);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = (filteredStudents: Student[]) => {
    const allSelected = filteredStudents.every(s => selectedStudents.has(s.id));
    const newSelected = new Set(selectedStudents);

    if (allSelected) {
      filteredStudents.forEach(s => newSelected.delete(s.id));
    } else {
      filteredStudents.forEach(s => newSelected.add(s.id));
    }
    setSelectedStudents(newSelected);
  };

  const handleSave = async () => {
    const examTime = (formData.date && formData.time)
      ? new Date(`${formData.date}T${formData.time}`).toISOString()
      : (formData.date ? new Date(formData.date).toISOString() : new Date().toISOString());
    const durationSeconds = formData.duration ? (parseInt(formData.duration) * 60).toString() : "0";

    const selectedEmails = Array.from(selectedStudents).map(id => {
      const student = studentsData.find(s => s.id === id);
      return student?.email || '';
    }).filter(email => email !== '');

    const createPayload = {
      name: formData.name,
      url: formData.url,
      description: formData.details,
      examTime: examTime,
      duration: durationSeconds,
      students: selectedEmails
    };

    try {
      const resp: any = await api.exams.create(createPayload);
      if (resp.success || resp.name) { // sometimes APIS return the object directly or use success wrapper
        // 2. Prepare mock data for UI context until full API integration
        const newExam = {
          id: resp.data?._id || Date.now().toString(),
          name: formData.name,
          code: 'AUTH', // Auto-generate code placeholder
          details: formData.details,
          date: formData.date,
          duration: formData.duration,
          url: formData.url,
          status: 'Scheduled' as const,
        };

        addExam(newExam);
        setShowReviewModal(false);
        navigate(`/classroom/${newExam.id}`);
      } else {
        alert(resp.message || 'Failed to create exam');
      }
    } catch (error: any) {
      console.error('Failed to create exam:', error);
      alert(error.message || 'An error occurred while creating the exam.');
    }
  };

  // Filter Logic
  const filteredStudents = studentsData.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = filters.department ? student.department === filters.department : true;
    const matchesYear = filters.year ? student.year === filters.year : true;
    const matchesSection = filters.section ? student.section === filters.section : true;

    return matchesSearch && matchesDept && matchesYear && matchesSection;
  });

  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.id));

  // Unique values for dropdowns
  const departments = Array.from(new Set(studentsData.map(s => s.department)));
  const years = Array.from(new Set(studentsData.map(s => s.year || 'N/A'))).filter(y => y !== '');
  const sections = Array.from(new Set(studentsData.map(s => s.section)));

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">Create New Exam</h1>
            <p className="text-gray-500 font-medium">Schedule a new examination and assign students</p>
          </div>
        </div>
        <button
          onClick={() => setShowReviewModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 uppercase tracking-wider text-sm"
        >
          <Save size={20} />
          Create Exam
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Section 1: Exam Information */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gray-800 p-6 text-white">
              <h2 className="text-lg font-bold uppercase tracking-wider">Exam Information</h2>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Exam Title</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="e.g. Data Structures Mid-Term"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
                  placeholder="Enter exam instructions..."
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Duration (Min)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Exam URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm font-mono"
                    placeholder="https://..."
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-xl transition-colors relative group"
                    title="Copy URL"
                  >
                    {urlCopied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 ml-1">Students will use this link to access the exam.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Add Students to Exam */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-full">
            <div className="bg-blue-900 p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold uppercase tracking-wider">Add Students</h2>
              <div className="bg-blue-800 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {selectedStudents.size} Selected
              </div>
            </div>

            {/* Filters & Search */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by Name or Roll No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                  >
                    <option value="">All Depts</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
                  >
                    <option value="">All Years</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select
                    value={filters.section}
                    onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
                  >
                    <option value="">All Sections</option>
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Student Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="p-4 w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => handleSelectAll(filteredStudents)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Dept</th>
                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${selectedStudents.has(student.id) ? 'bg-blue-50/30' : ''}`}
                        onClick={() => handleStudentSelect(student.id)}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => handleStudentSelect(student.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-4 font-bold text-gray-800">{student.name}</td>
                        <td className="p-4 font-mono text-sm text-gray-600">{student.rollNo}</td>
                        <td className="p-4 text-sm text-gray-600">{student.department}</td>
                        <td className="p-4 text-sm text-gray-600">{student.section}</td>
                        <td className="p-4 text-sm text-gray-600">{student.year || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                        No students found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold uppercase tracking-tight">Review & Confirm</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-blue-200 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Exam Title</h4>
                  <p className="font-bold text-gray-800 text-lg">{formData.name || 'Untitled Exam'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</h4>
                    <p className="font-medium text-gray-800">{formData.date || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</h4>
                    <p className="font-medium text-gray-800">{formData.duration ? `${formData.duration} Mins` : 'Not set'}</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-800 font-bold">Students Selected</span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">{selectedStudents.size}</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">These students will be enrolled in the exam.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold uppercase text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold uppercase shadow-lg transition-transform hover:scale-105"
                >
                  Confirm & Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
