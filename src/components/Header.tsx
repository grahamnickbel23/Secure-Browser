import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import UEMLogo from '../assets/UEM.png';
import IEMLogo from '../assets/IEM.png';

export default function Header() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/' || location.pathname === '/admin-login';
  const isEditable = !isLoginPage;

  const [height, setHeight] = useState(120);
  const [isDragging, setIsDragging] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const MIN_HEIGHT = 60;
  const MAX_HEIGHT = 160;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      if (headerRef.current) {
        const headerTop = headerRef.current.getBoundingClientRect().top;
        const newHeight = e.clientY - headerTop;

        if (newHeight >= MIN_HEIGHT && newHeight <= MAX_HEIGHT) {
          setHeight(newHeight);
        } else if (newHeight < MIN_HEIGHT) {
          setHeight(MIN_HEIGHT);
        } else if (newHeight > MAX_HEIGHT) {
          setHeight(MAX_HEIGHT);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const isCollapsed = height < 90;

  return (
    <header
      ref={headerRef}
      className={`bg-white shadow-md flex justify-between items-center border-b-4 border-red-700 relative z-20 px-4 md:px-8 select-none transition-all ${isDragging ? 'duration-0' : 'duration-100'}`}
      style={{ height: `${isEditable ? height : 120}px` }}
    >
      <div className={`flex-shrink-0 z-10 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
        <img src={UEMLogo} alt="UEM Logo" className="h-10 md:h-16 object-contain" referrerPolicy="no-referrer" />
      </div>

      {/* Center Text */}
      <div className="flex flex-col items-center text-center flex-1 justify-center h-full overflow-hidden">
        {isCollapsed ? (
          <h1 className="text-xl md:text-2xl font-black text-blue-900 uppercase tracking-tight truncate w-full px-4 animate-in fade-in zoom-in duration-300">
            IEM-UEM Group Exam Management System
          </h1>
        ) : (
          <div className="animate-in fade-in duration-300 flex flex-col items-center">
            <h1 className="text-lg md:text-3xl font-black text-blue-900 uppercase tracking-tight leading-none truncate">University of Engineering and Management Kolkata</h1>
            <h2 className="text-xs md:text-lg font-bold text-red-700 uppercase tracking-widest leading-tight mt-1 truncate">Institute of Engineering and Management Kolkata</h2>
          </div>
        )}
      </div>

      <div className={`flex-shrink-0 z-10 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
        <img src={IEMLogo} alt="IEM Logo" className="h-[4.5rem] md:h-24 object-contain" referrerPolicy="no-referrer" />
      </div>

      {/* Drag Handle */}
      {isEditable && (
        <div
          className="absolute bottom-[-6px] left-0 right-0 h-[12px] cursor-ns-resize z-30 hover:bg-red-500/20 transition-colors"
          onMouseDown={() => setIsDragging(true)}
        />
      )}
    </header>
  );
}
