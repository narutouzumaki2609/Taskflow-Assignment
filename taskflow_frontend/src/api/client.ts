import type { AuthResponse, Project, Task, TaskFilters } from '../types';

const BASE_URL = 'http://localhost:4000';

function getToken(): string | null {
  return localStorage.getItem('tf_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) throw data;
  return data as T;
}

// Auth
export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Projects
export const projectsApi = {
  list: () => request<{ projects: Project[] }>('/projects'),
  get: (id: string) => request<Project>(`/projects/${id}`),
  create: (name: string, description?: string) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  update: (id: string, data: { name?: string; description?: string }) =>
    request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),
};

// Tasks
export const tasksApi = {
  list: (projectId: string, filters?: TaskFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.assignee) params.set('assignee', filters.assignee);
    const qs = params.toString();
    return request<{ tasks: Task[] }>(
      `/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`
    );
  },
  create: (
    projectId: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      assignee_id?: string;
      due_date?: string;
    }
  ) =>
    request<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: string,
    data: {
      title?: string;
      status?: string;
      priority?: string;
      assignee_id?: string;
      due_date?: string;
      description?: string;
    }
  ) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
