'use client';

import React, { useState } from 'react';
import { Board as BoardType, Card as CardType, Column as ColumnType } from '@/lib/types';
import Column from './Column';
import { Plus, Trash2 } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface BoardProps {
    board: BoardType;
    onUpdateBoard: (updates: Partial<BoardType>) => void;
    onDeleteBoard?: () => void;
    isAdmin?: boolean;
}

export default function Board({ board, onUpdateBoard, onDeleteBoard, isAdmin }: BoardProps) {
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    // Calculate progress based on cards in columns
    const totalCards = board.cards.length;
    const doneColumn = board.columns.find((col) => col.title.toLowerCase().includes('done'));
    const completedCards = doneColumn ? board.cards.filter((card) => card.columnId === doneColumn.id).length : 0;
    const progressPercentage = totalCards === 0 ? 0 : Math.round((completedCards / totalCards) * 100);

    const handleAddColumn = () => {
        if (newColumnTitle.trim()) {
            const newColumn: ColumnType = {
                id: `col_${Date.now()}`,
                title: newColumnTitle.trim(),
                order: board.columns.length,
                boardId: board.id,
            };
            onUpdateBoard({
                columns: [...board.columns, newColumn],
            });
            setNewColumnTitle('');
            setShowAddColumn(false);
        }
    };

    const handleDeleteColumn = (columnId: string) => {
        onUpdateBoard({
            columns: board.columns.filter((col) => col.id !== columnId),
            cards: board.cards.filter((card) => card.columnId !== columnId),
        });
    };

    const handleAddCard = (columnId: string, cardData: Omit<CardType, 'id' | 'columnId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        const newCard: CardType = {
            ...cardData,
            id: `card_${Date.now()}`,
            columnId,
            userId: board.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        onUpdateBoard({
            cards: [...board.cards, newCard],
        });
    };

    const handleUpdateCard = (cardId: string, updates: Partial<CardType>) => {
        onUpdateBoard({
            cards: board.cards.map((card) =>
                card.id === cardId ? { ...card, ...updates, updatedAt: new Date().toISOString() } : card
            ),
        });
    };

    const handleDeleteCard = (cardId: string) => {
        onUpdateBoard({
            cards: board.cards.filter((card) => card.id !== cardId),
        });
    };

    const handleDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        // If dropped outside any column
        if (!destination) return;

        // If dropped in the same position
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Find the card being dragged
        const card = board.cards.find((c) => c.id === draggableId);
        if (!card) return;

        // Update the card's column if it moved to a different column
        if (source.droppableId !== destination.droppableId) {
            handleUpdateCard(draggableId, { columnId: destination.droppableId });
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8 px-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{board.title}</h1>
                    <p className="text-sm text-slate-600 mt-2">Created by: <span className="text-slate-800 font-medium">{board.userName}</span></p>
                </div>
                <div className="flex items-center gap-6">
                    {/* Progress Circle */}
                    {totalCards > 0 && (
                        <div className="flex flex-col items-center">
                            <div className="relative w-20 h-20">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    {/* Background circle */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="#e2e8f0"
                                        strokeWidth="8"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="8"
                                        strokeDasharray={`${2 * Math.PI * 45}`}
                                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
                                        strokeLinecap="round"
                                        className="transition-all duration-500"
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                {/* Center text */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900">{progressPercentage}%</div>
                                        <div className="text-xs text-slate-500">Done</div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 mt-2">{completedCards}/{totalCards} tasks</p>
                        </div>
                    )}
                    {isAdmin && onDeleteBoard && (
                        <button
                            onClick={onDeleteBoard}
                            className="p-2 hover:bg-red-100 rounded-lg transition-all border border-red-200 hover:border-red-300 group"
                            title="Delete board"
                        >
                            <Trash2 className="w-6 h-6 text-red-600 group-hover:text-red-700" />
                        </button>
                    )}
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2">
                    {board.columns.map((column) => (
                        <Column
                            key={column.id}
                            column={column}
                            cards={board.cards}
                            onAddCard={handleAddCard}
                            onUpdateCard={handleUpdateCard}
                            onDeleteCard={handleDeleteCard}
                            onDeleteColumn={handleDeleteColumn}
                            isAdmin={isAdmin}
                        />
                    ))}

                    {(showAddColumn || board.columns.length === 0) && (
                        <div className="min-w-80 bg-white rounded-lg p-5 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
                            <input
                                type="text"
                                value={newColumnTitle}
                                onChange={(e) => setNewColumnTitle(e.target.value)}
                                placeholder="Column title"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddColumn();
                                    if (e.key === 'Escape') {
                                        setShowAddColumn(false);
                                        setNewColumnTitle('');
                                    }
                                }}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all mb-3"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddColumn}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-sm font-semibold shadow-lg"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddColumn(false);
                                        setNewColumnTitle('');
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all text-sm font-semibold border border-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {!showAddColumn && board.columns.length > 0 && (
                        <button
                            onClick={() => setShowAddColumn(true)}
                            className="min-w-80 p-5 bg-white rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600 font-semibold"
                        >
                            <Plus className="w-5 h-5" />
                            Add Column
                        </button>
                    )}
                </div>
            </DragDropContext>
        </div>
    );
}
