import { type TaskStatus, type TaskPriority } from '../types';
import { format, parseISO, isValid } from 'date-fns';

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date?: string): string {
  if (!date) return '—';
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : '—';
  } catch {
    return '—';
  }
}

export function getStatusLabel(status: TaskStatus): string {
  return { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }[status];
}

export function getPriorityLabel(priority: TaskPriority): string {
  return { low: 'Low', medium: 'Medium', high: 'High' }[priority];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { error?: string; message?: string };
    return e.error || e.message || 'Something went wrong';
  }
  return 'Something went wrong';
}
