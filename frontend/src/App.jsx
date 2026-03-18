import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import Navbar    from './components/Navbar';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import POS       from './pages/POS';
import Reportes  from './pages/Reportes';

function RutaProtegida({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:'100vh', fontSize:'14px', color:'#64748B' }}>
        Cargando...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const { session } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          session ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/*" element={
          <RutaProtegida>
            <Navbar />
            <main style={{ minHeight:'calc(100vh - 56px)', background:'#F4F4F6' }}>
              <Routes>
                <Route path="/"            element={<Dashboard />}  />
                <Route path="/inventario"  element={<Inventario />} />
                <Route path="/ventas"      element={<POS />}        />
                <Route path="/reportes"    element={<Reportes />}   />
              </Routes>
            </main>
          </RutaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}