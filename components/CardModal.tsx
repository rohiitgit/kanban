'use client';

import React, { useState } from 'react';
import { Card as CardType } from '@/lib/types';
import { X, Zap } from 'lucide-react';

interface CardModalProps {
    card: CardType | null;
    onSave: (card: Omit<CardType, 'id' | 'columnId' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
    onClose: () => void;
}

export default function CardModal({ card, onSave, onClose }: CardModalProps) {
    const [title, setTitle] = useState(card?.title || '');
    const [description, setDescription] = useState(card?.description || '');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(card?.priority || 'medium');
    const [dueDate, setDueDate] = useState(card?.dueDate || '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            title: title.trim(),
            description: description.trim(),
            priority,
            dueDate: dueDate || undefined,
        });
    };

    const priorityOptions = [
        { value: 'low', label: 'Low', color: 'text-green-600' },
        { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
        { value: 'high', label: 'High', color: 'text-red-600' },
    ];

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900">
                        {card ? '✏️ Edit Card' : '✨ New Card'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Task Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setErrors({ ...errors, title: '' });
                            }}
                            placeholder="What needs to be done?"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        {errors.title && <p className="text-sm text-red-600 mt-1.5">{errors.title}</p>}
                    </div>

                    {/* Description Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details about this task..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Priority Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2.5">Priority Level</label>
                        <div className="grid grid-cols-3 gap-2">
                            {priorityOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setPriority(option.value as 'low' | 'medium' | 'high')}
                                    className={`px-3 py-2.5 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-center gap-1.5 ${priority === option.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400'
                                        }`}
                                >
                                    <Zap className={`w-3.5 h-3.5 ${option.color}`} />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Due Date Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 rounded-lg font-semibold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            {card ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
