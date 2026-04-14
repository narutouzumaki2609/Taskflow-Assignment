# TaskFlow

A full-stack task management system for teams. Create projects, add tasks, assign them to people, track progress on a drag-and-drop Kanban board — all from a single `docker compose up`.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Running Locally](#running-locally)
4. [Test Credentials](#test-credentials)
5. [API Reference](#api-reference)
6. [What I'd Do With More Time](#what-id-do-with-more-time)

---

## 1. Overview

### What it does

| Feature | Detail |
|---|---|
| Auth | Register / Login — JWT stored in `localStorage`, persists on refresh |
| Projects | Create, edit, delete projects |
| Tasks | Create, edit, delete, assign tasks with status and priority |
| Kanban board | Drag cards between To Do / In Progress / Done columns |
| List view | Flat filterable task list as an alternative to the board |
| Filters | Filter tasks by status and assignee |
| Optimistic UI | Status changes apply instantly in the UI; revert on API failure |
| Dark mode | System-preference aware, togglable, persisted across sessions |
| Responsive | Works at 375 px (mobile) and 1280 px (desktop) |

### Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, React Router v6, react-hook-form, @hello-pangea/dnd |
| **Styling** | CSS Modules — no external component library |
| **Backend** | mock apis using json-server|
| **Container** | Docker, Docker Compose |

### Repo layout

```
taskflow/
│
├── mock-api/
│   ├── Dockerfile
│   ├── index.js
│   ├── db.json
│   ├── package.json
│
├── taskflow_frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│
├── docker-compose.yml
├── .env.example  
├── .gitignore
├── README.md   
```

---

## 2. Architecture Decisions

### React + TypeScript + Vite

TypeScript catches API contract breaks at compile time — a renamed field is a build error, not a silent runtime bug. Vite was chosen over CRA for faster dev startup and smaller production bundles.

### No Component Library

Built all UI from scratch with CSS Modules. Libraries like MUI or shadcn add 300+ kB to the bundle and impose a visual identity. For this scope, the tradeoff isn't worth it.

### CSS Modules + CSS Custom Properties

Design tokens live in globals.css as CSS variables. ThemeContext flips a single data-theme attribute on <html> to switch themes — no re-render cascade, no runtime style injection.

### Two Contexts, No State Library

AuthContext (JWT + user) and ThemeContext (dark/light) are the only globals. Server state lives in useState inside each page — projects and tasks aren't shared across pages, so a global store adds indirection with no benefit.

### Nested Layout Routes for Auth Guards

ProtectedLayout redirects to /login if unauthenticated. AuthLayout redirects to /projects if already logged in. Both use React Router v6's layout nesting — no custom HOC or wrapper component needed.

### Centralised API Layer

All fetch calls live in src/api/client.ts. Token injection, 204 handling, and error parsing happen once. UI components never call fetch directly.

### Multi-stage Docker builds

Both Dockerfiles use two stages:

- **Backend**: file added in the code
- **Frontend**: file added in the code

This keeps both images lean and avoids shipping compilers or `node_modules` into production.

---

## 3. Running Locally

The only prerequisite is **Docker Desktop** (or Docker Engine + the Compose plugin). No Python, Node, or database installation needed.

```bash
git clone https://github.com/narutouzumaki2609/Taskflow-Assignment.git
cd taskflow
cp .env.example .env
docker compose up --build

```

Once you see `🚀  Starting application...` in the `api` logs, everything is ready:

| Service | URL |
|---|---|
| **React app** | http://localhost:3000 |
| **Django API** | http://localhost:4000 |
To stop and remove containers (data is preserved in the `postgres_data` volume):

```bash
docker compose down
```
## 5. Test Credentials

A management command seeds a test user and sample data on first run:

```
Email:    sus@gmail.com
Password: Asasasas
```

This user is pre-loaded with:
- 3 sample projects
- 6 tasks across projects in various statuses

## 6. API Reference

**Base URL:** `http://localhost:4000`

All endpoints except `POST /auth/register` and `POST /auth/login` require:

```
Authorization: Bearer <token>
```

### Auth

#### `POST /auth/register`

Create a new account and receive a JWT.

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

```json
// 201 Created
{
  "token": "<jwt>",
  "user": {
    "id": "3f7a9c12-...",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

#### `POST /auth/login`

Exchange credentials for a JWT.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "secret123"
}
```

```json
// 200 OK
{
  "token": "<jwt>",
  "user": {
    "id": "3f7a9c12-...",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

### Projects

#### `GET /projects`

Return all projects accessible to the authenticated user.

```http
GET /projects
Authorization: Bearer <token>
```

```json
// 200 OK
{
  "projects": [
    {
      "id": "a1b2c3d4-...",
      "name": "Website Redesign",
      "description": "Q2 project",
      "owner_id": "3f7a9c12-...",
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

#### `POST /projects`

Create a new project.

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Project",
  "description": "Optional description"
}
```

```json
// 201 Created
{
  "id": "b2c3d4e5-...",
  "name": "New Project",
  "description": "Optional description",
  "owner_id": "3f7a9c12-...",
  "created_at": "2026-04-09T10:00:00Z"
}
```

---

#### `GET /projects/:id`

Return a project with its full task list.

```http
GET /projects/a1b2c3d4-...
Authorization: Bearer <token>
```

```json
// 200 OK
{
  "id": "a1b2c3d4-...",
  "name": "Website Redesign",
  "description": "Q2 project",
  "owner_id": "3f7a9c12-...",
  "created_at": "2026-04-01T10:00:00Z",
  "tasks": [
    {
      "id": "c3d4e5f6-...",
      "title": "Design homepage",
      "description": "Figma mockup + responsive breakpoints",
      "status": "in_progress",
      "priority": "high",
      "assignee_id": "3f7a9c12-...",
      "due_date": "2026-04-15",
      "project_id": "a1b2c3d4-...",
      "created_at": "2026-04-02T09:00:00Z",
      "updated_at": "2026-04-10T14:30:00Z"
    }
  ]
}
```

---

#### `PATCH /projects/:id`

Update a project's name or description. All fields optional.

```http
PATCH /projects/a1b2c3d4-...
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Website Redesign 2.0",
  "description": "Updated scope"
}
```

```json
// 200 OK — returns the full updated project object (same shape as GET /projects/:id)
```

---

#### `DELETE /projects/:id`

```http
DELETE /projects/a1b2c3d4-...
Authorization: Bearer <token>
```

```
// 204 No Content
```

---

### Tasks

#### `GET /projects/:id/tasks`

Return tasks for a project. Supports optional query filters.

```http
GET /projects/a1b2c3d4-.../tasks?status=todo&assignee=3f7a9c12-...
Authorization: Bearer <token>
```

| Parameter | Values | Description |
|---|---|---|
| `status` | `todo` \| `in_progress` \| `done` | Filter by status |
| `assignee` | UUID | Filter by assignee user ID |

```json
// 200 OK
{
  "tasks": [ /* task objects */ ]
}
```

---

#### `POST /projects/:id/tasks`

Create a task inside a project.

```http
POST /projects/a1b2c3d4-.../tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design homepage",
  "description": "Figma mockup + responsive breakpoints",
  "priority": "high",
  "assignee_id": "3f7a9c12-...",
  "due_date": "2026-04-15"
}
```

```json
// 201 Created — returns the full task object
{
  "id": "c3d4e5f6-...",
  "title": "Design homepage",
  "description": "Figma mockup + responsive breakpoints",
  "status": "todo",
  "priority": "high",
  "assignee_id": "3f7a9c12-...",
  "due_date": "2026-04-15",
  "project_id": "a1b2c3d4-...",
  "created_at": "2026-04-11T08:00:00Z",
  "updated_at": "2026-04-11T08:00:00Z"
}
```

---

#### `PATCH /tasks/:id`

Update any task fields. All fields are optional.

```http
PATCH /tasks/c3d4e5f6-...
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "done",
  "priority": "low",
  "due_date": "2026-04-20"
}
```

```json
// 200 OK — returns the full updated task object
```

---

#### `DELETE /tasks/:id`

```http
DELETE /tasks/c3d4e5f6-...
Authorization: Bearer <token>
```

```
// 204 No Content
```

---

### Error Responses

All errors follow this consistent shape:

```json
// 400 Validation error
{
  "error": "validation failed",
  "fields": {
    "email": "Enter a valid email address.",
    "password": "This field is required."
  }
}

// 401 Missing or invalid token
{ "error": "unauthorized" }

// 403 Authenticated but not the resource owner
{ "error": "forbidden" }

// 404 Resource does not exist
{ "error": "not found" }
```

---

## 7. What I'd Do With More Time
Testing: Vitest + React Testing Library for components (form validation, optimistic revert, empty states), plus Playwright for one or two happy-path E2E flows (register → create project → create task → drag to done).
The drag and drop feature is client-side only (no api call), with a proper backend we can handle it.
