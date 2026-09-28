import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Building,
  Key
} from 'lucide-react';
import { api } from '../../services/api';
import './Usuarios.css';

interface Operator {
  idUsrRol: number;
  idUsuario: number;
  usuario: string;
  nombreCompleto: string;
  dip: string;
  rol: 'ADMINISTRADOR_APP' | 'OPERADOR_NOTIFICACIONES';
  idFacultad: string | null;
  facultad: string | null;
  activo: boolean;
}

interface PersonaSearchResult {
  idPersona: number;
  nombreCompleto: string;
  dip: string;
  correo: string | null;
  celular: string | null;
}

interface Facultad {
  idFacultad: string;
  facultad: string;
  abrev: string;
}

export function Usuarios() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalCargando, setModalCargando] = useState(false);
  
  // Form State
  const [searchDip, setSearchDip] = useState('');
  const [personaEncontrada, setPersonaEncontrada] = useState<PersonaSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [selectedRol, setSelectedRol] = useState<'ADMINISTRADOR_APP' | 'OPERADOR_NOTIFICACIONES'>('OPERADOR_NOTIFICACIONES');
  const [selectedFacultad, setSelectedFacultad] = useState('');
  const [customPassword, setCustomPassword] = useState('');

  const fetchOperators = async () => {
    setCargando(true);
    try {
      const data = (await api.get('admin/operators')) as Operator[];
      setOperators(data);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al obtener listado de operadores.');
    } finally {
      setCargando(false);
    }
  };

  const fetchFacultades = async () => {
    try {
      const data = (await api.get('admin/facultades')) as Facultad[];
      setFacultades(data);
      if (data.length > 0) {
        setSelectedFacultad(data[0].idFacultad);
      }
    } catch (e) {
      console.error('Error al cargar facultades:', e);
    }
  };

  useEffect(() => {
    fetchOperators();
    fetchFacultades();
  }, []);

  const handleSearchPersona = async () => {
    if (!searchDip.trim()) return;
    setModalCargando(true);
    setSearchError(null);
    setPersonaEncontrada(null);
    try {
      const data = (await api.get(`admin/personas/search?dip=${searchDip}`)) as PersonaSearchResult;
      setPersonaEncontrada(data);
    } catch (e: any) {
      setSearchError(e.message || 'No se encontró ninguna persona con ese C.I.');
    } finally {
      setModalCargando(false);
    }
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personaEncontrada) return;

    setModalCargando(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.post('admin/operators', {
        idPersona: personaEncontrada.idPersona,
        rol: selectedRol,
        idFacultad: selectedRol === 'OPERADOR_NOTIFICACIONES' ? selectedFacultad : null,
        password: customPassword.trim() || null
      });

      setSuccessMsg(`Operador ${personaEncontrada.nombreCompleto} registrado correctamente.`);
      setShowModal(false);
      resetForm();
      fetchOperators();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al guardar el nuevo operador.');
    } finally {
      setModalCargando(false);
    }
  };

  const handleToggleOperator = async (operator: Operator) => {
    const confirm = window.confirm(
      `¿Estás seguro de que deseas ${operator.activo ? 'desactivar' : 'activar'} el acceso para ${operator.nombreCompleto}?`
    );
    if (!confirm) return;

    try {
      await api.put(`admin/operators/${operator.idUsrRol}/toggle`, {
        activo: !operator.activo
      });
      setSuccessMsg(`Acceso de operador ${operator.activo ? 'desactivado' : 'activado'} correctamente.`);
      fetchOperators();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al cambiar estado del operador.');
    }
  };

  const resetForm = () => {
    setSearchDip('');
    setPersonaEncontrada(null);
    setSearchError(null);
    setSelectedRol('OPERADOR_NOTIFICACIONES');
    setCustomPassword('');
    if (facultades.length > 0) {
      setSelectedFacultad(facultades[0].idFacultad);
    }
  };

  const filteredOperators = operators.filter(o => 
    o.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.dip.includes(busqueda)
  );

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Gestión de Operadores</h1>
          <p className="pagina-subtitulo">
            Registra y administra las cuentas de operadores y define sus alcances o restricciones por facultad.
          </p>
        </div>
        <button
          className="btn btn--primario"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <UserPlus size={16} />
          Registrar Operador
        </button>
      </div>

      {successMsg && (
        <div className="alerta-exito" style={{ marginBottom: '16px' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alerta-error" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="panel-card">
        {/* Barra de Filtros */}
        <div className="tabla-controles">
          <div className="buscador-input-wrapper">
            <Search size={16} className="buscador-icono" />
            <input
              type="text"
              placeholder="Buscar operador por nombre, usuario o C.I..."
              className="buscador-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="btn btn--secundario" onClick={fetchOperators} disabled={cargando}>
            <RefreshCw size={16} className={cargando ? 'spin' : ''} />
            Recargar
          </button>
        </div>

        {/* Listado de Operadores */}
        {cargando ? (
          <div className="cargando-spinner-wrapper">
            <RefreshCw size={24} className="spin" />
            <span>Cargando operadores...</span>
          </div>
        ) : filteredOperators.length === 0 ? (
          <div className="tabla-vacia">
            <Users size={40} style={{ color: '#94a3b8', marginBottom: '8px' }} />
            <p>No se encontraron operadores registrados para los criterios indicados.</p>
          </div>
        ) : (
          <div className="tabla-responsiva">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>C.I. / Apodo</th>
                  <th>Rol Asignado</th>
                  <th>Alcance / Facultad</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map((op) => (
                  <tr key={op.idUsrRol}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{op.nombreCompleto}</div>
                    </td>
                    <td>
                      <div className="codigo-mono">{op.usuario}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Shield size={14} style={{ color: op.rol === 'ADMINISTRADOR_APP' ? '#6366f1' : '#f59e0b' }} />
                        <span>{op.rol === 'ADMINISTRADOR_APP' ? 'Administrador Global' : 'Operador Limitado'}</span>
                      </div>
                    </td>
                    <td>
                      {op.idFacultad ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontSize: '13px' }}>
                          <Building size={14} />
                          <span>{op.facultad || op.idFacultad}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '12.5px', fontWeight: 500 }}>Acceso Global (DTO)</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {op.activo ? (
                        <span className="badge-estado badge-estado--activo">
                          <CheckCircle2 size={11} /> Activo
                        </span>
                      ) : (
                        <span className="badge-estado badge-estado--inactivo">
                          <XCircle size={11} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn btn--mini ${op.activo ? 'btn--destructivo-outline' : 'btn--exito-outline'}`}
                        onClick={() => handleToggleOperator(op)}
                      >
                        {op.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear Operador */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-titulo">Registrar Nuevo Operador</h2>
              <button className="btn-cerrar-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateOperator}>
              <div className="modal-body">
                {/* Paso 1: Buscar por C.I. */}
                <div className="formulario-grupo">
                  <label className="formulario-label">1. Buscar Persona por C.I. (DIP)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="formulario-input"
                      placeholder="Ej. 7419416"
                      value={searchDip}
                      onChange={(e) => setSearchDip(e.target.value)}
                      disabled={modalCargando || !!personaEncontrada}
                    />
                    {personaEncontrada ? (
                      <button 
                        type="button" 
                        className="btn btn--secundario"
                        onClick={() => {
                          setPersonaEncontrada(null);
                          setSearchDip('');
                        }}
                      >
                        Limpiar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--secundario"
                        onClick={handleSearchPersona}
                        disabled={!searchDip.trim() || modalCargando}
                      >
                        Buscar
                      </button>
                    )}
                  </div>
                </div>

                {searchError && (
                  <div className="alerta-error" style={{ padding: '8px 12px', fontSize: '13px', marginBottom: '14px' }}>
                    <AlertTriangle size={14} />
                    <span>{searchError}</span>
                  </div>
                )}

                {personaEncontrada && (
                  <div className="alerta-exito" style={{ padding: '10px 14px', marginBottom: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <CheckCircle size={15} />
                      <span>Persona Encontrada:</span>
                    </div>
                    <div style={{ marginLeft: '21px', color: '#065f46' }}>
                      <strong>{personaEncontrada.nombreCompleto}</strong><br/>
                      C.I.: {personaEncontrada.dip} {personaEncontrada.correo ? `| Correo: ${personaEncontrada.correo}` : ''}
                    </div>
                  </div>
                )}

                {/* Paso 2: Selección de Rol y Restricción */}
                {personaEncontrada && (
                  <>
                    <div className="formulario-grupo">
                      <label className="formulario-label">2. Asignar Perfil / Rol</label>
                      <select
                        className="formulario-select"
                        value={selectedRol}
                        onChange={(e) => setSelectedRol(e.target.value as any)}
                        disabled={modalCargando}
                      >
                        <option value="OPERADOR_NOTIFICACIONES">Operador Limitado (Solo Notificaciones)</option>
                        <option value="ADMINISTRADOR_APP">Administrador Global (Acceso Total)</option>
                      </select>
                    </div>

                    {selectedRol === 'OPERADOR_NOTIFICACIONES' && (
                      <div className="formulario-grupo">
                        <label className="formulario-label">3. Delimitar a Facultad</label>
                        <select
                          className="formulario-select"
                          value={selectedFacultad}
                          onChange={(e) => setSelectedFacultad(e.target.value)}
                          disabled={modalCargando}
                        >
                          {facultades.map(f => (
                            <option key={f.idFacultad} value={f.idFacultad}>
                              {f.facultad} ({f.abrev})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="formulario-grupo">
                      <label className="formulario-label">
                        4. Contraseña Personalizada (Opcional)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                        <Key size={16} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
                        <input
                          type="password"
                          className="formulario-input"
                          style={{ paddingLeft: '32px' }}
                          placeholder="Por defecto se usará su número de C.I."
                          value={customPassword}
                          onChange={(e) => setCustomPassword(e.target.value)}
                          disabled={modalCargando}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--secundario"
                  onClick={() => setShowModal(false)}
                  disabled={modalCargando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primario"
                  disabled={!personaEncontrada || modalCargando}
                >
                  {modalCargando ? 'Guardando...' : 'Habilitar Acceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
