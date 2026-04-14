import { useState } from 'react';
import type { Task, User } from '../../types';
import { StatusBadge, PriorityBadge, Avatar } from '../ui/Badge';
import { formatDate } from '../../utils';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  users: User[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export function TaskCard({ task, users, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const assignee = users.find((u) => u.id === task.assignee_id);

  const statusCycle: Task['status'][] = ['todo', 'in_progress', 'done'];
  const nextStatus = statusCycle[(statusCycle.indexOf(task.status) + 1) % statusCycle.length];

  const isOverdue =
    task.due_date &&
    task.status !== 'done' &&
    new Date(task.due_date) < new Date();

  return (
    <div className={`${styles.card} ${task.status === 'done' ? styles.done : ''}`}>
      <div className={styles.cardHeader}>
        <button
          className={styles.statusToggle}
          onClick={() => onStatusChange(task.id, nextStatus)}
          title={`Mark as ${nextStatus.replace('_', ' ')}`}
        >
          {task.status === 'done' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span className={styles.circle} />
          )}
        </button>

        <h4 className={styles.title} title={task.title}>
          {task.title}
        </h4>

        <div className={styles.menu}>
          <button
            className={styles.menuTrigger}
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            aria-label="Task actions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownItem}
                onClick={() => { onEdit(task); setMenuOpen(false); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
              <button
                className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                onClick={() => { onDelete(task.id); setMenuOpen(false); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.badges}>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <div className={styles.meta}>
          {task.due_date && (
            <span className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(task.due_date)}
            </span>
          )}
          {assignee && <Avatar name={assignee.name} size={22} />}
        </div>
      </div>
    </div>
  );
}
