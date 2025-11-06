'use client';

import React from 'react';
import { Card as CardType } from '@/lib/types';
import { Trash2, Calendar, Zap } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

interface CardProps {
    card: CardType;
    index: number;
    onClick: () => void;
    onDelete: () => void;
    isAdmin?: boolean;
}

export default function Card({ card, index, onClick, onDelete, isAdmin }: CardProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    badge: 'bg-red-100 text-red-700',
                    icon: 'text-red-600',
                };
            case 'medium':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    badge: 'bg-yellow-100 text-yellow-700',
                    icon: 'text-yellow-600',
                };
            case 'low':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    badge: 'bg-green-100 text-green-700',
                    icon: 'text-green-600',
                };
            default:
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    badge: 'bg-slate-100 text-slate-700',
                    icon: 'text-slate-600',
                };
        }
    };

    const colors = getPriorityColor(card.priority);

    return (
        <Draggable draggableId={card.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                    className={`rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer transition-all border ${colors.bg} ${colors.border} hover:border-blue-300 group bg-white ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 opacity-95' : ''
                        }`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors">{card.title}</h4>
                            {card.description && (
                                <p className="text-xs text-slate-600 line-clamp-2 mt-2">{card.description}</p>
                            )}
                        </div>
                        {!isAdmin && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="p-1.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                title="Delete card"
                            >
                                <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${colors.badge} flex items-center gap-1`}>
                            <Zap className={`w-3 h-3 ${colors.icon}`} />
                            {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
                        </span>
                        {card.dueDate && (
                            <span className="text-slate-600 text-xs flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {card.dueDate}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}
