# Project Architecture & File Guide

## 📂 Complete Project Structure

```
kanban/
├── app/
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx              # 🔐 Login & role selection page
│   ├── admin/
│   │   └── page.tsx                  # 👨‍💼 Admin dashboard
│   ├── user/
│   │   └── page.tsx                  # 👤 User dashboard
│   ├── layout.tsx                    # 🎯 Root layout + AuthProvider
│   ├── page.tsx                      # 🏠 Landing page (redirects)
│   └── globals.css                   # 🎨 Global Tailwind styles
│
├── components/
│   ├── Board.tsx                     # 📊 Main board component
│   ├── Column.tsx                    # 📋 Column with cards
│   ├── Card.tsx                      # 📝 Individual task card
│   └── CardModal.tsx                 # ✏️ Create/edit card modal
│
├── lib/
│   ├── types/
│   │   └── index.ts                  # 🔷 TypeScript types
│   ├── context/
│   │   └── AuthContext.tsx           # 🔐 Authentication context
│   └── utils.ts                      # 🛠️ Utility functions
│
├── public/                           # 📁 Static files
├── node_modules/                     # 📦 Dependencies
├── package.json                      # 📋 Dependencies & scripts
├── tsconfig.json                     # ⚙️ TypeScript config
├── next.config.ts                    # ⚙️ Next.js config
├── tailwind.config.ts                # 🎨 Tailwind config
├── postcss.config.mjs                # 🎨 PostCSS config
├── eslint.config.mjs                 # ✓ ESLint config
├── README.md                         # 📖 Full documentation
├── QUICKSTART.md                     # ⚡ Quick start guide
├── IMPLEMENTATION.md                 # 🔧 Implementation details
└── components.json                   # ⚙️ Component config

```

---

## 🔷 Type Definitions (`lib/types/index.ts`)

```typescript
Role = 'user' | 'admin'

User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

Board {
  id: string
  title: string
  userId: string
  userName: string
  columns: Column[]
  cards: Card[]
  createdAt: string
  updatedAt: string
}

Column {
  id: string
  title: string
  order: number
  boardId: string
}

Card {
  id: string
  title: string
  description: string
  columnId: string
  userId: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
  updatedAt: string
}

AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  isAdmin: boolean
  isUser: boolean
}
```

---

## 🔐 Authentication Flow (`lib/context/AuthContext.tsx`)

```
┌─────────────────────────────────────┐
│   AuthProvider (Root Layout)        │
├─────────────────────────────────────┤
│  - Reads user from localStorage     │
│  - Provides useAuth() hook          │
│  - Manages login/logout             │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │ useAuth()   │
        ├─────────────┤
        │ - user      │
        │ - isAuth    │
        │ - isAdmin   │
        │ - isUser    │
        │ - login()   │
        │ - logout()  │
        └─────────────┘
```

---

## 📊 Component Hierarchy

```
App (layout.tsx)
│
├── AuthProvider (context)
│
└── Routes
    ├── / (page.tsx)
    │   └── Redirect based on auth
    │
    ├── /auth/login (LoginPage)
    │   └── Role selection form
    │
    ├── /user (UserPage)
    │   └── Board[] (render multiple)
    │       └── Board
    │           ├── Column[]
    │           │   ├── Card[]
    │           │   │   └── Card (display)
    │           │   └── CardModal
    │           └── Column management
    │
    └── /admin (AdminPage)
        ├── User list (sidebar)
        └── Board display
            └── Board (for selected user)
                ├── Column[]
                │   ├── Card[]
                │   │   └── Card (display)
                │   └── CardModal
                └── Column management
```

---

## 💾 Data Flow & Storage

### localStorage Keys

```
┌──────────────────────────────────────┐
│ localStorage Structure               │
├──────────────────────────────────────┤
│                                      │
│ kanban_user                          │
│ └─ { id, name, email, role, ... }   │
│                                      │
│ kanban_all_users                     │
│ └─ [ { User }, { User }, ... ]      │
│                                      │
│ kanban_boards_user_1                 │
│ └─ [ { Board }, { Board }, ... ]    │
│                                      │
│ kanban_boards_user_2                 │
│ └─ [ { Board }, { Board }, ... ]    │
│                                      │
└──────────────────────────────────────┘
```

### State Management Pattern

```
User Action
    │
    ▼
React Hook (useState)
    │
    ▼
Component Handler (onClick, onChange, etc.)
    │
    ▼
Update localStorage
    │
    ▼
Update React State
    │
    ▼
Re-render Component
```

---

## 🎯 User Journey

### User Role Flow

```
User visits /
    │
    ├─ Not logged in → /auth/login
    │   │
    │   └─ Enter name, email, select "User"
    │       │
    │       ├─ Save to localStorage
    │       ├─ Store in global users list
    │       └─ Redirect to /user
    │
    └─ Logged in as User → /user
        │
        ├─ Load user's boards
        │   └─ From kanban_boards_{userId}
        │
        └─ Dashboard Features:
            ├─ Create board
            ├─ View boards
            │   └─ Each board has:
            │       ├─ Columns
            │       ├─ Cards in columns
            │       └─ Card actions (add, edit, delete)
            └─ Delete board
```

### Admin Role Flow

