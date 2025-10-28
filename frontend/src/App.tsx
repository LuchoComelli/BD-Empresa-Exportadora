import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import './index.css';

// Placeholder components
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
    <p className="mt-4 text-gray-600">Bienvenido al sistema de gestión de empresas exportadoras</p>
  </div>
);

const EmpresasList = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900">Lista de Empresas</h1>
    <p className="mt-4 text-gray-600">Aquí se mostrará la lista de empresas</p>
  </div>
);

const RegistroPublico = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900">Registro de Empresa</h1>
    <p className="mt-4 text-gray-600">Formulario de registro público</p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<RegistroPublico />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas"
            element={
              <ProtectedRoute>
                <EmpresasList />
              </ProtectedRoute>
            }
          />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

