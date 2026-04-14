import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { projectsApi } from '../api/client';
import type { Project } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner, EmptyState, ErrorMessage } from '../components/ui/Badge';
import { extractErrorMessage, formatDate } from '../utils';
import styles from './ProjectsPage.module.css';

interface ProjectForm {
  name: string;
  description?: string;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await projectsApi.list();
      setProjects(data.projects);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const onCreate = async (data: ProjectForm) => {
    setServerError('');
    try {
      const project = await projectsApi.create(data.name, data.description);
      setProjects((p) => [project, ...p]);
      setShowModal(false);
      reset();
    } catch (err) {
      setServerError(extractErrorMessage(err));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setServerError('');
    reset();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>
            {loading ? '' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
          onClick={() => setShowModal(true)}
        >
          New Project
        </Button>
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <Spinner size={24} />
          <span>Loading projects…</span>
        </div>
      )}

      {!loading && error && (
        <ErrorMessage message={error} onRetry={fetchProjects} />
      )}

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
          title="No projects yet"
          description="Create your first project to start tracking tasks and collaborating with your team."
          action={
            <Button onClick={() => setShowModal(true)}>Create Project</Button>
          }
        />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className={styles.grid}>
          {projects.map((p, i) => (
            <button
              key={p.id}
              className={styles.card}
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardIcon}>
                  {p.name.slice(0, 2).toUpperCase()}
                </span>
                <span className={styles.cardArrow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>
              <h3 className={styles.cardName}>{p.name}</h3>
              {p.description ? (
                <p className={styles.cardDesc}>{p.description}</p>
              ) : (
                <p className={styles.cardDescEmpty}>No description</p>
              )}
              <div className={styles.cardFooter}>
                <span className={styles.cardDate}>Created {formatDate(p.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={closeModal} title="New Project">
        {serverError && (
          <div style={{ marginBottom: 16 }}>
            <ErrorMessage message={serverError} />
          </div>
        )}
        <form onSubmit={handleSubmit(onCreate)} className={styles.form} noValidate>
          <Input
            label="Project Name"
            placeholder="e.g. Website Redesign"
            error={errors.name?.message}
            autoFocus
            {...register('name', {
              required: 'Project name is required',
              minLength: { value: 2, message: 'At least 2 characters' },
            })}
          />
          <Textarea
            label="Description (optional)"
            placeholder="What is this project about?"
            {...register('description')}
          />
          <div className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
