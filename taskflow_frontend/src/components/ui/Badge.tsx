import React from 'react';
import type { TaskStatus, TaskPriority } from '../../types';
import styles from './Badge.module.css';

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const labels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };
  return (
    <span className={`${styles.badge} ${styles[`status_${status}`]}`}>
      {labels[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const labels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Med',
    high: 'High',
  };
  return (
    <span className={`${styles.badge} ${styles[`priority_${priority}`]}`}>
      {labels[priority]}
    </span>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.7s linear infinite' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="var(--border-strong)" strokeWidth="2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  const hue = name
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `hsl(${hue}, 45%, 35%)`,
      }}
      title={name}
    >
      {initials}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.empty}>
      {icon && <span className={styles.emptyIcon}>{icon}</span>}
      <p className={styles.emptyTitle}>{title}</p>
      {description && <p className={styles.emptyDesc}>{description}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={styles.errorBox}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
