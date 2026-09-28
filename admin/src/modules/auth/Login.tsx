import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoUto from '../../assets/logo_uto.png';
import { authService } from './auth';
import { ApiError } from '../../services/api';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usuario || !contrasena) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setCargando(true);
    try {
      const user = await authService.login(usuario, contrasena);
      // Diferimos el navigate al siguiente tick para garantizar que el token
      // ya esté en sessionStorage cuando RutaProtegida evalúe isAuthenticated()
      setTimeout(() => {
        if (user.rol === 'OPERADOR_NOTIFICACIONES') {
          navigate('/notificaciones');
        } else {
          navigate('/carnets');
        }
      }, 0);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error de conexión con el servidor. Inténtelo más tarde.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-pagina">
      <div className="login-contenedor">
        <div className="login-tarjeta">

          {/* ── Encabezado ── */}
          <div className="login-encabezado">
            <img src={logoUto} alt="Logo UTO" className="login-logo" />
            <h1 className="login-titulo">Servicios Digitales DTIC</h1>
            <p className="login-subtitulo">Universidad Técnica de Oruro</p>
          </div>

          {/* ── Formulario ── */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="campo">
              <label className="campo-etiqueta" htmlFor="usuario">
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                className="campo-input"
                placeholder="user"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="campo">
              <label className="campo-etiqueta" htmlFor="contrasena">
                Contraseña
              </label>
              <input
                id="contrasena"
                type="password"
                className="campo-input"
                placeholder="••••••••"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-btn-submit"
              disabled={cargando}
            >
              {cargando ? 'Verificando...' : 'Iniciar sesión'}
            </button>

          </form>

        </div>

        {/* ── Footer Externo ── */}
        <footer className="login-footer-externo">
          Universidad Técnica de Oruro — Versión 1.0.0
          <Link to="/verificar" className="login-link-verificar">
            Verificación de Credenciales
          </Link>
        </footer>
      </div>
    </div>
  );
}