```
Admin visits /
    │
    ├─ Not logged in → /auth/login
    │   │
    │   └─ Enter name, email, select "Admin"
    │       │
    │       ├─ Save to localStorage
    │       ├─ Store in global users list
    │       └─ Redirect to /admin
    │
    └─ Logged in as Admin → /admin
        │
        ├─ Load all users
        │   └─ From kanban_all_users
        │
        └─ Dashboard Features:
            ├─ User list sidebar
            │   ├─ Click user → view their boards
            │   └─ Delete user → remove all data
            │
            ├─ View any user's boards
            │   └─ From kanban_boards_{userId}
            │
            └─ Full control over any board
                ├─ Create columns
                ├─ Create/edit/delete cards
                ├─ Delete columns
                └─ Delete boards
```

---

## 🎨 Component Details

### Board.tsx
```
Props:
  - board: BoardType
  - onUpdateBoard: (updates) => void
  - onDeleteBoard?: () => void
  - isAdmin?: boolean

Renders:
  - Board title & metadata
  - Column components (multiple)
  - Add column form
  - Columns have cards
```

### Column.tsx
```
Props:
  - column: ColumnType
  - cards: CardType[]
  - onAddCard, onUpdateCard, onDeleteCard
  - onDeleteColumn
  - isAdmin?: boolean

Renders:
  - Column title
  - Card list (filtered by columnId)
  - CardModal for create/edit
  - Add card button
```

### Card.tsx
```
Props:
  - card: CardType
  - onClick: () => void
  - onDelete: () => void
  - isAdmin?: boolean

Renders:
  - Card title & description
  - Priority badge (colored)
  - Due date (if exists)
  - Hover delete button (if admin)
```

### CardModal.tsx
```
Props:
  - card: CardType | null (null for create)
  - onSave: (cardData) => void
  - onClose: () => void

Renders:
  - Modal overlay
  - Title input (required)
  - Description textarea
  - Priority dropdown
  - Due date picker
  - Cancel & Save buttons
```

---

## 🔄 Key Interactions

### Create Card
```
User clicks "Add Card"
    ↓
CardModal opens (card = null)
    ↓
User fills form
    ↓
Clicks "Create"
    ↓
onSave() called with card data
    ↓
handleAddCard() creates new card with:
  - Unique ID
  - Current timestamp
  - Column association
    ↓
Updates board in state
    ↓
Saves to localStorage
    ↓
Component re-renders with new card
```

### Edit Card
```
User clicks on card
    ↓
CardModal opens (card = existing card)
    ↓
Form pre-filled with card data
    ↓
User modifies fields
    ↓
Clicks "Update"
    ↓
onSave() called
    ↓
handleUpdateCard() finds card and updates fields
    ↓
Updates updatedAt timestamp
    ↓
Saves to localStorage
    ↓
Component re-renders with updated card
```

### Delete Card
```
User hovers card → delete icon appears
    ↓
Clicks delete icon
    ↓
onDelete() called
    ↓
Card removed from board.cards array
    ↓
Saves to localStorage
    ↓
Component re-renders without card
```

---

## 🔐 Role-Based Access Control

```
┌─────────────────────────────────────┐
│         User Dashboard              │
├─────────────────────────────────────┤
│ ✓ View own boards                   │
│ ✓ Create own boards                 │
│ ✓ Edit own boards                   │
│ ✓ Delete own boards                 │
│ ✓ Full card management              │
│ ✗ View other user boards            │
│ ✗ Manage other users                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       Admin Dashboard               │
├─────────────────────────────────────┤
│ ✓ View all users                    │
│ ✓ Delete users                      │
│ ✓ View any user's boards            │
│ ✓ Delete any board                  │
│ ✓ Create cards for any user         │
│ ✓ Edit cards for any user           │
│ ✓ Delete cards for any user         │
│ ✗ Create own boards (optional)      │
└─────────────────────────────────────┘
```

---

## 🛣️ Route Structure

```
/ (page.tsx)
  ├─ Authenticated? No → /auth/login
  ├─ Is User? → /user
  └─ Is Admin? → /admin

/auth/login (LoginPage)
  ├─ Role selection
  └─ Submit → creates user & redirects

/user (UserPage)
  ├─ Requires: isUser === true
  ├─ Shows: User's boards
  └─ Actions: Create, edit, delete boards & cards

/admin (AdminPage)
  ├─ Requires: isAdmin === true
  ├─ Shows: All users + their boards
  └─ Actions: Manage users & all boards
```

---

## 📦 Dependencies

```json
{
  "next": "16.0.1",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "typescript": "^5",
  "tailwindcss": "^4",
  "lucide-react": "^0.552.0"
}
```

---

## ✅ Checklist for Understanding

- [ ] Read types in `lib/types/index.ts`
- [ ] Understand `AuthContext` in `lib/context/AuthContext.tsx`
- [ ] Review `Board.tsx` component structure
- [ ] Trace data flow through `Column.tsx` → `Card.tsx`
- [ ] Check modal form in `CardModal.tsx`
- [ ] Review user page logic in `app/user/page.tsx`
- [ ] Review admin page logic in `app/admin/page.tsx`
- [ ] Test login flow in `app/auth/login/page.tsx`
- [ ] Understand localStorage data structure
- [ ] Check role-based access patterns

---

**This architecture provides a complete, type-safe frontend implementation with proper separation of concerns and role-based access control.** 🎉
