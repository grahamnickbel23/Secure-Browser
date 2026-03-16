import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, History, User, Building2, Mail, GraduationCap } from 'lucide-react';
import { api } from '../services/api';

interface SearchSuggestion {
    type: string;
    id: string | number;
    name: string;
    email: string;
    historyId?: string; // Add historyId for deletion
}

export default function OtherProfiles() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Fetch recent searches from API
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token') || '';
                const response = await api.search.getHistory(token) as any;
                if (response.success && response.data) {
                    // Map API history format to our component format
                    const historyItems = response.data.map((item: any) => ({
                        id: item.profileId, // Using profileId rather than history entry _id for navigation
                        type: item.profileType,
                        name: item.profileName || 'Unknown',
                        email: item.profileEmail || '',
                        historyId: item._id
                    }));
                    setRecentSearches(historyItems);
                }
            } catch (error) {
                console.error("Failed to fetch search history", error);
            }
        };

        fetchHistory();
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!searchTerm.trim()) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const token = localStorage.getItem('token') || '';
                const data = await api.search.global(searchTerm, token) as any;
                if (data.success) {
                    setSuggestions(data.data);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleProfileClick = async (profile: SearchSuggestion) => {
        try {
            const token = localStorage.getItem('token') || '';
            await api.search.createHistory(profile.type, String(profile.id), token);
        } catch (error) {
            console.error("Failed to save search history", error);
        }

        // Navigate
        navigate(`/other-profiles/${profile.id}`, { state: { type: profile.type } });
    };

    const handleDeleteHistory = async (e: React.MouseEvent, historyId?: string) => {
        e.stopPropagation();
        if (!historyId) return;

        try {
            const token = localStorage.getItem('token') || '';
            await api.search.deleteHistory(historyId, token);
            setRecentSearches(prev => prev.filter(item => item.historyId !== historyId));
        } catch (error) {
            console.error("Failed to delete history item", error);
        }
    };

    const clearHistory = async () => {
        try {
            const token = localStorage.getItem('token') || '';
            const historyIds = recentSearches.map(item => item.historyId).filter(Boolean) as string[];

            // Delete all concurrently to clear everything quickly
            await Promise.all(historyIds.map(id => api.search.deleteHistory(id, token)));

            setRecentSearches([]);
        } catch (error) {
            console.error("Failed to clear search history", error);
        }
    };

    const isActive = isFocused || searchTerm.length > 0;

    return (
        <div className="flex flex-col h-full relative max-w-4xl mx-auto w-full">
            <div
                className={`w-full absolute left-0 right-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isActive ? 'top-8' : 'top-[35%] -translate-y-1/2'
                    }`}
            >
                <div className="flex justify-center mb-8">
                    <h1
                        className={`font-black text-blue-900 uppercase tracking-tight transition-all duration-700 text-center ${isActive ? 'text-3xl opacity-100 scale-100' : 'text-5xl opacity-90 scale-110'
                            }`}
                        style={{ transformOrigin: 'top center' }}
                    >
                        Search Profiles
                    </h1>
                </div>

                <div
                    ref={wrapperRef}
                    className={`bg-white shadow-2xl transition-all duration-700 border border-gray-100 mx-auto overflow-hidden w-full ${isActive ? 'rounded-3xl ease-out' : 'rounded-3xl hover:shadow-blue-900/10 hover:border-blue-200 ease-in-out'
                        }`}
                >
                    {/* Search Input */}
                    <div className="relative flex items-center px-4 bg-white z-20">
                        <div className="pl-4 flex items-center pointer-events-none">
                            <Search className={`h-7 w-7 transition-colors duration-300 ${isFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-6 pr-12 py-6 bg-transparent text-xl font-medium focus:outline-none text-gray-900 placeholder-gray-400 transition-all"
                            placeholder="Enter Name, Email, or Enrollment No..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsFocused(true);
                            }}
                            onFocus={() => setIsFocused(true)}
                        />
                    </div>

                    {/* Expandable Results Area */}
                    <div
                        className={`transition-all duration-500 ease-in-out w-full bg-white relative z-10 ${isActive ? 'max-h-[60vh] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0 border-t-0'
                            }`}
                    >
                        {isActive && (
                            <div className="overflow-y-auto max-h-[60vh]">
                                {searchTerm.trim() ? (
                                    /* Suggestions View */
                                    <div className="py-2">
                                        {isLoading ? (
                                            <div className="p-12 text-center text-gray-500">
                                                <p className="font-medium animate-pulse text-lg">Searching...</p>
                                            </div>
                                        ) : suggestions.length > 0 ? (
                                            <div>
                                                <div className="px-10 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                                    Search Results
                                                </div>
                                                {suggestions.map((profile, i) => (
                                                    <button
                                                        key={`sugg-${profile.id}-${i}`}
                                                        onClick={() => handleProfileClick(profile)}
                                                        className="w-full px-10 py-5 flex items-center justify-between gap-6 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0 group"
                                                    >
                                                        <div className="w-1/4 flex justify-start items-center">
                                                            <span className={`text-xs font-bold uppercase px-4 py-1.5 rounded-full ${profile.type === 'admin' ? 'bg-red-100 text-red-700' : profile.type === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                                {profile.type}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 text-center overflow-hidden">
                                                            <h4 className="font-bold text-gray-900 truncate text-xl group-hover:text-blue-700 transition-colors">{profile.name}</h4>
                                                        </div>
                                                        <div className="w-1/3 text-right flex justify-end items-center gap-3 overflow-hidden">
                                                            <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                                            <p className="text-gray-500 truncate">{profile.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-16 text-center text-gray-400">
                                                <Search size={48} className="mx-auto text-gray-200 mb-6" />
                                                <p className="font-medium text-xl text-gray-500">No results found for "{searchTerm}"</p>
                                                <p className="text-base mt-2">Try checking for typos or using different keywords</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Recent Searches View */
                                    <div className="py-2">
                                        <div className="flex items-center justify-between px-10 py-4 bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                            <div className="flex items-center gap-3">
                                                <History size={18} className="text-gray-500" />
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Searches</span>
                                            </div>
                                            {recentSearches.length > 0 && (
                                                <button
                                                    onClick={clearHistory}
                                                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md"
                                                >
                                                    Clear All
                                                </button>
                                            )}
                                        </div>

                                        {recentSearches.length > 0 ? (
                                            <div>
                                                {recentSearches.map((profile, i) => (
                                                    <div
                                                        key={`hist-${profile.id}-${i}`}
                                                        className="w-full px-10 py-4 flex items-center justify-between gap-6 hover:bg-gray-50 transition-colors text-left group"
                                                    >
                                                        <button
                                                            className="flex items-center gap-5 flex-1 overflow-hidden"
                                                            onClick={() => navigate(`/other-profiles/${profile.id}`, { state: { type: profile.type } })}
                                                        >
                                                            <div className="w-12 h-12 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors border border-blue-100">
                                                                <span className="text-base font-bold text-blue-700">
                                                                    {profile.name ? profile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 overflow-hidden text-left flex flex-col items-start w-full">
                                                                <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate text-lg w-full text-left">{profile.name}</h4>
                                                                <div className="flex items-center justify-start gap-2 text-sm text-gray-500 mt-1 w-full flex-wrap">
                                                                    <span className="capitalize text-gray-400 font-medium whitespace-nowrap">{profile.type}</span>
                                                                    {profile.email && (
                                                                        <>
                                                                            <span className="text-gray-300">•</span>
                                                                            <span className="truncate flex-1 max-w-full text-left">{profile.email}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteHistory(e, profile.historyId)}
                                                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors bg-white shadow-sm p-2 rounded-full hover:shadow border border-gray-100 z-10 relative flex-shrink-0"
                                                            title="Delete from history"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-16 text-center opacity-70">
                                                <History size={48} className="mx-auto text-gray-200 mb-6" />
                                                <p className="text-gray-500 font-medium text-xl">No recent searches</p>
                                                <p className="text-base text-gray-400 mt-2">Your search history will appear here</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
