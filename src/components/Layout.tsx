import React from 'react';
import { Header } from './Header';

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-400 flex flex-col font-sans">
            <Header />
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {children}
            </main>
        </div>
    );
}
