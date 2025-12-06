'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle, AlertOctagon } from 'lucide-react';

export interface AppModalProps {
    isOpen: boolean;
    title?: string;
    description?: string;
    variant?: 'info' | 'warning' | 'danger' | 'success';
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    inputPlaceholder?: string; // For prompt
    inputValue?: string;      // For prompt
    onConfirm?: (inputValue?: string) => void;
    onCancel?: () => void;
    type?: 'alert' | 'confirm' | 'prompt';
}

export default function AppModal({
    isOpen,
    title,
    description,
    variant = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    inputPlaceholder,
    inputValue: initialInputValue = '',
    onConfirm,
    onCancel,
    type = 'alert',
}: AppModalProps) {
    const [inputValue, setInputValue] = useState(initialInputValue);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Small delay to allow render before animation
            requestAnimationFrame(() => setIsAnimating(true));
            setInputValue(initialInputValue);
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialInputValue]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertOctagon className="text-red-500" size={24} />;
            case 'warning': return <AlertTriangle className="text-yellow-500" size={24} />;
            case 'success': return <CheckCircle className="text-green-500" size={24} />;
            default: return <Info className="text-blue-500" size={24} />;
        }
    };

    const getButtonStyles = () => {
        switch (variant) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 text-white ring-red-500';
            case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 text-white ring-yellow-500';
            case 'success': return 'bg-green-600 hover:bg-green-700 text-white ring-green-500';
            default: return 'bg-blue-600 hover:bg-blue-700 text-white ring-blue-500';
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            if (type === 'prompt') {
                onConfirm(inputValue);
            } else {
                onConfirm();
            }
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isAnimating ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
                }`}
            onClick={onCancel} // Close on backdrop click if needed, or remove to force button interaction
        >
            <div
                className={`
                    w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-300
                    ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
                `}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full bg-opacity-10 shrink-0 ${variant === 'danger' ? 'bg-red-500' :
                            variant === 'warning' ? 'bg-yellow-500' :
                                variant === 'success' ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                            {getIcon()}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {title || 'Notification'}
                            </h3>
                            {description && (
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    {description}
                                </p>
                            )}

                            {type === 'prompt' && (
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={inputPlaceholder}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                />
                            )}
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        {(showCancel || type === 'confirm' || type === 'prompt') && (
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`px-6 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 ${getButtonStyles()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
