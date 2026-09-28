import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, RefreshCw, BookOpen, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import './Carnets.css';

export interface Persona {
  idPersona: number;
  dip: string;
  nombreCompleto: string;
  correo: string | null;
  digital: string | null;
  estado: 'inactivo' | 'pendiente' | 'activo' | 'expirado';
  totalCarreras: number;
  carnerasActivas: number;
  carrerasHabilitadas: number;
  pagos868Disponibles: number;
}

// Keep legacy alias for components that still import `Carnet`
export type Carnet = Persona;

type FiltroEstado = 'todos' | 'activo' | 'pendiente' | 'inactivo' | 'expirado';

export function BadgeEstado({ estado }: { estado: Persona['estado'] }) {
  if (estado === 'activo') {
    return (
      <span className="badge-estado badge-estado--activo">
        <CheckCircle2 size={11} /> Activo
      </span>
    );
  }
  if (estado === 'pendiente') {
    return (
      <span className="badge-estado badge-estado--habilitado">
        <Clock size={11} /> Habilitado
      </span>
    );
  }
  if (estado === 'expirado') {
    return (
      <span
        className="badge-estado badge-estado--inactivo"
        style={{
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #fca5a5',
        }}
      >
        <XCircle size={11} /> Expirado
      </span>
    );
  }
  return (
    <span className="badge-estado badge-estado--inactivo">
      <XCircle size={11} /> Inactivo
    </span>
  );
}

