import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, CheckCircle, LogOut, Settings, User, Menu, ChevronLeft, Users } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { api } from '../services/api';

export default function Sidebar() {
  const navigate = useNavigate();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      navigate('/');
    }
  };

  const handleProfile = () => {
    setIsSettingsOpen(false);
    navigate('/profile');
  };

  return (
    <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-700 text-white flex flex-col h-full shadow-2xl z-10 transition-all duration-300 relative`}>
      <div className="flex justify-end p-4">
        <button onClick={toggleSidebar} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors shadow-sm text-gray-200">
          {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`space-y-4 flex-1 overflow-y-auto ${isSidebarOpen ? 'px-4' : 'px-2'}`}>
        <NavLink
          to="/dashboard"
          end
          title="All Exams"
          className={({ isActive }) =>
            `flex items-center gap-3 py-3 rounded-xl font-bold uppercase transition-all duration-200 ${isSidebarOpen ? 'px-4' : 'justify-center border border-transparent mx-2'
            } ${isActive ? 'bg-white text-gray-800 shadow-lg translate-x-2' : 'bg-gray-600/50 hover:bg-gray-600 hover:translate-x-1'}`
          }
        >
          <LayoutDashboard size={20} className="flex-shrink-0" />
          {isSidebarOpen && <span className="truncate">All Exam</span>}
        </NavLink>

        <NavLink
          to="/upcoming-exams"
          title="Upcoming Exams"
          className={({ isActive }) =>
            `flex items-center gap-3 py-3 rounded-xl font-bold uppercase transition-all duration-200 ${isSidebarOpen ? 'px-4' : 'justify-center border border-transparent mx-2'
            } ${isActive ? 'bg-white text-gray-800 shadow-lg translate-x-2' : 'bg-gray-600/50 hover:bg-gray-600 hover:translate-x-1'}`
          }
        >
          <Calendar size={20} className="flex-shrink-0" />
          {isSidebarOpen && <span className="truncate">Upcoming Exam</span>}
        </NavLink>

        <NavLink
          to="/completed-exams"
          title="Completed Exams"
          className={({ isActive }) =>
            `flex items-center gap-3 py-3 rounded-xl font-bold uppercase transition-all duration-200 ${isSidebarOpen ? 'px-4' : 'justify-center border border-transparent mx-2'
            } ${isActive ? 'bg-white text-gray-800 shadow-lg translate-x-2' : 'bg-gray-600/50 hover:bg-gray-600 hover:translate-x-1'}`
          }
        >
          <CheckCircle size={20} className="flex-shrink-0" />
          {isSidebarOpen && <span className="truncate">Complete Exam</span>}
        </NavLink>

        <div className="pt-2 border-t border-gray-600 my-2"></div>

        <NavLink
          to="/other-profiles"
          title="Other Profiles"
          className={({ isActive }) =>
            `flex items-center gap-3 py-3 rounded-xl font-bold uppercase transition-all duration-200 ${isSidebarOpen ? 'px-4' : 'justify-center border border-transparent mx-2'
            } ${isActive ? 'bg-white text-gray-800 shadow-lg translate-x-2' : 'bg-gray-600/50 hover:bg-gray-600 hover:translate-x-1'}`
          }
        >
          <Users size={20} className="flex-shrink-0" />
          {isSidebarOpen && <span className="truncate">Other Profiles</span>}
        </NavLink>
      </div>

      <div className={`mt-auto pt-8 border-t border-gray-600 relative pb-4 ${isSidebarOpen ? 'px-4' : 'px-2'}`} ref={settingsRef}>
        {isSettingsOpen && (
          <div className={`absolute bottom-full mb-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-600 overflow-hidden animate-in fade-in slide-in-from-bottom-2 ${isSidebarOpen ? 'left-4 right-4' : 'left-full ml-2 w-48'}`}>
            <button
              onClick={handleProfile}
              className="flex items-center gap-3 w-full px-4 py-3 text-left font-bold uppercase text-gray-200 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <User size={18} />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-left font-bold uppercase text-red-400 hover:bg-red-500 hover:text-white transition-colors border-t border-gray-700"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        )}
        <button
          title="Settings"
          onClick={() => {
            if (!isSidebarOpen) toggleSidebar();
            setIsSettingsOpen(!isSettingsOpen);
          }}
          className={`flex items-center py-3 rounded-xl font-bold uppercase transition-all shadow-lg w-full ${isSidebarOpen ? 'px-4 justify-between' : 'justify-center px-0 border border-transparent mx-2'
            } ${isSettingsOpen
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600/50 text-gray-200 hover:bg-gray-600'
            }`}
        >
          <div className="flex items-center gap-3">
            <Settings size={20} className={isSettingsOpen ? 'animate-spin-slow' : ''} />
            {isSidebarOpen && <span>Settings</span>}
          </div>
        </button>
      </div>
    </div>
  );
}
