# TaskFlow — Frontend

A minimal but complete task management system built with React + TypeScript.

## Design Choice

**No external component library** — built from scratch with CSS Modules.

**Aesthetic: Industrial Utilitarian**
- Dark-first palette: near-black canvas (`#0d0d0d`) with amber accent (`#e8a020`)
- Typography: **Syne** (display/headings) + **JetBrains Mono** (metadata/badges)
- CSS variables for full dark/light theming
- Subtle grid backgrounds, layered borders, micro-animations

## Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Routing | React Router v6 |
| Forms | react-hook-form |
| Styling | CSS Modules (zero external UI lib) |
| Drag & Drop | @hello-pangea/dnd (bonus) |
| Date formatting | date-fns |

## Features

- **Auth**: Register / Login with JWT stored in localStorage, persists across refreshes
- **Protected routes**: Redirect to `/login` if unauthenticated; 404 page for unknown routes
- **Projects**: List, create, edit, delete with confirmation modal
- **Tasks**: Board view (Kanban with drag-and-drop) + List view
- **Progress bar**: Live completion percentage per project
- **Filters**: By status and assignee on both board and list views
- **Optimistic UI**: Status changes and drag-and-drop update instantly, revert on API error
- **Dark mode** ✦ bonus: Toggle persists via `localStorage`; respects `prefers-color-scheme` on first visit
- **Drag-and-drop** ✦ bonus: `@hello-pangea/dnd` — drag cards between status columns or reorder within a column
- **Responsive**: Works at 375px (mobile) and 1280px (desktop)
- **Empty states**: Meaningful messages everywhere — no blank boxes, no `undefined`
- **Loading states**: Spinners on all async operations, never a blank screen
- **Error states**: Inline error messages with retry options on every fetch

## Folder Structure

```
src/
├── api/
│   └── client.ts          # All API calls, typed
├── components/
│   ├── layout/
│   │   ├── Layout.tsx     # ProtectedLayout + AuthLayout wrappers
│   │   ├── Layout.module.css
│   │   ├── Navbar.tsx     # Top nav: brand, user, theme toggle, logout
│   │   └── Navbar.module.css
│   ├── tasks/
│   │   ├── TaskCard.tsx   # Individual task card with status toggle + menu
│   │   ├── TaskCard.module.css
│   │   ├── TaskForm.tsx   # Create/edit task modal form
│   │   └── TaskForm.module.css
│   └── ui/
│       ├── Badge.tsx      # StatusBadge, PriorityBadge, Avatar, EmptyState, ErrorMessage, Spinner
│       ├── Badge.module.css
│       ├── Button.tsx     # Multi-variant button (primary/secondary/ghost/danger)
│       ├── Button.module.css
│       ├── Input.tsx      # Input, Textarea, Select with label + error
│       ├── Input.module.css
│       ├── Modal.tsx      # Accessible modal (Escape key, backdrop click)
│       └── Modal.module.css
├── context/
│   ├── AuthContext.tsx    # Auth state + localStorage persistence
│   └── ThemeContext.tsx   # Dark/light theme + localStorage persistence
├── pages/
│   ├── AuthPage.tsx       # Login + Register (tab-switched)
│   ├── AuthPage.module.css
│   ├── ProjectsPage.tsx   # Projects list + create modal
│   ├── ProjectsPage.module.css
│   ├── ProjectDetailPage.tsx  # Board + list view, task CRUD, filters
│   └── ProjectDetailPage.module.css
├── styles/
│   └── globals.css        # CSS variables, resets, animations
├── types/
│   └── index.ts           # All TypeScript types
├── utils/
│   └── index.ts           # Helpers: formatDate, getInitials, extractErrorMessage
├── App.tsx                # Router setup
└── main.tsx               # React root
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (requires backend at http://localhost:4000)
npm run dev

# Build for production
npm run build
```

## API

Base URL: `http://localhost:4000`

See the backend spec for full endpoint documentation. The frontend API client is in `src/api/client.ts`.

## Notes

- The assignee selector currently shows only the logged-in user. In a real app, you'd add a `GET /projects/:id/members` endpoint and populate it from there.
- Drag-and-drop between status columns is wired via `@hello-pangea/dnd` in the board view (see TaskCard's status toggle for the optimistic update pattern).
