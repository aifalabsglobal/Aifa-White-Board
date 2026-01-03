/**
 * SaveManager - Best-in-class save management for whiteboard canvas
 * 
 * Features:
 * - Debounced auto-save with configurable delay
 * - Immediate flush capability for page switches
 * - Retry with exponential backoff
 * - Save queue to prevent concurrent conflicts
 * - Version tracking for conflict detection
 * - Offline handling with localStorage backup
 */

import { Stroke, PageStyleType } from '@/store/whiteboardStore';

export interface PageContent {
    strokes: Stroke[];
    backgroundColor: string;
    pageStyle: PageStyleType;
    thumbnail?: string;
    version?: number;
}

export interface SaveResult {
    success: boolean;
    error?: string;
    serverVersion?: number;
}

type SaveCallback = (status: 'saving' | 'saved' | 'error' | 'offline') => void;

class SaveManager {
    private pendingSaves: Map<string, PageContent> = new Map();
    private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private isSaving: Map<string, boolean> = new Map();
    private versions: Map<string, number> = new Map();
    private retryCount: Map<string, number> = new Map();
    private statusCallback: SaveCallback | null = null;
    private stageRef: any = null;

    // Configuration
    private readonly DEBOUNCE_DELAY = 1500; // 1.5 seconds
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

    /**
     * Set status callback for UI updates
     */
    setStatusCallback(callback: SaveCallback | null) {
        this.statusCallback = callback;
    }

    /**
     * Set stage reference for thumbnail generation
     */
    setStageRef(stage: any) {
        this.stageRef = stage;
    }

    /**
     * Queue a save operation with debouncing
     */
    queueSave(pageId: string, content: PageContent) {
        if (!pageId) return;

        // Store the pending content
        this.pendingSaves.set(pageId, { ...content });

        // Clear existing timeout
        const existingTimeout = this.saveTimeouts.get(pageId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Backup to localStorage immediately (for offline recovery)
        this.backupToLocalStorage(pageId, content);

        // Set new debounced save
        const timeout = setTimeout(() => {
            this.executeSave(pageId);
        }, this.DEBOUNCE_DELAY);

        this.saveTimeouts.set(pageId, timeout);
        this.statusCallback?.('saving');
    }

    /**
     * Immediately flush all pending saves (call before page switch)
     */
    async flushPendingSaves(): Promise<void> {
        const savePromises: Promise<SaveResult>[] = [];

        for (const [pageId] of this.pendingSaves) {
            // Clear the debounce timeout
            const timeout = this.saveTimeouts.get(pageId);
            if (timeout) {
                clearTimeout(timeout);
                this.saveTimeouts.delete(pageId);
            }

            // Execute save immediately
            savePromises.push(this.executeSave(pageId));
        }

        await Promise.all(savePromises);
    }

    /**
     * Flush save for a specific page
     */
    async flushPage(pageId: string): Promise<SaveResult> {
        const timeout = this.saveTimeouts.get(pageId);
        if (timeout) {
            clearTimeout(timeout);
            this.saveTimeouts.delete(pageId);
        }

        if (this.pendingSaves.has(pageId)) {
            return this.executeSave(pageId);
        }

        return { success: true };
    }

    /**
     * Check if there are unsaved changes for a page
     */
    hasPendingChanges(pageId: string): boolean {
        return this.pendingSaves.has(pageId) || this.isSaving.get(pageId) === true;
    }

    /**
     * Execute the actual save operation
     */
    private async executeSave(pageId: string): Promise<SaveResult> {
        const content = this.pendingSaves.get(pageId);
        if (!content) {
            return { success: true };
        }

        // Prevent concurrent saves for the same page
        if (this.isSaving.get(pageId)) {
            // Re-queue the save for later
            const timeout = setTimeout(() => {
                this.executeSave(pageId);
            }, 500);
            this.saveTimeouts.set(pageId, timeout);
            return { success: false, error: 'Save in progress' };
        }

        this.isSaving.set(pageId, true);
        this.statusCallback?.('saving');

        try {
            // Generate thumbnail
            let thumbnail: string | undefined;
            if (this.stageRef) {
                try {
                    thumbnail = this.stageRef.toDataURL({ pixelRatio: 0.25 });
                } catch (e) {
                    console.warn('Failed to generate thumbnail:', e);
                }
            }

            // Increment version
            const currentVersion = this.versions.get(pageId) || 0;
            const newVersion = currentVersion + 1;

            const res = await fetch(`/api/pages/${pageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { ...content, version: newVersion },
                    thumbnail
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            // Success - clear pending and update version
            this.pendingSaves.delete(pageId);
            this.versions.set(pageId, newVersion);
            this.retryCount.delete(pageId);
            this.clearLocalStorageBackup(pageId);
            this.statusCallback?.('saved');

            return { success: true, serverVersion: newVersion };
        } catch (error) {
            console.error('Save failed:', error);

            // Check if offline
            if (!navigator.onLine) {
                this.statusCallback?.('offline');
                return { success: false, error: 'Offline' };
            }

            // Retry logic
            const retries = this.retryCount.get(pageId) || 0;
            if (retries < this.MAX_RETRIES) {
                this.retryCount.set(pageId, retries + 1);
                const delay = this.RETRY_DELAYS[retries] || 4000;

                console.log(`Retrying save in ${delay}ms (attempt ${retries + 1}/${this.MAX_RETRIES})`);

                const timeout = setTimeout(() => {
                    this.executeSave(pageId);
                }, delay);
                this.saveTimeouts.set(pageId, timeout);

                return { success: false, error: 'Retrying...' };
            }

            this.statusCallback?.('error');
            return { success: false, error: String(error) };
        } finally {
            this.isSaving.set(pageId, false);
        }
    }

    /**
     * Backup content to localStorage for offline recovery
     */
    private backupToLocalStorage(pageId: string, content: PageContent) {
        try {
            const key = `whiteboard_backup_${pageId}`;
            const backup = {
                content,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(backup));
        } catch (e) {
            console.warn('Failed to backup to localStorage:', e);
        }
    }

    /**
     * Clear localStorage backup after successful save
     */
    private clearLocalStorageBackup(pageId: string) {
        try {
            localStorage.removeItem(`whiteboard_backup_${pageId}`);
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Recover unsaved content from localStorage
     */
    getLocalStorageBackup(pageId: string): PageContent | null {
        try {
            const key = `whiteboard_backup_${pageId}`;
            const data = localStorage.getItem(key);
            if (data) {
                const backup = JSON.parse(data);
                // Only use backup if it's less than 24 hours old
                if (Date.now() - backup.timestamp < 24 * 60 * 60 * 1000) {
                    return backup.content;
                }
            }
        } catch (e) {
            console.warn('Failed to read localStorage backup:', e);
        }
        return null;
    }

    /**
     * Set the version for a page (used when loading from server)
     */
    setVersion(pageId: string, version: number) {
        this.versions.set(pageId, version);
    }

    /**
     * Get the current version for a page
     */
    getVersion(pageId: string): number {
        return this.versions.get(pageId) || 0;
    }

    /**
     * Cleanup - call when component unmounts
     */
    cleanup() {
        // Clear all timeouts
        for (const timeout of this.saveTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.saveTimeouts.clear();
        this.pendingSaves.clear();
        this.isSaving.clear();
        this.statusCallback = null;
    }
}

// Export singleton instance
export const saveManager = new SaveManager();
