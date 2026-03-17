import { formatLempiras } from '../utils/format.js';

const kpis = [
  { label: 'Total de Productos',   value: '1,240',              sub: '+12% del mes pasado', color: '#1A56DB' },
  { label: 'Ventas de Hoy',        value: formatLempiras(3480), sub: '+8% de ayer',         color: '#16A34A' },
  { label: 'Alerta de Stock Bajo', value: '7 artículos',        sub: 'Requieren atención',  color: '#DC2626' },
  { label: 'Proveedores Activos',  value: '14',                 sub: '2 nuevos este mes',   color: '#D97706' },
];

const ventas = [
  { producto: 'Filtro de Aceite OF-4567',      cant: 2, total: 890,  estado: 'Completado' },
  { producto: 'Pastillas de Freno BP-890',      cant: 1, total: 2500, estado: 'Completado' },
  { producto: 'Filtro de Aire AF-2341',         cant: 3, total: 675,  estado: 'Procesando' },
  { producto: 'Bujías SP-123',                  cant: 4, total: 280,  estado: 'Pendiente'  },
  { producto: 'Fluido de Transmisión TF-567',  cant: 2, total: 890,  estado: 'Completado' },
];

const estadoClase = {
  'Completado': 'badge-disponible',
  'Procesando': 'badge-bajo',
  'Pendiente':  'badge-critico',
};

export default function Dashboard() {
  return (
    <div style={{ padding:'24px', maxWidth:'1400px', margin:'0 auto' }}>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'20px' }}>
        {kpis.map((k, i) => (
          <div key={i} className="card">
            <p style={{ fontSize:'12px', color:'var(--color-text-muted)', marginBottom:'6px' }}>{k.label}</p>
            <p style={{ fontSize:'26px', fontWeight:700, color:k.color }}>{k.value}</p>
            <p style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'4px' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      <div style={{ background:'#FEF2F2', border:'0.5px solid #FECACA', borderRadius:'8px',
        padding:'12px 16px', marginBottom:'10px', fontSize:'13px', color:'#B91C1C', display:'flex', gap:'8px' }}>
        ⚠️ <strong>CRÍTICO:</strong> Filtro de Aire AF-2341 por debajo del umbral mínimo (3 unidades restantes)
      </div>
      <div style={{ background:'#FFFBEB', border:'0.5px solid #FDE68A', borderRadius:'8px',
        padding:'12px 16px', marginBottom:'24px', fontSize:'13px', color:'#92400E', display:'flex', gap:'8px' }}>
        ⚠️ <strong>ADVERTENCIA:</strong> 6 productos requieren reabastecimiento en los próximos 7 días
      </div>

      {/* Ventas recientes */}
      <div className="card">
        <h3 style={{ fontSize:'14px', fontWeight:600, marginBottom:'14px' }}>Ventas Recientes</h3>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr style={{ borderBottom:'0.5px solid var(--color-border)' }}>
              {['Producto','Cant.','Total','Estado'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px',
                  color:'var(--color-text-muted)', fontSize:'11px', fontWeight:500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ventas.map((v, i) => (
              <tr key={i} style={{ borderBottom:'0.5px solid var(--color-border)' }}>
                <td style={{ padding:'10px 8px' }}>{v.producto}</td>
                <td style={{ padding:'10px 8px' }}>{v.cant}</td>
                <td style={{ padding:'10px 8px', fontWeight:500 }}>{formatLempiras(v.total)}</td>
                <td style={{ padding:'10px 8px' }}>
                  <span className={`badge ${estadoClase[v.estado]}`}>{v.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}