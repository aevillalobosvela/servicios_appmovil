import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Sparkles
} from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { BadgeEstado, type Carnet } from './Carnets';
import './DetalleCarnet.css';

export interface CarreraAcademica {
  idCarrera: number;
  carrera: string;
  idFacultad: number;
  facultad: string;
  idEstudiante: number;
  idPrograma: string;
  estadoPagoMatricula: boolean;
  estadoPagoEstudiante: boolean;
  habilitada: boolean;
  motivoInhabilitacion: string;
  periodoAcademico: string;
  fechaInscripcion: string;
  tipoEstudiante: string;
  // Propiedades opcionales del carnet asociado
  carnetId?: number;
  estado?: string;
  activadoEn?: string | null;
  expiraEn?: string | null;
  activadoPor?: number | null;
  qr?: string | null;
  updatedAt?: string | null;
}

export interface Deuda {
  fechaReg: string;
  observacion: string;
  estado: string;
  lugar: string;
}

export interface EstudianteDetalle extends Carnet {
  idCarrera: number | null;
  idEstudianteAcademico: number | null;
  carreras: CarreraAcademica[];
  tienePagoValor: boolean;
  esPrimeraEmision?: boolean;
  deudas?: Deuda[];
  qr?: string | null;
  fecNacimiento?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  celular?: string | null;
}

function FilaDato({ icon: Icon, etiqueta, valor }: { icon: any; etiqueta: string; valor: string }) {
  return (
    <div className="fila-dato">
      <div className="fila-dato-icon">
        <Icon size={16} />
      </div>
      <div className="fila-dato-content">
        <span className="fila-dato-etiqueta">{etiqueta}</span>
        <span className="fila-dato-valor">{valor}</span>
      </div>
    </div>
  );
}

