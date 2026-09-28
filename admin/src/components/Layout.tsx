import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CreditCard, LogOut, Bell, Image, Users } from 'lucide-react';
import logoUto from '../assets/logo_uto.png';
import { authService } from '../modules/auth/auth';
import './Layout.css';

export function Layout() {
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleCerrarSesion = async () => {
    await authService.logout();
    navigate('/');
  };

  const userInitial = user ? user.nombre.charAt(0).toUpperCase() : 'A';
  const userName = user ? user.nombre : 'Admin DTIC';
  const userRol = user ? user.rol : '';

  // Determinar los ítems de navegación según el rol del usuario
  const navItems = [];

  if (userRol === 'ADMINISTRADOR_APP') {
    navItems.push(
      { to: '/notificaciones',  icono: <Bell size={18} />,       etiqueta: 'Notificaciones Push' },
      { to: '/banners',         icono: <Image size={18} />,      etiqueta: 'Banners de Inicio' },
      { to: '/usuarios',        icono: <Users size={18} />,      etiqueta: 'Gestión de Operadores' },
      { to: '/carnets',         icono: <CreditCard size={18} />, etiqueta: 'Carnets (Beta)' }
    );
  } else {
    // Operadores limitados solo ven notificaciones
    navItems.push(
      { to: '/notificaciones',  icono: <Bell size={18} />,       etiqueta: 'Notificaciones Push' }
    );
  }

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-marca">
          <img src={logoUto} alt="Logo UTO" className="sidebar-logo" />
          <div className="sidebar-marca-textos">
            <span className="sidebar-titulo">Panel DTIC</span>
            <span className="sidebar-subtitulo">Servicios Digitales UTO</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icono, etiqueta }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' sidebar-nav-item--activo' : ''}`
              }
            >
              <span className="sidebar-nav-icono">{icono}</span>
              <span>{etiqueta}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-admin">
            <div className="sidebar-admin-avatar">{userInitial}</div>
            <div className="sidebar-admin-info">
              <span className="sidebar-admin-nombre">{userName}</span>
              <span className="sidebar-admin-rol">
                {userRol === 'ADMINISTRADOR_APP' ? 'Administrador' : 'Operador'}
              </span>
            </div>
          </div>
          <button className="sidebar-btn-salir" onClick={handleCerrarSesion}>
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
