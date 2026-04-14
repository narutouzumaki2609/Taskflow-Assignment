import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Task, TaskStatus, TaskPriority, User } from '../../types';
import { Modal } from '../ui/Modal';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/Badge';
import styles from './TaskForm.module.css';

export interface TaskFormValues {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  due_date?: string;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormValues) => Promise<void>;
  initialValues?: Partial<Task>;
  users?: User[];
  serverError?: string;
  mode: 'create' | 'edit';
}

export function TaskFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  users = [],
  serverError,
  mode,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee_id: '',
      due_date: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: initialValues?.title ?? '',
        description: initialValues?.description ?? '',
        status: initialValues?.status ?? 'todo',
        priority: initialValues?.priority ?? 'medium',
        assignee_id: initialValues?.assignee_id ?? '',
        due_date: initialValues?.due_date?.slice(0, 10) ?? '',
      });
    }
  }, [open, initialValues, reset]);

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'New Task' : 'Edit Task'}
      width={520}
    >
      {serverError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorMessage message={serverError} />
        </div>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
        noValidate
      >
        <Input
          label="Title"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          autoFocus
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 2, message: 'At least 2 characters' },
          })}
        />
        <Textarea
          label="Description (optional)"
          placeholder="Add more detail…"
          {...register('description')}
        />

        <div className={styles.row}>
          <Select
            label="Status"
            options={statusOptions}
            {...register('status')}
          />
          <Select
            label="Priority"
            options={priorityOptions}
            {...register('priority')}
          />
        </div>

        <div className={styles.row}>
          <Select
            label="Assignee"
            options={assigneeOptions}
            {...register('assignee_id')}
          />
          <Input
            label="Due Date"
            type="date"
            {...register('due_date')}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {mode === 'create' ? 'Create Task' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
