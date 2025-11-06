'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Board as BoardType } from '@/lib/types';
import Board from '@/components/Board';
import { Plus, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserPage() {
    const { user, logout, isUser } = useAuth();
    const router = useRouter();
    const mountedRef = useRef(false);

    const [boards, setBoards] = useState<BoardType[]>([]);
    const [showNewBoardForm, setShowNewBoardForm] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');

    useEffect(() => {
        if (!isUser) {
            router.push('/auth/login');
        }
    }, [isUser, router]);

    useEffect(() => {
        // Mark component as mounted on the client
        mountedRef.current = true;

        if (!user) return;

        // Load boards from localStorage
        const storedBoards = localStorage.getItem(`kanban_boards_${user.id}`);
        if (storedBoards) {
            try {
                const parsedBoards = JSON.parse(storedBoards);
                queueMicrotask(() => setBoards(parsedBoards));
                return;
            } catch (error) {
                console.error('Failed to load boards:', error);
            }
        }

        // Create a default board for new users or on parse error
        const boardId = `board_${Date.now()}`;
        const defaultBoard: BoardType = {
            id: boardId,
            title: 'My First Board',
            userId: user.id,
            userName: user.name,
            columns: [
                { id: 'col_1', title: 'To Do', order: 0, boardId },
                { id: 'col_2', title: 'In Progress', order: 1, boardId },
                { id: 'col_3', title: 'Done', order: 2, boardId },
            ],
            cards: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        queueMicrotask(() => setBoards([defaultBoard]));
        localStorage.setItem(`kanban_boards_${user.id}`, JSON.stringify([defaultBoard]));
    }, [user]);

    const saveBoards = (updatedBoards: BoardType[]) => {
        setBoards(updatedBoards);
        localStorage.setItem(`kanban_boards_${user?.id}`, JSON.stringify(updatedBoards));
    };

    const handleCreateBoard = () => {
        if (newBoardTitle.trim() && user) {
            const newBoard: BoardType = {
                id: `board_${Date.now()}`,
                title: newBoardTitle.trim(),
                userId: user.id,
                userName: user.name,
                columns: [
                    { id: `col_1_${Date.now()}`, title: 'To Do', order: 0, boardId: `board_${Date.now()}` },
                    { id: `col_2_${Date.now()}`, title: 'In Progress', order: 1, boardId: `board_${Date.now()}` },
                    { id: `col_3_${Date.now()}`, title: 'Done', order: 2, boardId: `board_${Date.now()}` },
                ],
                cards: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            saveBoards([...boards, newBoard]);
            setNewBoardTitle('');
            setShowNewBoardForm(false);
        }
    };

    const handleDeleteBoard = (boardId: string) => {
        saveBoards(boards.filter((board) => board.id !== boardId));
    };

    const handleUpdateBoard = (boardId: string, updates: Partial<BoardType>) => {
        const updatedBoards = boards.map((board) =>
            board.id === boardId ? { ...board, ...updates, updatedAt: new Date().toISOString() } : board
        );
        saveBoards(updatedBoards);
    };

    if (!isUser) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                            My Boards
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">Welcome back, {user?.name}</p>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            router.push('/auth/login');
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all border border-red-300"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {boards.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 mb-6">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m0 0l-1-1m0 1l1 1m-13 0l1 1m0-1l-1-1" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">No boards yet</h2>
                        <p className="text-slate-600 mb-10">Create your first board to start managing your tasks</p>
                        <button
                            onClick={() => setShowNewBoardForm(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-semibold shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Create First Board
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-10 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {boards.length} {boards.length === 1 ? 'Board' : 'Boards'}
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">Organize and manage your workflow</p>
                            </div>
                            <button
                                onClick={() => setShowNewBoardForm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-semibold shadow-lg"
                            >
                                <Plus className="w-4 h-4" />
                                New Board
                            </button>
                        </div>

                        {showNewBoardForm && (
                            <div className="mb-10 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-5">Create New Board</h3>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newBoardTitle}
                                        onChange={(e) => setNewBoardTitle(e.target.value)}
                                        placeholder="Enter board title"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateBoard();
                                            if (e.key === 'Escape') {
                                                setShowNewBoardForm(false);
                                                setNewBoardTitle('');
                                            }
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleCreateBoard}
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-semibold shadow-lg"
                                    >
                                        Create
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowNewBoardForm(false);
                                            setNewBoardTitle('');
                                        }}
                                        className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all font-semibold border border-slate-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-8">
                            {boards.map((board) => (
                                <div key={board.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                    <Board
                                        board={board}
                                        onUpdateBoard={(updates) => handleUpdateBoard(board.id, updates)}
                                        onDeleteBoard={() => handleDeleteBoard(board.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
