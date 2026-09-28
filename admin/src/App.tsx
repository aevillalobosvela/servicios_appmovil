import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './modules/auth/Login';
import { Carnets } from './modules/carnets/Carnets';
import { DetalleCarnet } from './modules/carnets/DetalleCarnet';
import { NotificacionesPush } from './modules/notificaciones/NotificacionesPush';
import { RutaProtegida } from './components/RutaProtegida';
import { VerificarEstudiante } from './modules/verificacion/VerificarEstudiante';
import { Banners } from './modules/banners/Banners';
import { Usuarios } from './modules/usuarios/Usuarios';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/"          element={<Login />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/verificar" element={<VerificarEstudiante />} />

        {/* Rutas protegidas (layout con sidebar) */}
        <Route element={<RutaProtegida />}>
          <Route element={<Layout />}>
            <Route path="/carnets"        element={<Carnets />} />
            <Route path="/carnets/:id"    element={<DetalleCarnet />} />
            <Route path="/notificaciones" element={<NotificacionesPush />} />
            <Route path="/banners"        element={<Banners />} />
            <Route path="/usuarios"       element={<Usuarios />} />
          </Route>
        </Route>

        {/* Redirecciones */}
        <Route path="*"  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
