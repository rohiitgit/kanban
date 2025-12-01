'use client';

import React, { useState } from 'react';
import { Card as CardType, Column as ColumnType } from '@/lib/types';
import Card from '@/components/Card';
import CardModal from '@/components/CardModal';
import { Trash2, Plus } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';

interface ColumnProps {
    column: ColumnType;
    cards: CardType[];
    onAddCard: (columnId: string, card: Omit<CardType, 'id' | 'columnId' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
    onUpdateCard: (cardId: string, updates: Partial<CardType>) => void;
    onDeleteCard: (cardId: string) => void;
    onDeleteColumn: (columnId: string) => void;
    isAdmin?: boolean;
}

export default function Column({
    column,
    cards,
    onAddCard,
    onUpdateCard,
    onDeleteCard,
    onDeleteColumn,
    isAdmin,
}: ColumnProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

    const columnCards = cards.filter((card) => card.columnId === column.id);

    const handleCardClick = (card: CardType) => {
        // Only admins can edit cards
        if (isAdmin) {
            setSelectedCard(card);
            setIsModalOpen(true);
        }
    };

    const handleAddCard = () => {
        setSelectedCard(null);
        setIsModalOpen(true);
    };

    const handleSaveCard = (cardData: Omit<CardType, 'id' | 'columnId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (selectedCard) {
            onUpdateCard(selectedCard.id, cardData);
        } else {
            onAddCard(column.id, cardData);
        }
        setIsModalOpen(false);
        setSelectedCard(null);
    };

    return (
        <div className="min-w-80 h-fit bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
            {/* Column Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 truncate">{column.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 border border-blue-200 rounded-full">
                            <span className="text-sm font-semibold text-blue-700">{columnCards.length}</span>
                        </span>
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => onDeleteColumn(column.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-all border border-transparent hover:border-red-200 group ml-2"
                        title="Delete column"
                    >
                        <Trash2 className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                    </button>
                )}
            </div>

            {/* Cards Container */}
            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-96 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : ''
                            }`}
                    >
                        {columnCards.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <svg className="w-8 h-8 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p className="text-sm">No cards yet</p>
                            </div>
                        ) : (
                            columnCards.map((card, index) => (
                                <Card
                                    key={card.id}
                                    card={card}
                                    index={index}
                                    onClick={() => handleCardClick(card)}
                                    onDelete={() => onDeleteCard(card.id)}
                                    isAdmin={isAdmin}
                                />
                            ))
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {/* Add Card Button - Only for Admins */}
            {isAdmin && (
                <div className="px-4 py-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={handleAddCard}
                        className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold border border-slate-300 hover:border-slate-400"
                    >
                        <Plus className="w-4 h-4" />
                        Add Card
                    </button>
                </div>
            )}

            {/* Modal - Only for Admins */}
            {isModalOpen && isAdmin && (
                <CardModal
                    card={selectedCard}
                    onSave={handleSaveCard}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedCard(null);
                    }}
                />
            )}
        </div>
    );
}
