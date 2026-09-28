import { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Trophy,
  FileText,
  MoreHorizontal,
  Globe,
  Smartphone
} from 'lucide-react';
import { notificationsService, type PushStats } from './notifications';
import { authService } from '../auth/auth';
import './NotificacionesPush.css';

const TEMAS_DISPONIBLES = [
  { id: 'todos', label: 'Todos los Temas', icon: Globe, color: '#64748b' },
  { id: 'academico', label: 'Académico', icon: BookOpen, color: '#0284c7' },
  { id: 'deportivo', label: 'Deportes / Cultural', icon: Trophy, color: '#d97706' },
  { id: 'alertas', label: 'Alertas / Emergencia', icon: AlertTriangle, color: '#dc2626' },
  { id: 'tramites', label: 'Trámites y Certificados', icon: FileText, color: '#059669' },
  { id: 'otros', label: 'Otros / General', icon: MoreHorizontal, color: '#4f46e5' }
];

const FACULTAD_NOMBRES: Record<string, string> = {
  'A': 'Rectorado',
  'P': 'Dirección Académica',
  'Q': 'Vicerrectorado',
  'U': 'Honorable Consejo Universitario',
  'M': 'Postgrado U.T.O.',
  'F': 'Facultad de Derecho, Ciencias Políticas y Sociales',
  'G': 'Facultad Nacional de Ingeniería (F.N.I.)',
  'H': 'Facultad de Ciencias Económicas, Financieras y Administrativas',
  'I': 'Facultad de Ciencias Agrarias y Naturales',
  'J': 'Facultad de Arquitectura y Urbanismo',
  'K': 'Facultad Técnica',
  'L': 'Facultad de Ciencias de la Salud'
};

const FACULTAD_ABREV: Record<string, string> = {
  'F': 'F.D.C.P.S.',
  'G': 'F.N.I.',
  'H': 'F.C.E.F.A.',
  'I': 'F.C.A.N.',
  'J': 'F.A.U.',
  'K': 'F.T.',
  'L': 'F.C.S.'
};

