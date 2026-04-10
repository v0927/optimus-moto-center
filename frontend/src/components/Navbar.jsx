import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { useWindowSize } from '../useWindowSize';
import logo from '../assets/logo.jpeg';

const navItems = [
  { path: '/',           label: 'Inicio'     },
  { path: '/inventario', label: 'Inventario' },
  { path: '/ventas',     label: 'Ventas'     },
  { path: '/reportes',   label: 'Reportes'   },
];

export default function Navbar() {
  const location                    = useLocation();
  const { session, cerrarSesion }   = useAuth();
  const { isMobile, isTablet }      = useWindowSize();
  const [menuAbierto, setMenu]      = useState(false);
  const esMovil                     = isMobile || isTablet;

  function cerrarMenu() { setMenu(false); }

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center',
        padding: esMovil ? '0 16px' : '0 24px',
        height: '56px', background: '#0A0A0A',
        borderBottom: '3px solid #CC0000',
        position: 'sticky', top: 0, zIndex: 100,
      }}>

        {/* Logo */}
        <Link to="/" onClick={cerrarMenu}
          style={{ display:'flex', alignItems:'center', gap:'10px',
            textDecoration:'none', flex: esMovil ? 1 : 'none',
            marginRight: esMovil ? 0 : '24px' }}>
          <img src={logo} alt="Optimus Moto Center"
            style={{ height:'38px', width:'38px',
              objectFit:'contain', borderRadius:'50%' }} />
          <span style={{ color:'white', fontWeight:700,
            fontSize: esMovil ? '13px' : '15px' }}>
            Optimus <span style={{ color:'#CC0000' }}>Moto Center</span>
          </span>
        </Link>

        {/* Links desktop */}
        {!esMovil && navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '13px',
              fontWeight: active ? 600 : 400, textDecoration: 'none',
              color: active ? 'white' : '#94A3B8',
              background: active ? '#CC0000' : 'transparent',
              transition: 'all .15s',
            }}>{item.label}</Link>
          );
        })}

        {/* Botón cerrar sesión desktop */}
        {!esMovil && (
          <div style={{ marginLeft:'auto', display:'flex',
            alignItems:'center', gap:'12px' }}>
            {session && (
              <span style={{ fontSize:'12px', color:'#94A3B8' }}>
                {session.user.email}
              </span>
            )}
            <button onClick={cerrarSesion} style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 500, background: 'transparent', cursor: 'pointer',
              border: '0.5px solid #CC0000', color: '#CC0000',
            }}>Cerrar sesión</button>
          </div>
        )}

        {/* Botón hamburguesa móvil */}
        {esMovil && (
          <button onClick={() => setMenu(m => !m)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px', display: 'flex', flexDirection: 'column',
            gap: '5px', marginLeft: 'auto',
          }}>
            <span style={{
              display: 'block', width: '22px', height: '2px',
              background: menuAbierto ? '#CC0000' : 'white',
              transition: 'all .2s',
              transform: menuAbierto ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }} />
            <span style={{
              display: 'block', width: '22px', height: '2px',
              background: 'white', transition: 'all .2s',
              opacity: menuAbierto ? 0 : 1,
            }} />
            <span style={{
              display: 'block', width: '22px', height: '2px',
              background: menuAbierto ? '#CC0000' : 'white',
              transition: 'all .2s',
              transform: menuAbierto ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
            }} />
          </button>
        )}
      </nav>

      {/* Menú desplegable móvil */}
      {esMovil && menuAbierto && (
        <div style={{
          position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 99,
        }} onClick={cerrarMenu}>
          <div style={{
            background: '#0A0A0A', borderBottom: '0.5px solid #333',
            padding: '8px 0',
          }} onClick={e => e.stopPropagation()}>

            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  onClick={cerrarMenu}
                  style={{
                    display: 'block', padding: '14px 20px',
                    fontSize: '15px', fontWeight: active ? 600 : 400,
                    textDecoration: 'none',
                    color: active ? '#CC0000' : '#94A3B8',
                    borderLeft: active ? '3px solid #CC0000' : '3px solid transparent',
                    background: active ? 'rgba(204,0,0,0.08)' : 'transparent',
                    transition: 'all .15s',
                  }}>{item.label}</Link>
              );
            })}

            <div style={{ borderTop: '0.5px solid #222',
              margin: '8px 0', padding: '12px 20px' }}>
              {session && (
                <p style={{ fontSize:'12px', color:'#64748B', marginBottom:'10px' }}>
                  {session.user.email}
                </p>
              )}
              <button onClick={() => { cerrarSesion(); cerrarMenu(); }}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  background: 'transparent', border: '0.5px solid #CC0000',
                  color: '#CC0000',
                }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}