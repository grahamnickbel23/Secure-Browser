import React from 'react';
import uemLogo from '../assets/UEM.png';
import iemLogo from '../assets/IEM.png';

export function Header() {
    return (
        <header className="bg-white py-4 px-4 md:px-8 flex justify-between items-center shadow-md z-20 relative border-b-4 border-red-600 min-h-[100px]">
            {/* Left Logo */}
            <div className="flex-shrink-0 z-10">
                <img src={uemLogo} alt="UEM Logo" className="h-10 md:h-15 object-contain" referrerPolicy="no-referrer" />
            </div>

            {/* Center Text - Absolute positioning to ensure true center */}
            <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-center items-center pointer-events-none hidden md:flex">
                <div className="text-center px-24">
                    <h1 className="text-[#1e3a8a] text-2xl md:text-3xl font-bold tracking-tight font-serif uppercase">UNIVERSITY OF ENGINEERING AND MANAGEMENT KOLKATA</h1>
                    <div className="h-0.5 bg-red-600 w-full max-w-3xl mx-auto my-1"></div>
                    <h2 className="text-[#1e3a8a] text-lg md:text-xl font-bold tracking-tight font-serif uppercase">INSTITUTE OF ENGINEERING AND MANAGEMENT KOLKATA</h2>
                </div>
            </div>

            {/* Right Logo */}
            <div className="flex-shrink-0 z-10 flex items-center gap-6">
                <img src={iemLogo} alt="IEM Logo" className="h-26 md:h-30 object-contain" referrerPolicy="no-referrer" />
            </div>
        </header>
    );
}