export function DetalleCarnet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [estudiante, setEstudiante] = useState<EstudianteDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estado para fallback de foto
  const [fotoError, setFotoError] = useState(false);

  // Estados de activación
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<CarreraAcademica | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [accionPendiente, setAccionPendiente] = useState<'desactivar' | null>(null);

  const fetchEstudiante = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const data = await api.get(`admin/carnets/${id}`);
      setEstudiante(data);

      if (data.carreras && data.carreras.length > 0) {
        setCarreraSeleccionada(prev => {
          const updated = prev
            ? data.carreras.find((c: CarreraAcademica) => c.idCarrera === prev.idCarrera)
            : null;

          const selection = updated
            || data.carreras.find((c: CarreraAcademica) => c.estado === 'activo')
            || data.carreras[0];

          return selection;
        });
      } else {
        setCarreraSeleccionada(null);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Error de conexión con el servidor.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchEstudiante();
  }, [id]);

  if (cargando) {
    return (
      <div className="pagina">
        <div className="detalle-cargando" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando información de la persona...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !estudiante) {
    return (
      <div className="pagina">
        <div className="detalle-no-encontrado">
          <p>{errorMsg || 'Persona no encontrada.'}</p>
          <button className="btn btn--secundario" onClick={() => navigate('/carnets')}>
            <ArrowLeft size={14} /> Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  const handleCambiarEstado = (accion: 'desactivar') => {
    setAccionPendiente(accion);
    setConfirmando(true);
    setErrorAccion('');
  };

  const handleConfirmar = async () => {
    if (!estudiante) return;
    setConfirmando(false);
    setProcesandoAccion(true);
    setErrorAccion('');
    try {
      if (accionPendiente === 'desactivar') {
        if (!carreraSeleccionada || !carreraSeleccionada.carnetId) {
          throw new Error('Debe seleccionar un carnet válido para desactivar.');
        }
        await api.post(`admin/carnets/${carreraSeleccionada.carnetId}/desactivar`);

        await fetchEstudiante();
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        setErrorAccion(err.message);
      } else if (err instanceof Error) {
        setErrorAccion(err.message);
      } else {
        setErrorAccion('Error al procesar la solicitud en el servidor.');
      }
    } finally {
      setProcesandoAccion(false);
      setAccionPendiente(null);
    }
  };

  const handleCancelar = () => {
    setConfirmando(false);
    setAccionPendiente(null);
  };

  // Formateo de fechas
  const formatFecha = (fechaStr: string | null) => {
    if (!fechaStr) return 'N/A';
    return new Date(fechaStr).toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="pagina">

      {/* ── Encabezado ── */}
      <div className="pagina-header">
        <div className="detalle-encabezado-izq">
          <button className="btn-volver" onClick={() => navigate('/carnets')}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div>
            <h1 className="pagina-titulo">{estudiante.nombreCompleto}</h1>
            <p className="pagina-subtitulo">{estudiante.correo || 'Sin correo registrado'}</p>
          </div>
        </div>
        <BadgeEstado estado={estudiante.estado} />
      </div>

      <div className="detalle-grid">

        {/* ── Columna izquierda: datos del estudiante ── */}
        <div className="detalle-columna-perfil">
          <section className="seccion">
            <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Datos de la persona
            </h2>
            <div className="seccion-perfil-vert">
              <div className="foto-perfil-contenedor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#64748b' }}>
                {!fotoError && estudiante.digital ? (
                  <img
                    src={estudiante.digital}
                    alt="Foto de perfil"
                    className="foto-perfil"
                    onError={() => setFotoError(true)}
                  />
                ) : (
                  <User size={64} strokeWidth={1.5} />
                )}
              </div>

              <div className="datos-perfil-lista">
                <FilaDato icon={User} etiqueta="Nombre completo" valor={estudiante.nombreCompleto} />
                <FilaDato icon={FileText} etiqueta="Cédula de Identidad (CI)" valor={estudiante.dip} />
                <FilaDato icon={Mail} etiqueta="Correo" valor={estudiante.correo || 'No registrado'} />
                <FilaDato icon={Phone} etiqueta="Teléfono / Celular" valor={[estudiante.celular, estudiante.telefono].filter(Boolean).join(' / ') || 'No registrado'} />
                <FilaDato icon={Calendar} etiqueta="Fecha de nacimiento" valor={estudiante.fecNacimiento ? new Date(estudiante.fecNacimiento).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'No registrado'} />
                <FilaDato icon={MapPin} etiqueta="Dirección" valor={estudiante.direccion || 'No registrado'} />
              </div>

              {estudiante.esPrimeraEmision && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  borderRadius: '8px',
                  border: '1px solid rgba(3,105,161,0.15)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Sparkles size={16} style={{ flexShrink: 0 }} />
                  <span>El estudiante nunca obtuvo un carnet digital antes (será su primera vez). Califica para <strong>primera emisión gratuita</strong>.</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Columna derecha: Carreras y flujo de activación ── */}
        <div className="detalle-columna-carreras">

          {/* Sección Carreras */}
          <section className="seccion">
            <h2 className="seccion-titulo">Carreras Académicas y Habilitaciones</h2>
            <div className="seccion-cuerpo" style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="tabla" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-gris-claro)', borderBottom: '1px solid var(--color-gris-medio)' }}>
                      <th style={{ padding: '10px 15px', fontSize: '11px', textAlign: 'left' }}>Carrera / Programa</th>
                      <th style={{ padding: '10px 15px', fontSize: '11px', textAlign: 'left' }}>Facultad</th>
                      <th style={{ padding: '10px 15px', fontSize: '11px', textAlign: 'left' }}>Matrícula ID</th>
                      <th style={{ padding: '10px 15px', fontSize: '11px', textAlign: 'left' }}>Tipo</th>
                      <th style={{ padding: '10px 15px', fontSize: '11px', textAlign: 'left' }}>Últ. Periodo</th>
                      <th style={{ padding: '10px 15px', fontSize: '11px', textAlign: 'left' }}>Fecha Inscr.</th>
                      <th style={{ padding: '10px 15px', fontSize: '11px', textAlign: 'left' }}>Habilitación</th>
                      <th style={{ padding: '10px 15px', fontSize: '11px', textAlign: 'center' }}>Estado / Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiante.carreras && estudiante.carreras.map((c) => {
                      const esSeleccionada = carreraSeleccionada?.idCarrera === c.idCarrera;
                      return (
                        <tr
                          key={c.idCarrera}
                          className={`tabla-fila ${esSeleccionada ? 'fila-seleccionada' : ''}`}
                          onClick={() => {
                            setCarreraSeleccionada(c);
                            setErrorAccion('');
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ padding: '12px 15px' }}>
                            <div style={{ fontWeight: 600 }}>{c.carrera}</div>
                            {c.idPrograma && c.idPrograma !== 'N/A' && (
                              <div style={{ fontSize: '11px', color: 'var(--color-gris-deshabilitado)', marginTop: '2px' }}>
                                Programa: {c.idPrograma}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 15px', fontSize: '13px' }}>{c.facultad}</td>
                          <td style={{ padding: '12px 15px', fontSize: '13px', fontFamily: 'monospace' }}>{c.idEstudiante}</td>
                          <td style={{ padding: '12px 15px', fontSize: '13px' }}>
                            <span style={{ fontWeight: 500, color: 'var(--color-gris-texto)' }}>{c.tipoEstudiante || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '12px 15px', fontSize: '13px', fontWeight: 500 }}>{c.periodoAcademico || 'N/A'}</td>
                          <td style={{ padding: '12px 15px', fontSize: '13px' }}>
                            {c.fechaInscripcion ? new Date(c.fechaInscripcion).toLocaleDateString('es-BO', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
                          </td>
                          <td style={{ padding: '12px 15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
                              {/* Indicador de Matrícula */}
                              {c.habilitada ? (
                                <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-exito-bg)', color: 'var(--color-exito)', border: '1px solid rgba(26,127,60,0.15)', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>
                                  <CheckCircle2 size={12} style={{ flexShrink: 0 }} /> Matrícula al día
                                </span>
                              ) : (
                                <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-advertencia-bg)', color: 'var(--color-advertencia)', border: '1px solid rgba(180,83,9,0.15)', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }} title={c.motivoInhabilitacion}>
                                  <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {c.motivoInhabilitacion || 'Matrícula irregular'}
                                </span>
                              )}

                              {/* Indicador de Pago de Arancel */}
                              {(c.estado === 'activo' || c.estado === 'pendiente') ? (
                                <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-exito-bg)', color: 'var(--color-exito)', border: '1px solid rgba(26,127,60,0.15)', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>
                                  <CheckCircle2 size={12} style={{ flexShrink: 0 }} /> Arancel Consumido
                                </span>
                              ) : estudiante.esPrimeraEmision ? (
                                <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid rgba(3,105,161,0.15)', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>
                                  <Sparkles size={12} style={{ flexShrink: 0 }} /> Exento (1ra Emisión)
                                </span>
                              ) : estudiante.tienePagoValor ? (
                                <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-exito-bg)', color: 'var(--color-exito)', border: '1px solid rgba(26,127,60,0.15)', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>
                                  <CheckCircle2 size={12} style={{ flexShrink: 0 }} /> Arancel Disponible
                                </span>
                              ) : (
                                <span className="badge-estado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(192,57,43,0.15)', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>
                                  <XCircle size={12} style={{ flexShrink: 0 }} /> Sin Pago Arancel
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 15px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              <BadgeEstado estado={c.estado as any || 'inactivo'} />



                              {(c.estado === 'activo') && (
                                <button
                                  className="btn btn--peligro"
                                  style={{ padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap', marginTop: '4px' }}
                                  disabled={procesandoAccion}
                                  onClick={() => {
                                    setCarreraSeleccionada(c);
                                    handleCambiarEstado('desactivar');
                                  }}
                                >
                                  Desactivar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!estudiante.carreras || estudiante.carreras.length === 0) && (
                      <tr>
                        <td colSpan={8} className="tabla-vacia" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-gris-deshabilitado)' }}>
                          No se encontraron registros académicos de carrera para esta persona.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {carreraSeleccionada && (carreraSeleccionada.estado === 'activo') && (
              <div style={{ padding: '12px 15px', borderTop: '1px solid var(--color-gris-medio)', fontSize: '12px', color: 'var(--color-gris-secundario)', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between' }}>
                <span><strong>Activado en:</strong> {formatFecha(carreraSeleccionada.activadoEn || null)}</span>
                <span><strong>Expira el:</strong> {formatFecha(carreraSeleccionada.expiraEn || null)}</span>
              </div>
            )}
          </section>

          {/* Sub-grid inferior: QR y Deudas permanentes lado a lado */}
          <div className="sub-grid-acciones">

            {/* Tarjeta de Historial de Deudas (Siempre visible) */}
            <section className="seccion">
              <h2 className="seccion-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> Deudas y Observaciones
              </h2>
              <div className="seccion-cuerpo" style={{ padding: estudiante.deudas && estudiante.deudas.length > 0 ? 0 : '16px' }}>
                {estudiante.deudas && estudiante.deudas.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tabla" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-gris-claro)', borderBottom: '1px solid var(--color-gris-medio)', textAlign: 'left', fontWeight: '600' }}>
                          <th style={{ padding: '10px 12px', fontSize: '11px' }}>Fecha</th>
                          <th style={{ padding: '10px 12px', fontSize: '11px' }}>Lugar</th>
                          <th style={{ padding: '10px 12px', fontSize: '11px' }}>Observación</th>
                          <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estudiante.deudas.map((deuda, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--color-gris-medio)' }}>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: '12px' }}>
                              {new Date(deuda.fechaReg).toLocaleDateString('es-BO', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: '12px' }}>{deuda.lugar}</td>
                            <td style={{ padding: '10px 12px', fontSize: '12px' }}>{deuda.observacion}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <span style={{
                                backgroundColor: 'var(--color-error-bg)',
                                color: 'var(--color-error)',
                                border: '1px solid rgba(192,57,43,0.15)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                fontSize: '10px'
                              }}>
                                {deuda.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--color-gris-deshabilitado)' }}>
                    <CheckCircle2 size={32} style={{ color: 'var(--color-exito)', marginBottom: '8px', opacity: 0.7 }} />
                    <p style={{ fontWeight: 600, fontSize: '13px', margin: '0 0 4px 0', color: 'var(--color-gris-texto)' }}>Sin deudas pendientes</p>
                    <p style={{ fontSize: '11px', margin: 0 }}>Esta persona se encuentra libre de observaciones financieras en el sistema.</p>
                  </div>
                )}
              </div>
            </section>

          </div>

        </div>
      </div>

      {/* ── Modal de Confirmación de Activación/Desactivación ── */}
      {confirmando && carreraSeleccionada && (
        <div className="modal-overlay" onClick={handleCancelar}>
          <div className="modal-contenedor" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-titulo">
                Confirmar Desactivación de Carnet
              </h3>
              <button
                onClick={handleCancelar}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gris-secundario)', fontSize: '18px', fontWeight: 'bold' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-cuerpo">
              <p style={{ fontSize: '14px', color: 'var(--color-gris-texto)', lineHeight: 1.5, margin: 0 }}>
                ¿Confirmas que deseas desactivar la credencial de la carrera "{carreraSeleccionada.carrera}"? El estudiante perderá el acceso a su carnet digital en su dispositivo móvil de forma inmediata.
              </p>

              {/* Indicadores en texto plano sin sobrecargar */}
              <div style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: 'var(--color-gris-claro)',
                borderRadius: 'var(--radio-md)',
                border: '1px solid var(--color-gris-medio)',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-gris-secundario)' }}>Carrera:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-gris-texto)' }}>{carreraSeleccionada.carrera}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-gris-secundario)' }}>Matrícula:</span>
                  <span style={{ fontWeight: 600, color: carreraSeleccionada.habilitada ? 'var(--color-exito)' : 'var(--color-error)' }}>
                    {carreraSeleccionada.habilitada ? 'Habilitada al día' : 'Matrícula irregular'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-gris-secundario)' }}>Reposición de Carnet:</span>
                  <span style={{ fontWeight: 600, color: estudiante.esPrimeraEmision ? '#0369a1' : (estudiante.tienePagoValor ? 'var(--color-exito)' : 'var(--color-error)') }}>
                    {estudiante.esPrimeraEmision ? 'Exento (Primera Emisión Gratuita)' : (estudiante.tienePagoValor ? 'Disponible' : 'No disponible')}
                  </span>
                </div>
              </div>

              {errorAccion && (
                <div className="login-error" role="alert" style={{ marginTop: '10px', marginBottom: 0 }}>
                  {errorAccion}
                </div>
              )}
            </div>
            <div className="modal-acciones">
              <button
                className="btn btn--secundario"
                onClick={handleCancelar}
                disabled={procesandoAccion}
              >
                Cancelar
              </button>
              <button
                className="btn btn--peligro"
                onClick={handleConfirmar}
                disabled={procesandoAccion}
              >
                {procesandoAccion ? 'Procesando...' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
