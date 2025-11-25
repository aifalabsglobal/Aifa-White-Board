'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import AppModal, { AppModalProps } from '@/components/AppModal';

interface ModalContextType {
    showAlert: (title: string, description?: string, variant?: AppModalProps['variant']) => Promise<void>;
    showConfirm: (title: string, description?: string, variant?: AppModalProps['variant']) => Promise<boolean>;
    showPrompt: (title: string, description?: string, placeholder?: string, defaultValue?: string) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [modalProps, setModalProps] = useState<AppModalProps>({ isOpen: false });
    const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null);

    const close = useCallback(() => {
        setModalProps((prev) => ({ ...prev, isOpen: false }));
        if (resolvePromise) {
            resolvePromise(null); // Default resolve for cancel/close
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    const showAlert = useCallback((title: string, description?: string, variant: AppModalProps['variant'] = 'info') => {
        return new Promise<void>((resolve) => {
            setResolvePromise(() => resolve);
            setModalProps({
                isOpen: true,
                title,
                description,
                variant,
                type: 'alert',
                confirmText: 'OK',
                showCancel: false,
                onConfirm: () => {
                    resolve();
                    setModalProps((prev) => ({ ...prev, isOpen: false }));
                },
                onCancel: () => {
                    resolve();
                    setModalProps((prev) => ({ ...prev, isOpen: false }));
                }
            });
        });
    }, []);

    const showConfirm = useCallback((title: string, description?: string, variant: AppModalProps['variant'] = 'warning') => {
        return new Promise<boolean>((resolve) => {
            setResolvePromise(() => resolve);
            setModalProps({
                isOpen: true,
                title,
                description,
                variant,
                type: 'confirm',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                showCancel: true,
                onConfirm: () => {
                    resolve(true);
                    setModalProps((prev) => ({ ...prev, isOpen: false }));
                },
                onCancel: () => {
                    resolve(false);
                    setModalProps((prev) => ({ ...prev, isOpen: false }));
                }
            });
        });
    }, []);

    const showPrompt = useCallback((title: string, description?: string, placeholder?: string, defaultValue: string = '') => {
        return new Promise<string | null>((resolve) => {
            setResolvePromise(() => resolve);
            setModalProps({
                isOpen: true,
                title,
                description,
                type: 'prompt',
                inputPlaceholder: placeholder,
                inputValue: defaultValue,
                confirmText: 'OK',
                cancelText: 'Cancel',
                showCancel: true,
                onConfirm: (value) => {
                    resolve(value || '');
                    setModalProps((prev) => ({ ...prev, isOpen: false }));
                },
                onCancel: () => {
                    resolve(null);
                    setModalProps((prev) => ({ ...prev, isOpen: false }));
                }
            });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
            {children}
            <AppModal {...modalProps} />
        </ModalContext.Provider>
    );
}
