export type Role = 'user' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
}

export interface Card {
    id: string;
    title: string;
    description: string;
    columnId: string;
    userId: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Column {
    id: string;
    title: string;
    order: number;
    boardId: string;
}

export interface Board {
    id: string;
    title: string;
    userId: string;
    userName: string;
    columns: Column[];
    cards: Card[];
    createdAt: string;
    updatedAt: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
    isAdmin: boolean;
    isUser: boolean;
}
