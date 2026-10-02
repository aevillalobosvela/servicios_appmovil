import { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Users,
  Building2,
  GraduationCap,
  Tag,
  IdCard,
  Target
} from 'lucide-react';
import { notificationsService, type PushStats } from './notifications';
import { authService } from '../auth/auth';
import './NotificacionesPush.css';

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

  const [tipoEnvio, setTipoEnvio] = useState<'masivo' | 'individual'>('masivo');
  const [appIdSeleccionada, setAppIdSeleccionada] = useState('carnet-digital');
  const [perfil, setPerfil] = useState('todos');
  const [tema, setTema] = useState('todos');
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [facultad, setFacultad] = useState('todas');
  const [ciEspecifico, setCiEspecifico] = useState('');
  const [tipoEstudiante, setTipoEstudiante] = useState('todos');

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

    const nombreApp = appIdSeleccionada === 'carnet-digital' ? 'Carnet Digital UTO' : appIdSeleccionada === 'dtic-informaciones' ? 'DTIC Informaciones' : 'Todas las aplicaciones';
    const confirmacion = window.confirm(
      `¿Estás seguro de enviar esta notificación push a: ${nombreApp}?`
    );

    if (!confirmacion) return;

    setEnviando(true);
    try {
      const payload = {
        appId: appIdSeleccionada,
        roles: perfil === 'todos' ? ['todos'] : [perfil],
        tema,
        titulo,
        mensaje,
        facultades: user?.rol === 'ADMINISTRADOR_APP' 
                      ? (facultad !== 'todas' ? [facultad] : []) 
                      : (user?.idFacultad ? [user.idFacultad] : []),
        ciEspecifico: tipoEnvio === 'individual' && ciEspecifico.trim() ? ciEspecifico.trim() : undefined,
        tipoEstudiante: tipoEnvio === 'masivo' && tipoEstudiante !== 'todos' ? tipoEstudiante : undefined,
      };

      const res = await notificationsService.sendNotification(payload);

      setResultadoExito(res.message || `Notificación enviada a ${res.enviados} dispositivos.`);
      setTitulo('');
      setMensaje('');
      setCiEspecifico('');
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
            {/* ── CONTENEDOR 2 COLUMNAS ── */}
            <div className="form-dos-columnas">
              
              {/* === COLUMNA 1: SEGMENTACIÓN === */}
              <div className="form-dos-columnas-columna">
                {/* ── App Destino ── */}
                <div>
                  <div className="selectores-columna-header">Aplicación Destino</div>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div
                      className={`tema-radio-label ${appIdSeleccionada === 'carnet-digital' ? 'tema-radio-label--seleccionado' : ''}`}
                      onClick={() => setAppIdSeleccionada('carnet-digital')}
                    >
                      <div className="radio-circle"><div className="radio-circle-inner" /></div>
                      <span className="tema-radio-texto">Carnet Digital UTO</span>
                    </div>
                    <div
                      className={`tema-radio-label ${appIdSeleccionada === 'dtic-informaciones' ? 'tema-radio-label--seleccionado' : ''}`}
                      onClick={() => setAppIdSeleccionada('dtic-informaciones')}
                    >
                      <div className="radio-circle"><div className="radio-circle-inner" /></div>
                      <span className="tema-radio-texto">DTIC Informaciones</span>
                    </div>
                    <div
                      className={`tema-radio-label ${appIdSeleccionada === 'todos' ? 'tema-radio-label--seleccionado' : ''}`}
                      onClick={() => setAppIdSeleccionada('todos')}
                    >
                      <div className="radio-circle"><div className="radio-circle-inner" /></div>
                      <span className="tema-radio-texto">Todas las Apps</span>
                    </div>
                  </div>
                </div>

                {/* ── Tipo de Envío ── */}
                <div>
                  <div className="selectores-columna-header">Tipo de Envío</div>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div
                      className={`tema-radio-label ${tipoEnvio === 'masivo' ? 'tema-radio-label--seleccionado' : ''}`}
                      onClick={() => setTipoEnvio('masivo')}
                    >
                      <div className="radio-circle"><div className="radio-circle-inner" /></div>
                      <span className="tema-radio-texto">Envío Masivo / Grupal</span>
                    </div>
                    <div
                      className={`tema-radio-label ${tipoEnvio === 'individual' ? 'tema-radio-label--seleccionado' : ''}`}
                      onClick={() => setTipoEnvio('individual')}
                    >
                      <div className="radio-circle"><div className="radio-circle-inner" /></div>
                      <span className="tema-radio-texto">Envío Individual (Por C.I.)</span>
                    </div>
                  </div>
                </div>

                {/* ── Configuración de Envío ── */}
                <div style={{ padding: '20px', backgroundColor: 'var(--color-fondo)', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                  
                  {tipoEnvio === 'individual' ? (
                    <div className="formulario-grupo" style={{ marginBottom: 0 }}>
                      <label className="formulario-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IdCard size={14} /> Carnet de Identidad (C.I.) Destinatario
                      </label>
                      <input 
                        type="text" 
                        className="formulario-input" 
                        placeholder="Ej. 7412345" 
                        value={ciEspecifico}
                        onChange={(e) => setCiEspecifico(e.target.value)}
                        required={tipoEnvio === 'individual'}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--color-texto-secundario)', marginTop: '8px', display: 'block' }}>
                        La notificación llegará directa y exclusivamente al dispositivo asociado a este estudiante o docente.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      
                      {/* Perfil */}
                      <div className="formulario-grupo">
                        <label className="formulario-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} /> Perfil Destinatario
                        </label>
                        <select className="formulario-input" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
                          <option value="todos">Todos los Perfiles</option>
                          <option value="estudiantes">Solo Estudiantes</option>
                          <option value="docentes">Solo Docentes</option>
                          <option value="administrativos">Solo Administrativos</option>
                        </select>
                      </div>

                  {/* Facultad (Solo si es estudiante/docente/todos) */}
                      {/* Facultad */}
                      {(perfil === 'todos' || perfil === 'estudiantes' || perfil === 'docentes') && (
                        <div className="formulario-grupo">
                          <label className="formulario-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} /> Facultad Destinataria
                          </label>
                          {user?.rol === 'ADMINISTRADOR_APP' ? (
                            <select className="formulario-input" value={facultad} onChange={(e) => setFacultad(e.target.value)}>
                              <option value="todas">Todas las Facultades</option>
                              {Object.entries(FACULTAD_ABREV).map(([id, nombre]) => (
                                <option key={id} value={id}>{nombre}</option>
                              ))}
                            </select>
                          ) : (
                            <input type="text" className="formulario-input" disabled value={FACULTAD_ABREV[user?.idFacultad || ''] || user?.idFacultad} />
                          )}
                        </div>
                      )}

                      {/* Generación */}
                      {appIdSeleccionada === 'carnet-digital' && (perfil === 'todos' || perfil === 'estudiantes') && (
                        <div className="formulario-grupo">
                          <label className="formulario-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <GraduationCap size={14} /> Generación Estudiantil
                          </label>
                          <select className="formulario-input" value={tipoEstudiante} onChange={(e) => setTipoEstudiante(e.target.value)}>
                            <option value="todos">Todos (Nuevos y Antiguos)</option>
                            <option value="nuevos">Solo Estudiantes Nuevos (Primer Año)</option>
                            <option value="antiguos">Solo Estudiantes Antiguos</option>
                          </select>
                        </div>
                      )}

                  {/* Temas */}
                      {/* Temas */}
                      <div className="formulario-grupo" style={{ marginBottom: 0 }}>
                        <label className="formulario-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={14} /> Tema / Categoría de la Alerta
                        </label>
                        <select className="formulario-input" value={tema} onChange={(e) => setTema(e.target.value)}>
                          <option value="todos">General (Llegará a todos)</option>
                          <option value="academico">Académico</option>
                          <option value="deportivo">Deportivo</option>
                          <option value="alertas">Alertas / Emergencias</option>
                          <option value="tramites">Trámites</option>
                          <option value="otros">Otros</option>
                        </select>
                      </div>

                    </div>
                  )}
                </div>
              </div>

              {/* === COLUMNA 2: COMPOSICIÓN DEL MENSAJE === */}
              <div className="form-dos-columnas-columna" style={{ backgroundColor: 'var(--color-fondo)', padding: '20px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <div className="selectores-columna-header" style={{ borderBottom: 'none', marginBottom: '0', paddingBottom: '0' }}>Contenido de la Notificación</div>
                
                <div className="form-composicion-campos" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="formulario-grupo">
                    <label className="formulario-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={14} /> Título del Aviso
                    </label>
                    <input
                      type="text"
                      className="formulario-input"
                      placeholder="Ej. Inicio de Inscripciones..."
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      maxLength={80}
                      style={{ fontSize: '15px' }}
                    />
                  </div>
                  <div className="formulario-grupo" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '25px' }}>
                    <label className="formulario-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={14} /> Mensaje / Contenido
                    </label>
                    <textarea
                      className="formulario-textarea"
                      placeholder="Escribe aquí el texto detallado que verán los usuarios..."
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      maxLength={250}
                      style={{ flex: 1, minHeight: '140px', resize: 'none' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-enviar-push" disabled={enviando} style={{ width: '100%', marginTop: 'auto' }}>
                  <Send size={22} />
                  <span>{enviando ? 'Enviando...' : 'Despachar'}</span>
                  <span className="btn-enviar-push-label">Alerta Push</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── Métricas compactas al pie ── */}
        <div className="metricas-pie">
          <Smartphone size={15} style={{ opacity: 0.5, flexShrink: 0 }} />
          <div className="metrica-chip metrica-chip--activo">
            <span className="metrica-chip-numero">{getAppTotal(appIdSeleccionada === 'todos' ? 'carnet-digital' : appIdSeleccionada)}</span>
            <span className="metrica-chip-label">{appIdSeleccionada === 'dtic-informaciones' ? 'DTIC Informaciones' : 'Carnet Digital UTO'}</span>
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
