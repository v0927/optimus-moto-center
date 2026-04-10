import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { formatLempiras } from '../utils/format';
import { useWindowSize } from '../useWindowSize';

export default function Dashboard() {
  const [productos,       setProductos]      = useState([]);
  const [ventas,          setVentas]         = useState([]);
  const [totalVentasHoy,  setTotalVentasHoy] = useState(0);
  const [stockBajo,       setStockBajo]      = useState([]);
  const [loading,         setLoading]        = useState(true);
  const { isMobile, isTablet }               = useWindowSize();
  const esMovil                              = isMobile || isTablet;

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      const { data: prods } = await supabase
        .from('productos').select('*').eq('activo', true);
      setProductos(prods || []);
      const productosBajo = (prods || []).filter(p => p.stock <= p.stock_minimo);
      setStockBajo(productosBajo);
      const hoy = new Date().toISOString().split('T')[0];
      const { data: ventasHoy } = await supabase
        .from('ventas')
        .select(`*, venta_items ( cantidad, precio, subtotal, productos ( nombre, sku ) )`)
        .gte('creado_en', `${hoy}T00:00:00`)
        .lte('creado_en', `${hoy}T23:59:59`)
        .order('creado_en', { ascending: false });
      setVentas(ventasHoy || []);
      const total = (ventasHoy || []).reduce((sum, v) => sum + parseFloat(v.total), 0);
      setTotalVentasHoy(total);
      setLoading(false);
    }
    cargarDatos();
  }, []);

  const estadoClase = {
    'Completado': 'badge-disponible',
    'Procesando': 'badge-bajo',
    'Pendiente':  'badge-critico',
  };

  const kpis = [
    { label: 'Total de Productos',   value: productos.length.toLocaleString(), sub: 'productos activos',                                           color: '#1A56DB' },
    { label: 'Ventas de Hoy',        value: formatLempiras(totalVentasHoy),    sub: `${ventas.length} transacciones`,                              color: '#16A34A' },
    { label: 'Alerta de Stock Bajo', value: stockBajo.length > 0 ? `${stockBajo.length} artículos` : 'Sin alertas', sub: stockBajo.length > 0 ? 'Requieren atención' : 'Todo en orden', color: stockBajo.length > 0 ? '#DC2626' : '#16A34A' },
    { label: 'Productos Sin Stock',  value: productos.filter(p => p.stock === 0).length, sub: 'agotados',                                          color: '#D97706' },
  ];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'60vh', fontSize:'14px', color:'var(--color-text-muted)' }}>
      Cargando datos...
    </div>
  );

  return (
    <div style={{ padding: esMovil ? '16px' : '24px',
      maxWidth:'1400px', margin:'0 auto' }}>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? '1fr 1fr' : 'repeat(4,1fr)',
        gap: esMovil ? '10px' : '16px',
        marginBottom: '16px',
      }}>
        {kpis.map((k, i) => (
          <div key={i} className="card" style={{ padding: esMovil ? '12px' : '16px' }}>
            <p style={{ fontSize:'11px', color:'var(--color-text-muted)', marginBottom:'4px' }}>
              {k.label}
            </p>
            <p style={{ fontSize: esMovil ? '20px' : '26px', fontWeight:700, color:k.color }}>
              {k.value}
            </p>
            <p style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'2px' }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {stockBajo.filter(p => p.stock === 0).map((p, i) => (
        <div key={i} style={{ background:'#FEF2F2', border:'0.5px solid #FECACA',
          borderRadius:'8px', padding:'10px 14px', marginBottom:'8px',
          fontSize:'12px', color:'#B91C1C', display:'flex', gap:'8px' }}>
          ⚠️ <strong>CRÍTICO:</strong> {p.nombre} ({p.sku}) — Sin stock
        </div>
      ))}
      {stockBajo.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).map((p, i) => (
        <div key={i} style={{ background:'#FFFBEB', border:'0.5px solid #FDE68A',
          borderRadius:'8px', padding:'10px 14px', marginBottom:'8px',
          fontSize:'12px', color:'#92400E', display:'flex', gap:'8px' }}>
          ⚠️ <strong>ADVERTENCIA:</strong> {p.nombre} — {p.stock} unidades (mínimo: {p.stock_minimo})
        </div>
      ))}

      <div style={{ marginBottom:'16px' }} />

      {/* Ventas recientes */}
      <div className="card" style={{ padding: esMovil ? '12px' : '16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:'12px' }}>
          <h3 style={{ fontSize: esMovil ? '13px' : '14px', fontWeight:600 }}>
            Ventas Recientes
          </h3>
          <span style={{ fontSize:'11px', color:'var(--color-text-muted)' }}>
            {new Date().toLocaleDateString('es-HN')}
          </span>
        </div>

        {ventas.length === 0 ? (
          <p style={{ fontSize:'13px', color:'var(--color-text-muted)',
            textAlign:'center', padding:'24px 0' }}>
            No hay ventas registradas hoy
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse',
              fontSize: esMovil ? '12px' : '13px', minWidth: esMovil ? '500px' : 'auto' }}>
              <thead>
                <tr style={{ borderBottom:'0.5px solid var(--color-border)' }}>
                  {['#','Productos','Total','Método','Estado'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px',
                      color:'var(--color-text-muted)', fontSize:'11px', fontWeight:500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ventas.map(v => (
                  <tr key={v.id} style={{ borderBottom:'0.5px solid var(--color-border)' }}>
                    <td style={{ padding:'8px', color:'var(--color-text-muted)' }}>#{v.id}</td>
                    <td style={{ padding:'8px' }}>
                      {v.venta_items?.map(i => `${i.cantidad}x ${i.productos?.nombre}`).join(', ')}
                    </td>
                    <td style={{ padding:'8px', fontWeight:500 }}>{formatLempiras(v.total)}</td>
                    <td style={{ padding:'8px' }}>{v.metodo_pago}</td>
                    <td style={{ padding:'8px' }}>
                      <span className={`badge ${estadoClase[v.estado] || 'badge-disponible'}`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}