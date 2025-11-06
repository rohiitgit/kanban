# Quick Start Guide

## 🚀 Get Running in 2 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
```
http://localhost:3000
```

---

## 📱 Try It Out

### Test User Account
```
Name: John Doe
Email: john@example.com
Role: User (select this)
```

**What you can do:**
- Create a board
- Add columns
- Add cards with title, description, priority, due date
- Edit and delete cards
- Create multiple boards

---

### Test Admin Account
```
Name: Admin User
Email: admin@example.com
Role: Admin (select this)
```

**What you can do:**
- See all users in left sidebar
- Click on a user to view their boards
- Edit/delete any card
- Delete entire boards
- Remove users

---

## 🎮 Features to Try

1. **Create a Board**
   - Click "New Board" button
   - Enter board title
   - Press Enter or click Create

2. **Add Columns**
   - Click "Add Column" button at the right
   - Name your columns (To Do, In Progress, Done, etc.)

3. **Create Cards**
   - Click "Add Card" in any column
   - Fill in title (required)
   - Add description, priority, and due date
   - Click "Create"

4. **Edit Cards**
   - Click on any card
   - Modal opens with all editable fields
   - Change what you want
   - Click "Update"

5. **Delete Cards/Columns**
   - Cards have delete icon on hover
   - Columns have delete icon in header
   - Admins can delete everything

---

## 🔑 Key Shortcuts

| Action | Shortcut |
|--------|----------|
| Submit Form | Enter |
| Cancel Form | Escape |
| Add Card | Click "Add Card" button |
| Edit Card | Click on card |
| Delete | Click trash icon |

---

## 📊 Data Storage

All data is saved in your browser's localStorage automatically:
- When you create accounts, they're stored
- When you create boards, they're saved
- When you edit cards, changes are saved
- Even if you close the browser, data persists!

---

## 🐛 Troubleshooting

**Q: Changes not showing?**
A: Try refreshing the page (Cmd+R or Ctrl+R)

**Q: Want to clear all data?**
A: Open DevTools (F12) → Application → Local Storage → Clear All

**Q: Can't login as admin?**
A: Make sure you select the "Admin" button before submitting

**Q: Board looks weird?**
A: Make sure you're on desktop/wide screen (uses horizontal scroll on mobile)

---

## 📚 File Locations

- **User Dashboard**: `/user`
- **Admin Dashboard**: `/admin`
- **Login**: `/auth/login`
- **Home**: `/` (auto-redirects)

---

🎨 **UI Elements**

- **Blue gradient buttons** - Primary actions
- **Clean white cards** - Content containers
- **Light blue accents** - Selection states  
- **Red/Yellow/Green badges** - Priority levels

---

## 💡 Tips

1. **Try both roles** - Create a user account, then create an admin account to see the difference
2. **Create multiple boards** - Users can create as many as they want
3. **Test admin features** - Log in as admin to see all user boards
4. **Use priorities** - Color coding helps visualize importance
5. **Add due dates** - Plan your timeline

---

## ✅ Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Start dev server (`npm run dev`)
- [ ] Open http://localhost:3000
- [ ] Create a user account
- [ ] Create a board
- [ ] Add columns
- [ ] Add cards with different priorities
- [ ] Try editing a card
- [ ] Delete a card
- [ ] Create an admin account
- [ ] View user boards from admin dashboard
- [ ] Try all features!

---

## 🎯 Next Level

Once you're comfortable, check out:
- `/IMPLEMENTATION.md` - Technical details
- `/README.md` - Full documentation
- Components in `/components` - React component structure
- Types in `/lib/types` - Data structures

---

## 📞 Need Help?

Everything is built with:
- Next.js (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- Lucide React (icons)

Check the code in the repository - it's well-commented!

---

**You're all set! Have fun with your kanban app! 🚀**
