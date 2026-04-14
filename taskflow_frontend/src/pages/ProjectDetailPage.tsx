import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { projectsApi, tasksApi } from '../api/client';
import type { Project, Task, TaskStatus, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner, EmptyState, ErrorMessage } from '../components/ui/Badge';
import { TaskCard } from '../components/tasks/TaskCard';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskFormModal, type TaskFormValues } from '../components/tasks/TaskForm';
import { extractErrorMessage, formatDate } from '../utils';
import styles from './ProjectDetailPage.module.css';

interface EditProjectForm {
  name: string;
  description?: string;
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const [taskModal, setTaskModal] = useState<{ open: boolean; task?: Task }>({ open: false });
  const [taskError, setTaskError] = useState('');

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<EditProjectForm>();

  const teamMembers: User[] = user ? [user] : [];

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await projectsApi.get(id);
      setProject(data);
      setTasks(data.tasks ?? []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterAssignee && t.assignee_id !== filterAssignee) return false;
    return true;
  });

  // Task CRUD
  const openCreateTask = () => { setTaskModal({ open: true }); setTaskError(''); };
  const openEditTask = (task: Task) => { setTaskModal({ open: true, task }); setTaskError(''); };

  const handleCreateTask = async (data: TaskFormValues) => {
    if (!id) return;
    setTaskError('');
    try {
      const task = await tasksApi.create(id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        assignee_id: data.assignee_id || undefined,
        due_date: data.due_date || undefined,
      });
      setTasks((prev) => [task, ...prev]);
      setTaskModal({ open: false });
    } catch (err) {
      setTaskError(extractErrorMessage(err));
    }
  };

  const handleEditTask = async (data: TaskFormValues) => {
    const taskId = taskModal.task?.id;
    if (!taskId) return;
    setTaskError('');
    try {
      const updated = await tasksApi.update(taskId, {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignee_id: data.assignee_id || undefined,
        due_date: data.due_date || undefined,
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setTaskModal({ open: false });
    } catch (err) {
      setTaskError(extractErrorMessage(err));
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    const previous = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    try {
      const updated = await tasksApi.update(taskId, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      if (previous) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)));
      }
    }
  };

  const handleReorder = (reordered: Task[]) => setTasks(reordered);

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await tasksApi.delete(taskId);
    } catch {
      fetchProject();
    }
  };

  // Project edit/delete
  const openEditModal = () => {
    resetEdit({ name: project?.name ?? '', description: project?.description ?? '' });
    setProjectError('');
    setEditModal(true);
  };

  const handleEditProject = async (data: EditProjectForm) => {
    if (!id) return;
    setProjectError('');
    try {
      const updated = await projectsApi.update(id, data);
      setProject(updated);
      setEditModal(false);
    } catch (err) {
      setProjectError(extractErrorMessage(err));
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    setDeleteLoading(true);
    setProjectError('');
    try {
      await projectsApi.delete(id);
      navigate('/projects');
    } catch (err) {
      setProjectError(extractErrorMessage(err));
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.centred}>
        <Spinner size={28} />
        <span>Loading project…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centred}>
        <ErrorMessage message={error} onRetry={fetchProject} />
      </div>
    );
  }

  if (!project) return null;

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  const assigneeOptions = [
    { value: '', label: 'All assignees' },
    ...teamMembers.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/projects" className={styles.breadcrumbLink}>Projects</Link>
        <span className={styles.breadcrumbSep} aria-hidden>/</span>
        <span className={styles.breadcrumbCurrent}>{project.name}</span>
      </nav>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{project.name}</h1>
          {project.description && (
            <p className={styles.description}>{project.description}</p>
          )}
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(project.created_at)}
            </span>
            <span className={styles.metaItem}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {doneCount}/{tasks.length} done
            </span>
            {tasks.length > 0 && (
              <span className={styles.progressWrap}>
                <span className={styles.progressBar}>
                  <span
                    className={styles.progressFill}
                    style={{ width: `${progressPct}%` }}
                  />
                </span>
                <span className={styles.progressPct}>{progressPct}%</span>
              </span>
            )}
          </div>
        </div>

        <div className={styles.headerRight}>
          <Button variant="ghost" size="sm" onClick={openEditModal}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => { setDeleteModal(true); setProjectError(''); }}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>}>
            Delete
          </Button>
          <Button onClick={openCreateTask}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Select options={statusOptions} value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')} />
          <Select options={assigneeOptions} value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)} />
          {(filterStatus || filterAssignee) && (
            <Button variant="ghost" size="sm"
              onClick={() => { setFilterStatus(''); setFilterAssignee(''); }}>
              Clear filters
            </Button>
          )}
        </div>

        <div className={styles.viewToggle}>
          <button className={`${styles.viewBtn} ${viewMode === 'board' ? styles.activeView : ''}`}
            onClick={() => setViewMode('board')} title="Board view" aria-label="Board view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" />
            </svg>
          </button>
          <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.activeView : ''}`}
            onClick={() => setViewMode('list')} title="List view" aria-label="List view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Board view */}
      {viewMode === 'board' && (
        tasks.length === 0 ? (
          <EmptyState
            icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" /></svg>}
            title="No tasks yet"
            description="Add your first task to start tracking work."
            action={<Button onClick={openCreateTask}>Add Task</Button>}
          />
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            users={teamMembers}
            onStatusChange={handleStatusChange}
            onEdit={openEditTask}
            onDelete={handleDeleteTask}
            onReorder={handleReorder}
          />
        )
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className={styles.list}>
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
              title="No tasks"
              description={filterStatus || filterAssignee ? 'No tasks match the current filters.' : 'Create your first task to get started.'}
              action={!filterStatus && !filterAssignee ? <Button onClick={openCreateTask}>Add Task</Button> : undefined}
            />
          ) : (
            filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} users={teamMembers}
                onEdit={openEditTask} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
            ))
          )}
        </div>
      )}

      {/* Task modal */}
      <TaskFormModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false })}
        onSubmit={taskModal.task ? handleEditTask : handleCreateTask}
        initialValues={taskModal.task}
        users={teamMembers}
        serverError={taskError}
        mode={taskModal.task ? 'edit' : 'create'}
      />

      {/* Edit project modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Project">
        {projectError && <div style={{ marginBottom: 14 }}><ErrorMessage message={projectError} /></div>}
        <form onSubmit={handleEditSubmit(handleEditProject)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <Input label="Project Name" error={editErrors.name?.message} autoFocus
            {...regEdit('name', { required: 'Name is required' })} />
          <Textarea label="Description (optional)" {...regEdit('description')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button type="submit" loading={editSubmitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete project modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Project" width={420}>
        {projectError && <div style={{ marginBottom: 14 }}><ErrorMessage message={projectError} /></div>}
        <p className={styles.deleteWarning}>
          This will permanently delete <strong>{project.name}</strong> and all{' '}
          <strong>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</strong> inside it.
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" loading={deleteLoading} onClick={handleDeleteProject}>
            Delete Project
          </Button>
        </div>
      </Modal>
    </div>
  );
}
