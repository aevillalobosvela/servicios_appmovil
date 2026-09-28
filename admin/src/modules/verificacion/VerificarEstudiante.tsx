import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Keyboard, Loader2, ShieldCheck } from 'lucide-react';
import logoUto from '../../assets/logo_uto.png';
import { api } from '../../services/api';
import { ResultadoVerificacion } from './ResultadoVerificacion';
import { Html5Qrcode } from 'html5-qrcode';
import './VerificarEstudiante.css';

interface StudentData {
  nombreCompleto: string;
  dip: string;
  codigo: number | null;
  carrera: string;
  facultad: string;
  digital: string;
}

interface VerificationResult {
  valid: boolean;
  student?: StudentData;
  error?: string;
}

export function VerificarEstudiante() {
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  const [carnetId, setCarnetId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<VerificationResult | null>(null);

  // Estados del Scanner QR
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [camaraIniciada, setCamaraIniciada] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Manejo del escaneo de QR
  const handleScan = async (decodedText: string) => {
    setCargando(true);
    setResultado(null);
    try {
      const parts = decodedText.split(':');
      if (parts.length !== 3) {
        throw new Error('El código QR escaneado no tiene un formato válido de verificación.');
      }
      const parsedCarnetId = parts[0];
      
      const res = await api.post('consulta/verificar', {
        carnetId: parsedCarnetId,
        qrToken: decodedText,
      });

      setResultado(res);
    } catch (err: any) {
      setResultado({
        valid: false,
        error: err.message || 'Error en la verificación del código QR.',
      });
    } finally {
      setCargando(false);
    }
  };

  // Manejo del formulario manual
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carnetId.trim() || !codigo.trim()) {
      setResultado({
        valid: false,
        error: 'Por favor complete todos los campos obligatorios.',
      });
      return;
    }

    // Validar formato de ID de carnet numérico
    const carnetIdInt = parseInt(carnetId.trim(), 10);
    if (isNaN(carnetIdInt) || carnetIdInt <= 0) {
      setResultado({
        valid: false,
        error: 'El ID del carnet debe ser un número entero positivo (ej. 45).',
      });
      return;
    }

    setCargando(true);
    setResultado(null);
    try {
      const res = await api.post('consulta/verificar', {
        carnetId: carnetId.trim(),
        codigo: codigo.trim(),
      });
      setResultado(res);
    } catch (err: any) {
      setResultado({
        valid: false,
        error: err.message || 'Código o token de carnet digital inválido, vencido o inactivo.',
      });
    } finally {
      setCargando(false);
    }
  };

  // Ciclo de vida del escáner
  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    let isStarting = false;
    let isStopping = false;
    let shouldStop = false;

    const cleanScanner = async () => {
      shouldStop = true;
      if (html5QrCode) {
        if (!isStarting && !isStopping) {
          try {
            if (html5QrCode.isScanning) {
              isStopping = true;
              await html5QrCode.stop();
            }
          } catch (e) {
            console.error('Error stopping scanner:', e);
          } finally {
            isStopping = false;
          }
          scannerRef.current = null;
          if (isMounted) {
            setScannerActive(false);
          }
        }
      }
    };

    if (activeTab === 'qr' && camaraIniciada && !resultado && !cargando) {
      const startScanner = async () => {
        try {
          if (!isMounted || shouldStop) return;

          // Asegurar limpiar cualquier escáner previo sin abortar el inicio del nuevo
          if (scannerRef.current) {
            try {
              if (scannerRef.current.isScanning) {
                await scannerRef.current.stop();
              }
            } catch (e) {
              console.error('Error stopping previous scanner:', e);
            }
            scannerRef.current = null;
          }

          if (!isMounted || shouldStop) return;

          html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;
          isStarting = true;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: (width: number, height: number) => {
                const size = Math.min(width, height) * 0.75;
                return { width: size, height: size };
              },
              aspectRatio: 1.0,
            },
            async (decodedText: string) => {
              if (isMounted && !shouldStop) {
                await cleanScanner();
                handleScan(decodedText);
              }
            },
            () => {
              // Ignorar errores por frame
            }
          );

          isStarting = false;

          if (!isMounted || shouldStop) {
            try {
              if (html5QrCode.isScanning && !isStopping) {
                isStopping = true;
                await html5QrCode.stop();
              }
            } catch (e) {
              console.error('Error stopping scanner on post-mount cleanup:', e);
            } finally {
              isStopping = false;
            }
            scannerRef.current = null;
            if (isMounted) {
              setScannerActive(false);
            }
            return;
          }

          if (isMounted) {
            setScannerActive(true);
            setCameraError(null);
          }
        } catch (err: any) {
          isStarting = false;
          scannerRef.current = null;
          console.error('Error starting camera: ', err);
          if (isMounted && !shouldStop) {
            setCameraError(
              'No se pudo acceder a la cámara. Verifique los permisos de su navegador o use el ingreso manual.'
            );
            setScannerActive(false);
          }
        }
      };

      const timer = setTimeout(() => {
        startScanner();
      }, 150);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        cleanScanner();
      };
    } else {
      cleanScanner();
      return () => {
        isMounted = false;
        cleanScanner();
      };
    }
  }, [activeTab, resultado, cargando, camaraIniciada]);

  const resetConsulta = () => {
    setResultado(null);
    setCodigo('');
    setCamaraIniciada(false);
  };

  return (
    <div className="verificar-pagina">
      <div className="verificar-contenedor">
        
        {/* Encabezado Principal */}
        <header className="verificar-header">
          <img src={logoUto} alt="Escudo Universidad Técnica de Oruro" className="verificar-logo-uto" />
          <h1 className="verificar-titulo">Verificación de Credenciales</h1>
          <p className="verificar-subtitulo">Universidad Técnica de Oruro — Consulta Pública</p>
        </header>

        {resultado ? (
          <ResultadoVerificacion resultado={resultado} onReset={resetConsulta} />
        ) : (
          <div className="verificar-tarjeta">
            
            {/* Navegación por pestañas */}
            <div className="verificar-pestañas">
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('qr');
                  setResultado(null);
                  setCamaraIniciada(false);
                }}
              >
                <Camera size={18} />
                <span>Escanear Código QR</span>
              </button>
              
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('manual');
                  setResultado(null);
                  setCamaraIniciada(false);
                }}
              >
                <Keyboard size={18} />
                <span>Ingreso Manual</span>
              </button>
            </div>

            {/* Contenido de la pestaña QR */}
            {activeTab === 'qr' && (
              <div className="verificar-seccion-qr">
                {cargando ? (
                  <div className="verificar-cargando">
                    <Loader2 className="spinner" size={40} />
                    <p>Consultando validez del carnet...</p>
                  </div>
                ) : !camaraIniciada ? (
                  <div className="verificar-permiso-camara" style={{ textAlign: 'center', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ backgroundColor: 'rgba(0, 48, 135, 0.06)', padding: '20px', borderRadius: '50%' }}>
                      <Camera size={44} color="var(--color-primario)" />
                    </div>
                    
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-gris-texto)', margin: 0 }}>
                      Acceso Requerido a la Cámara
                    </h2>
                    
                    <p style={{ fontSize: '13.5px', color: 'var(--color-gris-secundario)', lineHeight: 1.6, maxWidth: '420px', margin: 0 }}>
                      Para poder verificar la validez del carnet digital, se requiere utilizar la cámara de su dispositivo para escanear el código QR.
                    </p>

                    <div style={{
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fcd34d',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '12.5px',
                      color: '#92400e',
                      lineHeight: 1.5,
                      maxWidth: '420px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>💡</span>
                      <span>
                        <strong>Aviso del Navegador:</strong> Al hacer clic en el botón de abajo, su navegador le solicitará confirmar el acceso a la cámara. Asegúrese de seleccionar la opción <strong>"Permitir"</strong> o <strong>"Aceptar"</strong> para iniciar el lector.
                      </span>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn--primario"
                      style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}
                      onClick={() => setCamaraIniciada(true)}
                    >
                      <Camera size={16} />
                      <span>Activar Cámara e Iniciar Escaneo</span>
                    </button>
                  </div>
                ) : cameraError ? (
                  <div className="verificar-error-camara">
                    <ShieldCheck size={40} className="error-icon" />
                    <p className="error-mensaje">{cameraError}</p>
                    <button 
                      type="button" 
                      className="btn btn--primario"
                      onClick={() => setActiveTab('manual')}
                    >
                      Usar Ingreso Manual
                    </button>
                  </div>
                ) : (
                  <div className="scanner-wrapper">
                    <div className="scanner-instrucciones">
                      <p>Apunte la cámara de su dispositivo al código QR del carnet digital.</p>
                    </div>
                    <div className="scanner-pantalla">
                      <div id="qr-reader" className="qr-reader-preview"></div>
                      {scannerActive && (
                        <div className="scanner-overlay">
                          <div className="scanner-target">
                            <span className="corner top-left"></span>
                            <span className="corner top-right"></span>
                            <span className="corner bottom-left"></span>
                            <span className="corner bottom-right"></span>
                            <div className="scanner-laser"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contenido de la pestaña Ingreso Manual */}
            {activeTab === 'manual' && (
              <div className="verificar-seccion-manual">
                <div className="scanner-instrucciones">
                  <p>Ingrese los datos mostrados en la aplicación móvil de la persona.</p>
                </div>

                <form onSubmit={handleManualSubmit} className="verificar-form">
                  <div className="campo">
                    <label className="campo-etiqueta" htmlFor="carnetId">
                      Identificador <span className="requerido">*</span>
                    </label>
                    <input
                      id="carnetId"
                      type="text"
                      inputMode="numeric"
                      className="campo-input"
                      placeholder="Ej: 45"
                      value={carnetId}
                      onChange={(e) => setCarnetId(e.target.value.replace(/\D/g, ''))}
                      disabled={cargando}
                      required
                    />
                    <small className="campo-ayuda">
                      Identificador numérico único del carnet disponible en la app de la persona.
                    </small>
                  </div>

                  <div className="campo">
                    <label className="campo-etiqueta" htmlFor="codigo">
                      Código de 5 Dígitos <span className="requerido">*</span>
                    </label>
                    <input
                      id="codigo"
                      type="text"
                      maxLength={5}
                      className="campo-input input-codigo"
                      placeholder="Ej: 8A49C"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      disabled={cargando}
                      required
                    />
                    <small className="campo-ayuda">
                      Código temporal de verificación generado por la persona (vigencia de 5 minutos).
                    </small>
                  </div>

                  <button
                    type="submit"
                    className="btn btn--primario btn--bloque verificar-submit-btn"
                    disabled={cargando}
                  >
                    {cargando ? (
                      <>
                        <Loader2 className="spinner spinner--alineado" size={16} />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <span>Verificar Credencial</span>
                    )}
                  </button>
                </form>
              </div>
            )}
            
          </div>
        )}

        {/* Enlace de retorno al panel administrativo */}
        <footer className="verificar-footer">
          <Link to="/" className="verificar-link-admin">
            <span>Volver al Inicio de Sesión</span>
          </Link>
          <div className="verificar-cop">
            Universidad Técnica de Oruro — Versión 1.0.0
          </div>
        </footer>

      </div>
    </div>
  );
}