export function NotificacionesPush() {
  const user = authService.getUser();
  const [stats, setStats] = useState<PushStats | null>(null);
  const [cargandoStats, setCargandoStats] = useState(false);

  const appId = 'dtic-informaciones';
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>(['todos']);
  const [tema, setTema] = useState('todos');
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [facultadesSeleccionadas, setFacultadesSeleccionadas] = useState<string[]>([]);

  const handleRoleChange = (role: string) => {
    if (role === 'todos') {
      setRolesSeleccionados(['todos']);
    } else {
      setRolesSeleccionados((prev) => {
        const filtered = prev.filter((r) => r !== 'todos');
        if (filtered.includes(role)) {
          const next = filtered.filter((r) => r !== role);
          return next.length === 0 ? ['todos'] : next;
        } else {
          return [...filtered, role];
        }
      });
    }
  };

  const [enviando, setEnviando] = useState(false);
  const [resultadoExito, setResultadoExito] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cargarEstadisticas = async () => {
    setCargandoStats(true);
    try {
      const data = await notificationsService.getStats();
      setStats(data);
    } catch (e) {
      console.error('Error al cargar estadísticas de push:', e);
    } finally {
      setCargandoStats(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const handleEnviarNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultadoExito(null);
    setErrorMsg(null);

    if (!titulo.trim() || !mensaje.trim()) {
      setErrorMsg('Por favor completa el título y el mensaje antes de enviar.');
      return;
    }

    const confirmacion = window.confirm(
      `¿Estás seguro de enviar esta notificación push a la aplicación DTIC Informaciones?`
    );

    if (!confirmacion) return;

    setEnviando(true);
    try {
      const res = await notificationsService.sendNotification({
        appId,
        roles: rolesSeleccionados,
        tema,
        titulo,
        mensaje,
        facultades: user?.rol === 'ADMINISTRADOR_APP' ? facultadesSeleccionadas : (user?.idFacultad ? [user.idFacultad] : []),
      });

      setResultadoExito(res.message || `Notificación enviada a ${res.enviados} dispositivos.`);
      setTitulo('');
      setMensaje('');
      cargarEstadisticas();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al despachar la notificación.');
    } finally {
      setEnviando(false);
    }
  };

  const getAppTotal = (id: string) => {
    if (!stats) return 0;
    const item = stats.porApp.find((a) => a.appId === id);
    return item ? item.total : 0;
  };

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Notificaciones Push UTO Informaciones</h1>
          <p className="pagina-subtitulo">
            Gestiona y difunde avisos masivos o segmentados a la aplicación móvil de Trámites y Servicios.
          </p>
        </div>
      </div>

      <div className="notificaciones-layout">
        {/* Panel principal de composición */}
        <div className="panel-card">
          <h2 className="panel-card-titulo">
            <Bell size={20} />
            Redactar Nueva Notificación Push
          </h2>

          {/* Aviso de restricción de facultad para operadores */}
          {user?.idFacultad && user.rol !== 'ADMINISTRADOR_APP' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)', color: '#b45309', marginBottom: '20px', fontSize: '13px' }}>
              <AlertTriangle size={16} />
              <span>
                <strong>Envío limitado:</strong> Esta alerta solo alcanzará a la comunidad de la facultad: <strong>{FACULTAD_NOMBRES[user.idFacultad] || user.idFacultad}</strong>.
              </span>
            </div>
          )}

          {/* Feedback de envío */}
          {resultadoExito && (
            <div className="alerta-exito">
              <CheckCircle size={17} />
              <span>{resultadoExito}</span>
            </div>
          )}
          {errorMsg && (
            <div className="alerta-error">
              <AlertTriangle size={17} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleEnviarNotification}>
            {/* ── Tres columnas de segmentación ── */}
            <div className="selectores-columnas-grid">

              {/* Columna 1: Perfiles */}
              <div>
                <div className="selectores-columna-header">Perfiles Destinatarios</div>
                <div className="grupo-selectores-columna">
                  <div
                    className={`tema-radio-label ${rolesSeleccionados.includes('todos') ? 'tema-radio-label--seleccionado' : ''}`}
                    onClick={() => handleRoleChange('todos')}
                  >
                    <div className="checkbox-square"><div className="checkbox-square-inner" /></div>
                    <span className="tema-radio-texto">Todos los Perfiles</span>
                  </div>
                  {(['estudiante', 'docente', 'administrativo', 'egresado'] as const).map((rolId) => {
                    const label = rolId === 'estudiante' ? 'Estudiantes' : rolId === 'docente' ? 'Docentes' : rolId === 'administrativo' ? 'Administrativos' : 'Egresados';
                    const esSeleccionado = rolesSeleccionados.includes(rolId);
                    return (
                      <div
                        key={rolId}
                        className={`tema-radio-label ${esSeleccionado ? 'tema-radio-label--seleccionado' : ''}`}
                        onClick={() => handleRoleChange(rolId)}
                      >
                        <div className="checkbox-square"><div className="checkbox-square-inner" /></div>
                        <span className="tema-radio-texto">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna 2: Facultades */}
              <div>
                <div className="selectores-columna-header">Facultades Destinatarias</div>
                <div className="grupo-selectores-columna" style={{ maxHeight: '290px', overflowY: 'auto', paddingRight: '4px' }}>
                  {user?.rol === 'ADMINISTRADOR_APP' ? (
                    <>
                      <div
                        className={`tema-radio-label ${facultadesSeleccionadas.length === 0 ? 'tema-radio-label--seleccionado' : ''}`}
                        onClick={() => setFacultadesSeleccionadas([])}
                      >
                        <div className="checkbox-square"><div className="checkbox-square-inner" /></div>
                        <span className="tema-radio-texto">Todas las Facultades</span>
                      </div>
                      {Object.entries(FACULTAD_NOMBRES)
                        .filter(([id]) => !['A', 'P', 'Q', 'U', 'M'].includes(id))
                        .map(([id, nombre]) => {
                          const esSeleccionado = facultadesSeleccionadas.includes(id);
                          return (
                            <div
                              key={id}
                              className={`tema-radio-label ${esSeleccionado ? 'tema-radio-label--seleccionado' : ''}`}
                              onClick={() => {
                                setFacultadesSeleccionadas((prev) =>
                                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                                );
                              }}
                            >
                              <div className="checkbox-square"><div className="checkbox-square-inner" /></div>
                              <span className="tema-radio-texto">
                                <strong>{FACULTAD_ABREV[id] || id}</strong> — {nombre.replace('Facultad de ', '').replace('Facultad Nacional de ', '').replace('Facultad ', '')}
                              </span>
                            </div>
                          );
                        })}
                    </>
                  ) : (
                    <>
                      <div className="tema-radio-label tema-radio-label--deshabilitado" style={{ borderStyle: 'dashed' }}>
                        <div className="checkbox-square"><div className="checkbox-square-inner" /></div>
                        <span className="tema-radio-texto">Todas las Facultades</span>
                      </div>
                      {Object.entries(FACULTAD_NOMBRES)
                        .filter(([id]) => !['A', 'P', 'Q', 'U', 'M'].includes(id))
                        .map(([id, nombre]) => {
                          const esPerteneciente = user?.idFacultad === id;
                          return (
                            <div
                              key={id}
                              className={`tema-radio-label tema-radio-label--deshabilitado ${esPerteneciente ? 'tema-radio-label--seleccionado' : ''}`}
                            >
                              <div className="checkbox-square"><div className="checkbox-square-inner" /></div>
                              <span className="tema-radio-texto">
                                <strong>{FACULTAD_ABREV[id] || id}</strong> — {nombre.replace('Facultad de ', '').replace('Facultad Nacional de ', '').replace('Facultad ', '')} {esPerteneciente ? '(Tu Facultad)' : ''}
                              </span>
                            </div>
                          );
                        })}
                    </>
                  )}
                </div>
              </div>

              {/* Columna 3: Temas */}
              <div>
                <div className="selectores-columna-header">Tema / Categoría de la Alerta</div>
                <div className="grupo-selectores-columna">
                  {TEMAS_DISPONIBLES.map((t) => {
                    const Icon = t.icon;
                    const esSeleccionado = tema === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`tema-radio-label ${esSeleccionado ? 'tema-radio-label--seleccionado' : ''}`}
                        onClick={() => setTema(t.id)}
                      >
                        <div className="radio-circle"><div className="radio-circle-inner" /></div>
                        <div className="tema-icon-wrapper" style={{ color: t.color }}>
                          <Icon size={15} />
                        </div>
                        <span className="tema-radio-texto">{t.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Divisor ── */}
            <div className="seccion-divider" />

            {/* ── Composición del mensaje + Botón ── */}
            <div className="form-composicion">
              <div className="form-composicion-campos">
                <div className="formulario-grupo">
                  <label className="formulario-label">Título del Aviso</label>
                  <input
                    type="text"
                    className="formulario-input"
                    placeholder="Ej. Inicio de Inscripciones Gestión 2/2026"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    maxLength={80}
                  />
                </div>
                <div className="formulario-grupo">
                  <label className="formulario-label">Mensaje / Contenido de la Alerta</label>
                  <textarea
                    className="formulario-textarea"
                    placeholder="Escribe aquí el texto detallado que verán los usuarios en la barra de notificaciones de su celular..."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    maxLength={250}
                  />
                </div>
              </div>

              <button type="submit" className="btn-enviar-push" disabled={enviando}>
                <Send size={22} />
                <span>{enviando ? 'Enviando...' : 'Despachar'}</span>
                <span className="btn-enviar-push-label">Alerta Push</span>
              </button>
            </div>
          </form>
        </div>

        {/* ── Métricas compactas al pie ── */}
        <div className="metricas-pie">
          <Smartphone size={15} style={{ opacity: 0.5, flexShrink: 0 }} />
          <div className="metrica-chip metrica-chip--activo">
            <span className="metrica-chip-numero">{getAppTotal('dtic-informaciones')}</span>
            <span className="metrica-chip-label">DTIC Informaciones</span>
          </div>
          <div className="metrica-chip">
            <span className="metrica-chip-numero">{stats ? stats.total : '—'}</span>
            <span className="metrica-chip-label">Total registrado</span>
          </div>
          <div className="metricas-pie-spacer" />
          <button
            className="btn-refresh-compact"
            onClick={cargarEstadisticas}
            disabled={cargandoStats}
          >
            <RefreshCw size={13} className={cargandoStats ? 'spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}