export function Carnets() {
  const navigate = useNavigate();
  const [busquedaInput, setBusquedaInput] = useState(() => sessionStorage.getItem('carnets_busquedaInput') || '');
  const [busquedaDebounced, setBusquedaDebounced] = useState(() => sessionStorage.getItem('carnets_busquedaInput') || '');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>(() => (sessionStorage.getItem('carnets_filtroEstado') as FiltroEstado) || 'todos');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);

  // Paginación
  const [page, setPage] = useState(() => Number(sessionStorage.getItem('carnets_page')) || 1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Estadísticas globales
  const [totalRegistrados, setTotalRegistrados] = useState(0);
  const [totalActivos, setTotalActivos] = useState(0);
  const [totalPendientes, setTotalPendientes] = useState(0);
  const [totalInactivos, setTotalInactivos] = useState(0);

  // Obtener resúmenes estadísticos generales (ejecutado al montar)
  const fetchCounts = async () => {
    try {
      const [allRes, activosRes, pendientesRes, inactivosRes] = await Promise.all([
        api.get('admin/carnets?limit=1'),
        api.get('admin/carnets?estado=activo&limit=1'),
        api.get('admin/carnets?estado=pendiente&limit=1'),
        api.get('admin/carnets?estado=inactivo&limit=1'),
      ]);
      setTotalRegistrados(allRes.meta.total);
      setTotalActivos(activosRes.meta.total);
      setTotalPendientes(pendientesRes.meta.total);
      setTotalInactivos(inactivosRes.meta.total);
    } catch (e) {
      console.error('Error al obtener resúmenes estadísticos:', e);
    }
  };

  // Obtener lista paginada y filtrada (solo si hay un criterio de búsqueda activo)
  const fetchPersonas = async () => {
    if (!busquedaDebounced.trim()) {
      setPersonas([]);
      setTotal(0);
      setLastPage(1);
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') {
        params.append('estado', filtroEstado);
      }
      params.append('search', busquedaDebounced.trim());
      params.append('page', String(page));
      params.append('limit', '10');

      const response = await api.get(`admin/carnets?${params.toString()}`);
      setPersonas(response.data);
      setTotal(response.meta.total);
      setLastPage(response.meta.lastPage);
    } catch (error) {
      console.error('Error al obtener personas:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchCounts(), fetchPersonas()]);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Resetear la búsqueda si el input se limpia por completo, de lo contrario solo buscar al presionar Enter
  useEffect(() => {
    if (busquedaInput.trim() === '') {
      setBusquedaDebounced('');
    }
  }, [busquedaInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = busquedaInput.trim();
      // Permitir búsquedas vacías (para resetear) o con al menos 3 caracteres
      if (query === '' || query.length >= 3) {
        setBusquedaDebounced(query);
      }
    }
  };

  const isMountedRef = useRef(false);

  // Guardar estado en sessionStorage para preservar al navegar atrás
  useEffect(() => {
    sessionStorage.setItem('carnets_busquedaInput', busquedaInput);
  }, [busquedaInput]);

  useEffect(() => {
    sessionStorage.setItem('carnets_filtroEstado', filtroEstado);
  }, [filtroEstado]);

  useEffect(() => {
    sessionStorage.setItem('carnets_page', String(page));
  }, [page]);

  // Reiniciar página a 1 cuando cambian filtros (evitar en el primer render)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    setPage(1);
  }, [busquedaDebounced, filtroEstado]);

  useEffect(() => {
    fetchPersonas();
  }, [busquedaDebounced, filtroEstado, page]);

  const filtros: { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: 'todos',      etiqueta: 'Todos' },
    { valor: 'activo',     etiqueta: 'Activos' },
    { valor: 'pendiente',  etiqueta: 'Habilitados' },
    { valor: 'inactivo',   etiqueta: 'Inactivos' },
    { valor: 'expirado',   etiqueta: 'Expirados' },
  ];

  return (
    <div className="pagina">

      {/* ── Encabezado de página ── */}
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Carnets</h1>
          <p className="pagina-subtitulo">
            Gestión de carnets digitales — una fila por persona
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secundario"
          onClick={handleRefresh}
          disabled={cargando}
          style={{ alignSelf: 'center' }}
        >
          <RefreshCw size={14} className={cargando ? 'spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── Tarjetas de resumen ── */}
      <div className="resumen-grid">
        <div className="resumen-tarjeta">
          <span className="resumen-numero">{totalRegistrados}</span>
          <span className="resumen-etiqueta">Total personas</span>
        </div>
        <div className="resumen-tarjeta resumen-tarjeta--activo">
          <span className="resumen-numero">{totalActivos}</span>
          <span className="resumen-etiqueta">Con carnet activo</span>
        </div>
        <div className="resumen-tarjeta resumen-tarjeta--habilitado">
          <span className="resumen-numero">{totalPendientes}</span>
          <span className="resumen-etiqueta">Habilitados (pago verificado)</span>
        </div>
        <div className="resumen-tarjeta resumen-tarjeta--inactivo">
          <span className="resumen-numero">{totalInactivos}</span>
          <span className="resumen-etiqueta">Sin carnet activo</span>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="filtros">
        <input
          type="text"
          className="filtros-busqueda"
          placeholder="Buscar por nombre o CI... (Min 3 car.)"
          value={busquedaInput}
          onChange={e => setBusquedaInput(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          onFocus={e => e.target.select()}
          style={{ textTransform: 'uppercase' }}
        />
        <div className="filtros-estado">
          {filtros.map(({ valor, etiqueta }) => (
            <button
              key={valor}
              className={`filtros-btn${filtroEstado === valor ? ' filtros-btn--activo' : ''}`}
              onClick={() => setFiltroEstado(valor)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Persona</th>
              <th>C.I.</th>
              <th>Carreras</th>
              <th>Habilitación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} className="tabla-vacia">
                  Cargando personas...
                </td>
              </tr>
            ) : !busquedaDebounced.trim() ? (
              <tr>
                <td colSpan={6} className="tabla-vacia">
                  Por favor, ingrese un nombre o C.I. y presione Enter para realizar una búsqueda.
                </td>
              </tr>
            ) : personas.length === 0 ? (
              <tr>
                <td colSpan={6} className="tabla-vacia">
                  No se encontraron personas con los filtros aplicados.
                </td>
              </tr>
            ) : (
              personas.map(persona => (
                <tr key={persona.idPersona} className="tabla-fila">
                  <td>
                    <div className="tabla-estudiante">
                      <div className="tabla-avatar">
                        {persona.nombreCompleto.charAt(0)}
                      </div>
                      <div>
                        <div className="tabla-nombre">{persona.nombreCompleto}</div>
                        <div className="tabla-email">{persona.correo || 'Sin correo registrado'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tabla-ci">{persona.dip}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#334155',
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '3px 9px',
                      }}
                    >
                      <BookOpen size={12} />
                      {persona.totalCarreras} {persona.totalCarreras === 1 ? 'carrera' : 'carreras'}
                      {persona.carnerasActivas > 0 && (
                        <span
                          style={{
                            marginLeft: '4px',
                            background: '#dcfce7',
                            color: '#15803d',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            fontSize: '10px',
                          }}
                        >
                          {persona.carnerasActivas} activa{persona.carnerasActivas > 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      {/* Indicador de Matrícula */}
                      {persona.carrerasHabilitadas > 0 ? (
                        <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-exito-bg)', color: 'var(--color-exito)', border: '1px solid rgba(26,127,60,0.15)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                          <CheckCircle2 size={10} style={{ flexShrink: 0 }} /> Matrícula al día
                        </span>
                      ) : (
                        <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-advertencia-bg)', color: 'var(--color-advertencia)', border: '1px solid rgba(180,83,9,0.15)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                          <AlertTriangle size={10} style={{ flexShrink: 0 }} /> Matrícula irregular
                        </span>
                      )}

                      {/* Indicador de Pago de Arancel */}
                      {persona.carnerasActivas > 0 ? (
                        <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-exito-bg)', color: 'var(--color-exito)', border: '1px solid rgba(26,127,60,0.15)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                          <CheckCircle2 size={10} style={{ flexShrink: 0 }} /> Reposición Consumida
                        </span>
                      ) : persona.pagos868Disponibles > 0 ? (
                        <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-exito-bg)', color: 'var(--color-exito)', border: '1px solid rgba(26,127,60,0.15)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                          <CheckCircle2 size={10} style={{ flexShrink: 0 }} /> Reposición Disponible ({persona.pagos868Disponibles})
                        </span>
                      ) : (
                        <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(192,57,43,0.15)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                          <XCircle size={10} style={{ flexShrink: 0 }} /> Sin Pago Reposición
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <BadgeEstado estado={persona.estado} />
                  </td>
                  <td>
                    <button
                      className="tabla-btn-ver"
                      onClick={() => navigate(`/carnets/${persona.idPersona}`)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación y Conteo ── */}
      <div className="tabla-conteo-paginacion">
        <p className="tabla-conteo">
          Mostrando {personas.length} de {total} personas
        </p>
        {!cargando && lastPage > 1 && (
          <div className="paginacion">
            <button
              className="btn-paginacion"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
            >
              Anterior
            </button>
            <span className="paginacion-info">
              Página {page} de {lastPage}
            </span>
            <button
              className="btn-paginacion"
              disabled={page === lastPage}
              onClick={() => setPage(p => Math.min(p + 1, lastPage))}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
