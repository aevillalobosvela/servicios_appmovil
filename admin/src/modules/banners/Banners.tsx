import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Link as LinkIcon, 
  Check, 
  AlertTriangle, 
  Calendar, 
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { bannersService, type BannerItem } from './banners';
import './Banners.css';

export function Banners() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [enlaceRedireccion, setEnlaceRedireccion] = useState('');
  const [activo, setActivo] = useState(true);
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  // Drag and drop state
  const [dragOver, setDragOver] = useState(false);

  const cargarBanners = async () => {
    try {
      setCargando(true);
      const data = await bannersService.getAll();
      setBanners(data);
    } catch (err: any) {
      setMensajeError(err.message || 'Error al cargar el listado de banners.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarBanners();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validarYEstablecerImagen(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validarYEstablecerImagen(e.target.files[0]);
    }
  };

  const validarYEstablecerImagen = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setMensajeError('Formato de archivo no válido. Solo se admiten JPG, PNG, JPEG y WEBP.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setMensajeError('La imagen excede el límite permitido de 4MB.');
      return;
    }
    setImagenArchivo(file);
    setImagenPreview(URL.createObjectURL(file));
    setMensajeError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeExito(null);
    setMensajeError(null);

    if (!imagenArchivo) {
      setMensajeError('Por favor selecciona una imagen para el banner.');
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('imagen', imagenArchivo);
      formData.append('titulo', titulo);
      formData.append('enlaceRedireccion', enlaceRedireccion);
      formData.append('activo', activo ? 'true' : 'false');

      await bannersService.create(formData);
      
      setMensajeExito('¡Banner publicado exitosamente!');
      setTitulo('');
      setEnlaceRedireccion('');
      setActivo(true);
      setImagenArchivo(null);
      setImagenPreview(null);
      
      cargarBanners();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al subir el banner al servidor.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleToggleActive = async (id: number, actualActivo: boolean) => {
    setMensajeExito(null);
    setMensajeError(null);
    try {
      const nuevoActivo = !actualActivo;
      await bannersService.toggleActive(id, nuevoActivo);
      setMensajeExito(nuevoActivo ? 'Banner activado (otros banners desactivados).' : 'Banner desactivado.');
      cargarBanners();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al cambiar estado del banner.');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar permanentemente este banner? Se borrará de la base de datos y del servidor.');
    if (!confirmar) return;

    setMensajeExito(null);
    setMensajeError(null);
    try {
      await bannersService.delete(id);
      setMensajeExito('Banner eliminado correctamente.');
      cargarBanners();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al eliminar el banner.');
    }
  };

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Gestor de Banners de Inicio</h1>
          <p className="pagina-subtitulo">
            Sube y administra los banners publicitarios que verán los usuarios en la cabecera de la aplicación móvil.
          </p>
        </div>
      </div>

      {mensajeExito && (
        <div className="alerta-exito" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Check size={18} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="alerta-error" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertTriangle size={18} />
          <span>{mensajeError}</span>
        </div>
      )}

      <div className="banners-layout">
        {/* Columna Izquierda: Formulario de Carga */}
        <div className="panel-card banners-form-card">
          <h2 className="panel-card-titulo">
            <Upload size={20} />
            Subir Nuevo Banner
          </h2>
          <form onSubmit={handleSubmit} className="banners-form">
            <div 
              className={`drag-drop-area ${dragOver ? 'drag-over' : ''} ${imagenPreview ? 'has-preview' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {imagenPreview ? (
                <div className="image-preview-container">
                  <img src={imagenPreview} alt="Preview" className="banner-preview-img" />
                  <button 
                    type="button" 
                    className="btn-remove-preview"
                    onClick={() => {
                      setImagenArchivo(null);
                      setImagenPreview(null);
                    }}
                  >
                    Remover Imagen
                  </button>
                </div>
              ) : (
                <label className="drag-drop-label">
                  <ImageIcon size={40} className="upload-icon" />
                  <span className="drag-drop-text">Arrastra aquí una imagen o haz clic para buscar</span>
                  <span className="drag-drop-subtext">Formatos recomendados: JPG, PNG, WEBP (Límite: 4MB)</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                  />
                </label>
              )}
            </div>

            <div className="formulario-grupo">
              <label className="formulario-label">Título del Banner (Opcional)</label>
              <input 
                type="text" 
                className="formulario-input" 
                placeholder="Ej. Inscripciones Gestión 2/2026 UTO"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="formulario-grupo">
              <label className="formulario-label">Enlace de Redirección (Opcional)</label>
              <input 
                type="url" 
                className="formulario-input" 
                placeholder="Ej. https://servicios.uto.edu.bo/matriculas"
                value={enlaceRedireccion}
                onChange={(e) => setEnlaceRedireccion(e.target.value)}
              />
              <span className="input-helper-text">
                Al tocar el banner en la aplicación, el estudiante será dirigido a esta dirección URL.
              </span>
            </div>

            <div className="formulario-grupo checkbox-inline-wrapper">
              <label className="checkbox-switch-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={activo} 
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span className="checkbox-switch-text" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-gris-texto)' }}>
                  Activar de forma inmediata al guardar (desactivará los otros banners)
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn--primario" style={{ width: '100%', marginTop: '12px' }} disabled={subiendo}>
              <Sparkles size={18} />
              {subiendo ? 'Subiendo Banner...' : 'Publicar Banner'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Historial de Banners */}
        <div className="panel-card banners-list-card">
          <h2 className="panel-card-titulo">
            <ImageIcon size={20} />
            Historial de Banners
          </h2>

          {cargando ? (
            <div className="loading-state">
              <p>Cargando banners...</p>
            </div>
          ) : banners.length === 0 ? (
            <div className="empty-state">
              <ImageIcon size={48} className="empty-icon" />
              <p>No se han registrado banners en el sistema.</p>
            </div>
          ) : (
            <div className="banners-grid-list">
              {banners.map((b) => (
                <div key={b.id} className={`banner-item-card ${b.activo ? 'banner-active' : ''}`}>
                  <div className="banner-card-img-wrapper">
                    <img src={b.imagenUrl} alt={b.titulo || 'Banner'} className="banner-card-img" />
                    {b.activo && (
                      <span className="banner-badge-active">Activo</span>
                    )}
                  </div>
                  <div className="banner-card-content">
                    <h3 className="banner-card-title">{b.titulo || 'Sin Título'}</h3>
                    {b.enlaceRedireccion && (
                      <div className="banner-card-link-row">
                        <LinkIcon size={14} />
                        <a href={b.enlaceRedireccion} target="_blank" rel="noopener noreferrer" className="banner-card-link">
                          {b.enlaceRedireccion}
                        </a>
                      </div>
                    )}
                    <div className="banner-card-date">
                      <Calendar size={14} />
                      <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="banner-card-actions">
                      <button 
                        type="button"
                        className={`btn-action-active ${b.activo ? 'is-active' : ''}`}
                        onClick={() => handleToggleActive(b.id, b.activo)}
                        title={b.activo ? 'Desactivar Banner' : 'Activar Banner'}
                      >
                        {b.activo ? <ToggleRight size={28} color="var(--color-primario)" /> : <ToggleLeft size={28} color="#94a3b8" />}
                        <span className="btn-action-text">{b.activo ? 'Activo' : 'Inactivo'}</span>
                      </button>

                      <button 
                        type="button" 
                        className="btn-action-delete"
                        onClick={() => handleDelete(b.id)}
                        title="Eliminar Banner"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
