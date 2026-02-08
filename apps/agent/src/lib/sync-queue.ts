
export interface SyncItem {
    id: string;
    type: 'REPORT' | 'LEAVE';
    payload: any;
    createdAt: number;
}

const STORAGE_KEY = 'NEXUS_OFFLINE_QUEUE';

export const SyncQueue = {
    enqueue: (type: 'REPORT' | 'LEAVE', payload: any) => {
        if (typeof window === 'undefined') return;

        const item: SyncItem = {
            id: crypto.randomUUID(),
            type,
            payload,
            createdAt: Date.now()
        };

        const queue = SyncQueue.getAll();
        queue.push(item);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return item;
    },

    getAll: (): SyncItem[] => {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    },

    remove: (id: string) => {
        if (typeof window === 'undefined') return;
        const queue = SyncQueue.getAll().filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    },

    clear: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
    },

    count: (): number => {
        return SyncQueue.getAll().length;
    }
};
