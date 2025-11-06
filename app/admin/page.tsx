'use client';

import React, { useState, useLayoutEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Board as BoardType, User as UserType } from '@/lib/types';
import Board from '@/components/Board';
import { LogOut, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const { user, logout, isAdmin } = useAuth();
    const router = useRouter();

    const [allUsers, setAllUsers] = useState<UserType[]>(() => {
        if (typeof window === 'undefined' || !isAdmin) return [];
        const storedUsers = localStorage.getItem('kanban_all_users');
        if (storedUsers) {
            try {
                return JSON.parse(storedUsers).filter((u: UserType) => u.role === 'user');
            } catch (error) {
                console.error('Failed to load users:', error);
                return [];
            }
        }
        return [];
    });

    const [allBoards, setAllBoards] = useState<Map<string, BoardType[]>>(() => {
        if (typeof window === 'undefined' || !isAdmin) return new Map();
        const storedUsers = localStorage.getItem('kanban_all_users');
        const boardsMap = new Map<string, BoardType[]>();
        if (storedUsers) {
            try {
                const users = JSON.parse(storedUsers).filter((u: UserType) => u.role === 'user');
                users.forEach((u: UserType) => {
                    const userBoards = localStorage.getItem(`kanban_boards_${u.id}`);
                    if (userBoards) {
                        try {
                            boardsMap.set(u.id, JSON.parse(userBoards));
                        } catch (error) {
                            console.error(`Failed to load boards for user ${u.id}:`, error);
                            boardsMap.set(u.id, []);
                        }
                    }
                });
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        }
        return boardsMap;
    });

    const [selectedUserId, setSelectedUserId] = useState<string | null>(() => {
        if (typeof window === 'undefined' || !isAdmin) return null;
        const storedUsers = localStorage.getItem('kanban_all_users');
        if (storedUsers) {
            try {
                const users = JSON.parse(storedUsers).filter((u: UserType) => u.role === 'user');
                return users.length > 0 ? users[0].id : null;
            } catch {
                return null;
            }
        }
        return null;
    });

    useLayoutEffect(() => {
        if (!isAdmin) {
            router.push('/auth/login');
        }
    }, [isAdmin, router]);

    const handleDeleteUser = (userId: string) => {
        if (confirm('Are you sure you want to delete this user and all their boards?')) {
            const updatedUsers = allUsers.filter((u) => u.id !== userId);
            localStorage.setItem('kanban_all_users', JSON.stringify(updatedUsers));
            localStorage.removeItem(`kanban_boards_${userId}`);
            setAllUsers(updatedUsers);
            const newBoardsMap = new Map(allBoards);
            newBoardsMap.delete(userId);
            setAllBoards(newBoardsMap);
            if (selectedUserId === userId) {
                setSelectedUserId(updatedUsers.length > 0 ? updatedUsers[0].id : null);
            }
        }
    };

    const handleDeleteBoard = (boardId: string, userId: string) => {
        const userBoards = allBoards.get(userId) || [];
        const updatedBoards = userBoards.filter((b) => b.id !== boardId);
        const newBoardsMap = new Map(allBoards);
        newBoardsMap.set(userId, updatedBoards);
        setAllBoards(newBoardsMap);
        localStorage.setItem(`kanban_boards_${userId}`, JSON.stringify(updatedBoards));
    };

    const handleUpdateBoard = (boardId: string, userId: string, updates: Partial<BoardType>) => {
        const userBoards = allBoards.get(userId) || [];
        const updatedBoards = userBoards.map((b) =>
            b.id === boardId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
        );
        const newBoardsMap = new Map(allBoards);
        newBoardsMap.set(userId, updatedBoards);
        setAllBoards(newBoardsMap);
        localStorage.setItem(`kanban_boards_${userId}`, JSON.stringify(updatedBoards));
    };

    if (!isAdmin) {
        return null;
    }

    const selectedUserBoards = selectedUserId ? allBoards.get(selectedUserId) || [] : [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">Welcome, {user?.name}</p>
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {allUsers.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 mb-6">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3.594a1.5 1.5 0 01-1.5-1.5V5.094a1.5 1.5 0 011.5-1.5h15.812a1.5 1.5 0 011.5 1.5v14.412a1.5 1.5 0 01-1.5 1.5z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">No users registered</h2>
                        <p className="text-slate-600">Users will appear here once they create accounts</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Users List Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-20 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-bold text-slate-900">Users</h2>
                                    <span className="px-3 py-1 bg-blue-100 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
                                        {allUsers.length}
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {allUsers.map((u) => (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all group"
                                            style={{
                                                backgroundColor: selectedUserId === u.id ? 'rgb(226 232 240)' : 'rgb(248 250 252)',
                                                borderWidth: '1px',
                                                borderColor: selectedUserId === u.id ? 'rgb(219 234 254)' : 'rgb(226 232 240)',
                                            }}
                                            onClick={() => setSelectedUserId(u.id)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{u.name}</p>
                                                <p className="text-xs text-slate-600 truncate">{u.email}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteUser(u.id);
                                                }}
                                                className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition-all border border-transparent hover:border-red-200 group"
                                                title="Delete user"
                                            >
                                                <Trash2 className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Boards Display */}
                        <div className="lg:col-span-3">
                            {selectedUserId ? (
                                <>
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                            {allUsers.find((u) => u.id === selectedUserId)?.name}&apos;s Boards
                                        </h2>
                                        <p className="text-sm text-slate-600">
                                            {selectedUserBoards.length} {selectedUserBoards.length === 1 ? 'board' : 'boards'}
                                        </p>
                                    </div>

                                    {selectedUserBoards.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
                                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 mb-4">
                                                <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-slate-600">No boards created yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {selectedUserBoards.map((board) => (
                                                <div key={board.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                                                    <Board
                                                        board={board}
                                                        onUpdateBoard={(updates) => handleUpdateBoard(board.id, selectedUserId, updates)}
                                                        onDeleteBoard={() => handleDeleteBoard(board.id, selectedUserId)}
                                                        isAdmin={true}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 mb-4">
                                        <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-600">Select a user to view their boards</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
