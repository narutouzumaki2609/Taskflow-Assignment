import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { extractErrorMessage } from '../utils';
import styles from './AuthPage.module.css';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm extends LoginForm {
  name: string;
  confirmPassword: string;
}

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register: regLogin,
    handleSubmit: handleLogin,
    formState: { errors: loginErrors, isSubmitting: loginLoading },
  } = useForm<LoginForm>();

  const {
    register: regRegister,
    handleSubmit: handleRegister,
    watch,
    formState: { errors: registerErrors, isSubmitting: registerLoading },
  } = useForm<RegisterForm>();

  const onLogin = async (data: LoginForm) => {
    setServerError('');
    try {
      const res = await authApi.login(data.email, data.password);
      login(res.token, res.user);
      navigate('/projects');
    } catch (err) {
      setServerError(extractErrorMessage(err));
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setServerError('');
    try {
      const res = await authApi.register(data.name, data.email, data.password);
      login(res.token, res.user);
      navigate('/projects');
    } catch (err) {
      setServerError(extractErrorMessage(err));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.brandMark}>TF</div>
          <h1 className={styles.headline}>
            Work moves
            <br />
            <span className={styles.accentText}>faster here.</span>
          </h1>
          <p className={styles.sub}>
            Manage projects, track tasks, ship with your team — all in one place.
          </p>
          <div className={styles.features}>
            {['Project tracking', 'Task assignment', 'Priority management', 'Team collaboration'].map((f) => (
              <div key={f} className={styles.featureItem}>
                <span className={styles.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.gridBg} aria-hidden />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
              onClick={() => { setMode('login'); setServerError(''); }}
            >
              Sign In
            </button>
            <button
              className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
              onClick={() => { setMode('register'); setServerError(''); }}
            >
              Register
            </button>
          </div>

          {serverError && (
            <div className={styles.serverError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverError}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin(onLogin)} className={styles.form} noValidate>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={loginErrors.email?.message}
                {...regLogin('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
                })}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={loginErrors.password?.message}
                {...regLogin('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />
              <Button type="submit" size="lg" loading={loginLoading} style={{ width: '100%', marginTop: 8 }}>
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister(onRegister)} className={styles.form} noValidate>
              <Input
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                error={registerErrors.name?.message}
                {...regRegister('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={registerErrors.email?.message}
                {...regRegister('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
                })}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={registerErrors.password?.message}
                {...regRegister('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={registerErrors.confirmPassword?.message}
                {...regRegister('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === watch('password') || 'Passwords do not match',
                })}
              />
              <Button type="submit" size="lg" loading={registerLoading} style={{ width: '100%', marginTop: 8 }}>
                Create Account
              </Button>
            </form>
          )}

          <p className={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className={styles.switchLink}
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setServerError(''); }}
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
