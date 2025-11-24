import { create } from 'zustand';

export interface Page {
    id: string;
    title: string;
    boardId: string;
    order: number;
}

export interface Board {
    id: string;
    title: string;
    topicId: string;
    workspaceId: string;
}

export interface Topic {
    id: string;
    name: string;
    workspaceId: string;
}

export interface Workspace {
    id: string;
    name: string;
    slug: string;
}

interface WorkspaceState {
    // Data
    workspaces: Workspace[];
    topics: Topic[];
    boards: Board[];
    pages: Page[];

    // Current selections
    currentWorkspaceId: string | null;
    currentTopicId: string | null;
    currentBoardId: string | null;
    currentPageId: string | null;

    // Workspace actions
    setWorkspaces: (workspaces: Workspace[]) => void;
    setCurrentWorkspace: (id: string | null) => void;

    // Topic actions
    setTopics: (topics: Topic[]) => void;
    addTopic: (topic: Topic) => void;
    removeTopic: (id: string) => void;
    setCurrentTopic: (id: string | null) => void;

    // Board actions
    setBoards: (boards: Board[]) => void;
    addBoard: (board: Board) => void;
    removeBoard: (id: string) => void;
    setCurrentBoard: (id: string | null) => void;

    // Page actions
    setPages: (pages: Page[]) => void;
    addPage: (page: Page) => void;
    removePage: (id: string) => void;
    setCurrentPage: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    // Initial state
    workspaces: [],
    topics: [],
    boards: [],
    pages: [],
    currentWorkspaceId: null,
    currentTopicId: null,
    currentBoardId: null,
    currentPageId: null,

    // Workspace actions
    setWorkspaces: (workspaces) => set({ workspaces }),

    setCurrentWorkspace: (id) => {
        const state = get();
        if (id === state.currentWorkspaceId) return;

        // Auto-select first topic in workspace
        const firstTopic = state.topics.find((t) => t.workspaceId === id);
        const firstBoard = firstTopic
            ? state.boards.find((b) => b.topicId === firstTopic.id)
            : null;
        const firstPage = firstBoard
            ? state.pages.find((p) => p.boardId === firstBoard.id)
            : null;

        set({
            currentWorkspaceId: id,
            currentTopicId: firstTopic?.id || null,
            currentBoardId: firstBoard?.id || null,
            currentPageId: firstPage?.id || null,
        });
    },

    // Topic actions
    setTopics: (topics) => set({ topics }),

    addTopic: (topic) => set((state) => ({
        topics: [...state.topics, topic]
    })),

    removeTopic: (id) => set((state) => {
        const boardsToRemove = state.boards.filter((b) => b.topicId === id);
        const boardIds = boardsToRemove.map((b) => b.id);

        return {
            topics: state.topics.filter((t) => t.id !== id),
            boards: state.boards.filter((b) => b.topicId !== id),
            pages: state.pages.filter((p) => !boardIds.includes(p.boardId)),
            currentTopicId: state.currentTopicId === id ? null : state.currentTopicId,
            currentBoardId: boardIds.includes(state.currentBoardId || '') ? null : state.currentBoardId,
        };
    }),

    setCurrentTopic: (id) => {
        const state = get();
        if (id === state.currentTopicId) return;

        // Auto-select first board in topic
        const firstBoard = state.boards.find((b) => b.topicId === id);
        const firstPage = firstBoard
            ? state.pages.find((p) => p.boardId === firstBoard.id)
            : null;

        set({
            currentTopicId: id,
            currentBoardId: firstBoard?.id || null,
            currentPageId: firstPage?.id || null,
        });
    },

    // Board actions
    setBoards: (boards) => set({ boards }),

    addBoard: (board) => set((state) => ({
        boards: [...state.boards, board]
    })),

    removeBoard: (id) => set((state) => ({
        boards: state.boards.filter((b) => b.id !== id),
        pages: state.pages.filter((p) => p.boardId !== id),
        currentBoardId: state.currentBoardId === id ? null : state.currentBoardId,
    })),

    setCurrentBoard: (id) => {
        const state = get();
        if (id === state.currentBoardId) return;

        // Auto-select first page in board
        const firstPage = state.pages.find((p) => p.boardId === id);

        set({
            currentBoardId: id,
            currentPageId: firstPage?.id || null,
        });
    },

    // Page actions
    setPages: (pages) => set({ pages }),

    addPage: (page) => set((state) => ({
        pages: [...state.pages, page]
    })),

    removePage: (id) => set((state) => ({
        pages: state.pages.filter((p) => p.id !== id),
        currentPageId: state.currentPageId === id ? null : state.currentPageId,
    })),

    setCurrentPage: (id) => set({ currentPageId: id }),
}));
