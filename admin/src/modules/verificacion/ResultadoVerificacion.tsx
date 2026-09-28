import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

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

interface ResultadoVerificacionProps {
  resultado: VerificationResult;
  onReset: () => void;
}

export function ResultadoVerificacion({ resultado, onReset }: ResultadoVerificacionProps) {
  if (resultado.valid && resultado.student) {
    const s = resultado.student;
    return (
      <div className="resultado-tarjeta resultado-tarjeta--valido animate-scale-up">
        <div className="resultado-icono resultado-icono--valido">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="resultado-titulo resultado-titulo--valido">
          Identidad Verificada
        </h2>
        <p className="resultado-subtitulo">
          El carnet digital de la UTO es legítimo y se encuentra vigente.
        </p>

        <div className="res-foto-contenedor">
          <img
            src={s.digital || '/saga/../digital/sinfoto.JPG'}
            alt="Foto"
            className="res-foto"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/saga/../digital/sinfoto.JPG';
            }}
          />
        </div>

        <div className="resultado-detalles">
          <div className="res-fila">
            <span className="res-etiqueta">Persona</span>
            <span className="res-valor res-valor--destacado">{s.nombreCompleto}</span>
          </div>
          <div className="res-fila">
            <span className="res-etiqueta">Cédula de Identidad</span>
            <span className="res-valor">{s.dip}</span>
          </div>
          <div className="res-fila">
            <span className="res-etiqueta">RU / Código</span>
            <span className="res-valor">{s.codigo || 'N/A'}</span>
          </div>
          <div className="res-fila">
            <span className="res-etiqueta">Carrera</span>
            <span className="res-valor">{s.carrera}</span>
          </div>
          <div className="res-fila">
            <span className="res-etiqueta">Facultad</span>
            <span className="res-valor">{s.facultad}</span>
          </div>
        </div>

        <button className="btn btn--primario btn--bloque" onClick={onReset} style={{ marginTop: '10px' }}>
          Verificar otro carnet
        </button>
      </div>
    );
  }

  return (
    <div className="resultado-tarjeta resultado-tarjeta--invalido animate-scale-up">
      <div className="resultado-icono resultado-icono--invalido">
        <XCircle size={48} />
      </div>
      <h2 className="resultado-titulo resultado-titulo--invalido">
        Verificación Fallida
      </h2>
      <p className="resultado-subtitulo">
        No se pudo autenticar la credencial presentada.
      </p>

      <div className="resultado-error-caja">
        <p className="resultado-error-texto">
          {resultado.error || 'Código o token de carnet digital inválido, vencido o inactivo.'}
        </p>
      </div>

      <button className="btn btn--secundario btn--bloque" onClick={onReset}>
        <ArrowLeft size={14} /> Reintentar consulta
      </button>
    </div>
  );
}
