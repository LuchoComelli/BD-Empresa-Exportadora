import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import RegistroEmpresa from './pages/registro/RegistroEmpresa';
import Dashboard from './pages/dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import EmpresasListado from './pages/empresas/EmpresasListado';
import EmpresaDetalle from './pages/empresas/EmpresaDetalle';
import EmpresasPendientes from './pages/empresas-pendientes/EmpresasPendientes';
import RevisarEmpresa from './pages/empresas-pendientes/RevisarEmpresa';
import NuevaEmpresa from './pages/empresas/NuevaEmpresa';
import Matriz from './pages/matriz/Matriz';
import Mapa from './pages/mapa/Mapa';
import Usuarios from './pages/usuarios/Usuarios';
import Configuracion from './pages/configuracion/Configuracion';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<RegistroEmpresa />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/empresas" element={<EmpresasListado />} />
          <Route path="/empresas/:id" element={<EmpresaDetalle />} />
          <Route path="/empresas-pendientes" element={<EmpresasPendientes />} />
          <Route path="/empresas-pendientes/:id" element={<RevisarEmpresa />} />
          <Route path="/empresas/nueva" element={<NuevaEmpresa />} />
          <Route path="/matriz" element={<Matriz />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/configuracion" element={<Configuracion />} />

          {/* Rutas protegidas */}
          <Route
           
            element={
              <ProtectedRoute>

              </ProtectedRoute>
            }
          />
          
          {/* Agregar más rutas protegidas aquí según necesites */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;