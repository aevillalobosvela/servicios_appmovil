import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../modules/auth/auth';

export function RutaProtegida() {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const user = authService.getUser();
  if (user?.rol === 'OPERADOR_NOTIFICACIONES') {
    // Los operadores de notificaciones tienen acceso exclusivo únicamente a su módulo
    if (location.pathname !== '/notificaciones') {
      return <Navigate to="/notificaciones" replace />;
    }
  }

  return <Outlet />;
}
