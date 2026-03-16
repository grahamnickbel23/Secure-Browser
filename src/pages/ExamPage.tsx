import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export function ExamPage() {
    const navigate = useNavigate();
    const [url, setUrl] = useState("");
    const [showExitModal, setShowExitModal] = useState(false);
    const webviewRef = useRef(null);

    useEffect(() => {
        const session = localStorage.getItem("examSession");
        if (session) {
            try {
                const data = JSON.parse(session);
                if (data.url) {
                    setUrl(data.url);
                } else {
                    navigate("/student");
                }
            } catch (e) {
                navigate("/student");
            }
        } else {
            navigate("/student");
        }
    }, [navigate]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                if (webviewRef.current) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (webviewRef.current as any).reload();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLeave = () => {
        if (window.electronAPI && window.electronAPI.leaveApp) {
            window.electronAPI.leaveApp();
        }
    };

    if (!url) {
        return <div className="flex-1 flex items-center justify-center p-4">Loading...</div>;
    }

    return (
        <div className="w-full h-screen bg-white relative">
            <webview
                ref={webviewRef}
                src={url}
                style={{ width: "100%", height: "100%" }}
                allowpopups="true"
            />

            <button
                onClick={() => setShowExitModal(true)}
                className="absolute top-4 right-4 bg-black text-white hover:bg-red-600 transition-colors rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold z-50 shadow-lg"
            >
                ✕
            </button>

            {showExitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center relative border border-gray-100">
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Leave Application?</h3>
                        <p className="text-gray-500 text-sm mb-8">
                            Have you saved your progress? Exiting now will close the application immediately.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={handleLeave}
                                className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold py-2.5 px-4 rounded-xl transition-colors"
                            >
                                Leave immediately
                            </button>
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}