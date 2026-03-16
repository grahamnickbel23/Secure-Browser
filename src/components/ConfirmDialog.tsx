import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    cancelText?: string;
    confirmText?: string;
    icon: React.ReactNode;
    colorTheme?: 'blue' | 'green' | 'red';
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    icon,
    colorTheme = 'blue',
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const themeConfig = {
        blue: {
            border: 'border-blue-100',
            iconBg: 'bg-blue-50',
            iconText: 'text-blue-600',
            btnBg: 'bg-blue-600 hover:bg-blue-700',
            btnShadow: 'shadow-blue-600/20',
        },
        green: {
            border: 'border-green-100',
            iconBg: 'bg-green-50',
            iconText: 'text-green-600',
            btnBg: 'bg-green-600 hover:bg-green-700',
            btnShadow: 'shadow-green-600/20',
        },
        red: {
            border: 'border-red-100',
            iconBg: 'bg-red-50',
            iconText: 'text-red-600',
            btnBg: 'bg-red-600 hover:bg-red-700',
            btnShadow: 'shadow-red-600/20',
        },
    };

    const theme = themeConfig[colorTheme];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in" onClick={onClose}>
            <div className={`bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl animate-in zoom-in border ${theme.border}`} onClick={e => e.stopPropagation()}>
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 ${theme.iconBg} ${theme.iconText} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        {icon}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{title}</h3>
                    <p className="text-gray-500 mb-8 font-medium">{description}</p>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors uppercase text-sm tracking-wider"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`w-full ${theme.btnBg} text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg ${theme.btnShadow} uppercase text-sm tracking-wider`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
