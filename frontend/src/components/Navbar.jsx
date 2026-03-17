import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.jpeg';

const navItems = [
  { path: '/',            label: 'Inicio'       },
  { path: '/inventario',  label: 'Inventario'   },
  { path: '/ventas',      label: 'Ventas'       },
  { path: '/reportes',    label: 'Reportes'     },
  { path: '/config',      label: 'Configuración'},
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 24px',
      height: '56px',
      background: '#0A0A0A',
      borderBottom: '3px solid #CC0000',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px',
        textDecoration:'none', marginRight:'24px' }}>
        <img src={logo} alt="Optimus Moto Center"
          style={{ height:'40px', width:'40px', objectFit:'contain', borderRadius:'50%' }} />
        <span style={{ color:'white', fontWeight:700, fontSize:'15px' }}>
          Optimus <span style={{ color:'#CC0000' }}>Moto Center</span>
        </span>
      </Link>

      {navItems.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: active ? 600 : 400,
            textDecoration: 'none',
            color: active ? 'white' : '#94A3B8',
            background: active ? '#CC0000' : 'transparent',
            transition: 'all .15s',
          }}>
            {item.label}
          </Link>
        );
      })}

      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
        <span style={{ color:'#94A3B8', fontSize:'18px', cursor:'pointer' }}>🔔</span>
        <div style={{
          width:'34px', height:'34px', borderRadius:'50%',
          background:'#CC0000', display:'flex', alignItems:'center',
          justifyContent:'center', color:'white', fontWeight:700, fontSize:'13px'
        }}>A</div>
      </div>
    </nav>
  );
}