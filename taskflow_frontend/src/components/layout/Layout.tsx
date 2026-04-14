import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import styles from './Layout.module.css';

export function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className={styles.root}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function AuthLayout() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/projects" replace />;
  return <Outlet />;
}
