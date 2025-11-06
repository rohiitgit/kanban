# Kanban Board Application

A collaborative kanban board application built with Next.js, TypeScript, and Tailwind CSS. The app supports two roles: **Users** who can manage personal kanban boards, and **Admins** who can manage all users and view their boards.

## Features

### For Users
- ✅ Create and manage personal kanban boards
- ✅ Add columns (To Do, In Progress, Done, etc.)
- ✅ Create, edit, and delete cards
- ✅ Set card priority (Low, Medium, High)
- ✅ Add due dates to cards
- ✅ Responsive UI for desktop and mobile
- ✅ Data persists using localStorage

### For Admins
- 👨‍💼 View all users in the system
- 👀 Access and view all user boards
- 📋 Manage all cards in user boards (read, create, edit, delete)
- 🗑️ Delete users and their boards
- 🗑️ Delete specific boards
- 📊 Dashboard with user management sidebar

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **Icons**: Lucide React
- **Storage**: Browser localStorage

## Project Structure

```
/
├── app/
│   ├── auth/login/          # Login page for role selection
│   ├── user/                # User dashboard
│   ├── admin/               # Admin dashboard
│   ├── layout.tsx           # Root layout with AuthProvider
│   ├── page.tsx             # Landing page (redirects based on auth)
│   └── globals.css          # Global styles
├── components/
│   ├── Board.tsx            # Main kanban board component
│   ├── Column.tsx           # Column component with cards
│   ├── Card.tsx             # Individual card component
│   └── CardModal.tsx        # Modal for creating/editing cards
├── lib/
│   ├── types/index.ts       # TypeScript type definitions
│   ├── context/AuthContext.tsx  # Authentication context
│   └── utils.ts             # Utility functions
└── package.json

```

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

### First Time Setup

1. Visit the app and you'll be redirected to the login page
2. Enter your name and email
3. Select your role:
   - **User**: Create and manage personal kanban boards
   - **Admin**: Manage users and view all boards

### User Workflow

1. After logging in as a user, you'll see your dashboard
2. Create a new board by clicking "New Board"
3. Add columns to organize your workflow
4. Click "Add Card" to create new tasks
5. Edit card details (title, description, priority, due date)
6. Delete cards or columns as needed

### Admin Workflow

1. After logging in as admin, you'll access the admin dashboard
2. See a list of all users on the left sidebar
3. Click on a user to view their boards
4. View, edit, and delete any user's cards
5. Delete entire boards or remove users from the system

## Data Structure

### User
```typescript
{
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}
```

### Board
```typescript
{
  id: string;
  title: string;
  userId: string;
  userName: string;
  columns: Column[];
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}
```

### Card
```typescript
{
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
```

## Storage

All data is stored in the browser's localStorage:
- `kanban_user`: Current logged-in user
- `kanban_all_users`: List of all registered users
- `kanban_boards_{userId}`: Boards for a specific user

**Note**: This is a frontend-only implementation. For production, integrate with a backend API and database.

## Future Enhancements

- 🔐 Backend authentication with JWT
- 💾 Database integration (PostgreSQL, MongoDB, etc.)
- 📈 Analytics and reporting
- 🔔 Real-time notifications
- 👥 Team collaboration and sharing
- 📱 Mobile app
- 🎨 Theme customization
- 📊 Board templates
- 🔍 Search and filters
- ♻️ Undo/Redo functionality

## License

MIT

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
