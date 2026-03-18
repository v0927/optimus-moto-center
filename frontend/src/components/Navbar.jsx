import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';
import logo from '../assets/logo.jpeg';

const navItems = [
  { path: '/',           label: 'Inicio'        },
  { path: '/inventario', label: 'Inventario'    },
  { path: '/ventas',     label: 'Ventas'        },
  { path: '/reportes',   label: 'Reportes'      },
];

export default function Navbar() {
  const location          = useLocation();
  const { session, cerrarSesion } = useAuth();

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '0 24px', height: '56px', background: '#0A0A0A',
      borderBottom: '3px solid #CC0000', position: 'sticky',
      top: 0, zIndex: 100,
    }}>

      {/* Logo */}
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px',
        textDecoration:'none', marginRight:'24px' }}>
        <img src={logo} alt="Optimus Moto Center"
          style={{ height:'40px', width:'40px', objectFit:'contain',
            borderRadius:'50%' }} />
        <span style={{ color:'white', fontWeight:700, fontSize:'15px' }}>
          Optimus <span style={{ color:'#CC0000' }}>Moto Center</span>
        </span>
      </Link>

      {/* Links */}
      {navItems.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '13px',
            fontWeight: active ? 600 : 400, textDecoration: 'none',
            color: active ? 'white' : '#94A3B8',
            background: active ? '#CC0000' : 'transparent',
            transition: 'all .15s',
          }}>
            {item.label}
          </Link>
        );
      })}

      {/* Derecha */}
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
        {session && (
          <span style={{ fontSize:'12px', color:'#94A3B8' }}>
            {session.user.email}
          </span>
        )}
        <button
          onClick={cerrarSesion}
          style={{
            padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
            fontWeight: 500, background: 'transparent', cursor: 'pointer',
            border: '0.5px solid #CC0000', color: '#CC0000',
            transition: 'all .15s',
          }}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}