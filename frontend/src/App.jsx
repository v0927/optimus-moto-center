import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import POS from './pages/POS';
import Reportes from './pages/Reportes';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ minHeight:'calc(100vh - 56px)', background:'#F4F4F6' }}>
        <Routes>
          <Route path="/"           element={<Dashboard />}  />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/ventas"     element={<POS />}        />
          <Route path="/reportes"   element={<Reportes />}   />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;