import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { formatLempiras } from '../utils/format';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Tooltip fuera del componente para evitar warnings ─────────
function TooltipLempiras({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:'0.5px solid #E2E8F0',
      borderRadius:'8px', padding:'10px 14px', fontSize:'12px' }}>
      <p style={{ fontWeight:600, marginBottom:'4px' }}>{label}</p>
      <p style={{ color:'#CC0000' }}>{formatLempiras(payload[0].value)}</p>
    </div>
  );
}

// ── Exportar Excel fuera del componente ───────────────────────
function exportarExcel() {
  const ahora  = new Date();
  const nombre = `reporte-optimus-${ahora.getFullYear()}-${ahora.getMonth()+1}.csv`;
  alert(`Función de exportación disponible próximamente.\nArchivo: ${nombre}`);
}

export default function Reportes() {
  const [loading,         setLoading]         = useState(true);
  const [ventasMensuales, setVentasMensuales]  = useState([]);
  const [topProductos,    setTopProductos]     = useState([]);
  const [ventasCategoria, setVentasCategoria]  = useState([]);
  const [metricas,        setMetricas]         = useState({
    margenBruto:   0,
    productoTop:   '—',
    totalVentas:   0,
    totalTransacc: 0,
  });

  useEffect(() => {
    async function cargarReportes() {
      setLoading(true);

      const { data: ventas } = await supabase
        .from('ventas')
        .select(`
          id, total, subtotal, creado_en,
          venta_items (
            cantidad, precio, subtotal,
            productos ( nombre, categoria, precio_compra )
          )
        `)
        .order('creado_en', { ascending: true });

      const todasVentas = ventas || [];

      // ── Ventas mensuales (últimos 12 meses) ───────────────────
      const ahora  = new Date();
      const hace12 = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
      const porMes = {};

      for (let i = 0; i < 12; i++) {
        const d   = new Date(hace12.getFullYear(), hace12.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        porMes[key] = { mes: MESES[d.getMonth()], total: 0 };
      }

      todasVentas.forEach(v => {
        const d   = new Date(v.creado_en);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (porMes[key]) porMes[key].total += parseFloat(v.total);
      });

      setVentasMensuales(Object.values(porMes));

      // ── Top 10 productos ──────────────────────────────────────
      const ingresosProd = {};
      todasVentas.forEach(v => {
        (v.venta_items || []).forEach(item => {
          const nombre = item.productos?.nombre || 'Desconocido';
          if (!ingresosProd[nombre]) ingresosProd[nombre] = 0;
          ingresosProd[nombre] += parseFloat(item.subtotal);
        });
      });

      const top10 = Object.entries(ingresosProd)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setTopProductos(top10);

      // ── Ventas por categoría ──────────────────────────────────
      const porCategoria = {};
      todasVentas.forEach(v => {
        (v.venta_items || []).forEach(item => {
          const cat = item.productos?.categoria || 'Sin categoría';
          if (!porCategoria[cat]) porCategoria[cat] = 0;
          porCategoria[cat] += parseFloat(item.subtotal);
        });
      });

      setVentasCategoria(
        Object.entries(porCategoria)
          .map(([categoria, total]) => ({ categoria, total }))
          .sort((a, b) => b.total - a.total)
      );

      // ── Métricas ──────────────────────────────────────────────
      const totalVentas = todasVentas.reduce((s, v) => s + parseFloat(v.total), 0);

      let costoTotal = 0;
      let ventaTotal = 0;
      todasVentas.forEach(v => {
        (v.venta_items || []).forEach(item => {
          const costo = parseFloat(item.productos?.precio_compra || 0);
          costoTotal += costo * item.cantidad;
          ventaTotal += parseFloat(item.subtotal);
        });
      });

      const margen     = ventaTotal > 0
        ? Math.round(((ventaTotal - costoTotal) / ventaTotal) * 100)
        : 0;
      const productoTop = top10.length > 0 ? top10[0].nombre : '—';

      setMetricas({
        margenBruto:   margen,
        productoTop,
        totalVentas,
        totalTransacc: todasVentas.length,
      });

      setLoading(false);
    }

    cargarReportes();
  }, []);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:'60vh', fontSize:'14px', color:'var(--color-text-muted)' }}>
        Cargando reportes...
      </div>
    );
  }

  const maxMes = Math.max(...ventasMensuales.map(x => x.total), 1);

  return (
    <div style={{ padding:'24px', maxWidth:'1400px', margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:700 }}>Panel de Reportes</h1>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="btn btn-outline"
            onClick={() => window.print()}
            style={{ fontSize:'12px' }}>
            Exportar PDF
          </button>
          <button className="btn btn-primary"
            onClick={exportarExcel}
            style={{ fontSize:'12px' }}>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:'16px', marginBottom:'24px' }}>
        <div className="card">
          <p style={{ fontSize:'12px', color:'var(--color-text-muted)', marginBottom:'6px' }}>
            Margen Bruto %
          </p>
          <p style={{ fontSize:'28px', fontWeight:700, color:'#16A34A' }}>
            {metricas.margenBruto}%
          </p>
          <p style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'4px' }}>
            sobre ventas totales
          </p>
        </div>
        <div className="card">
          <p style={{ fontSize:'12px', color:'var(--color-text-muted)', marginBottom:'6px' }}>
            Producto Más Vendido
          </p>
          <p style={{ fontSize:'14px', fontWeight:700, color:'#1A56DB',
            lineHeight:1.3, marginTop:'4px' }}>
            {metricas.productoTop}
          </p>
        </div>
        <div className="card">
          <p style={{ fontSize:'12px', color:'var(--color-text-muted)', marginBottom:'6px' }}>
            Total de Ventas
          </p>
          <p style={{ fontSize:'22px', fontWeight:700, color:'#CC0000' }}>
            {formatLempiras(metricas.totalVentas)}
          </p>
          <p style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'4px' }}>
            {metricas.totalTransacc} transacciones
          </p>
        </div>
        <div className="card">
          <p style={{ fontSize:'12px', color:'var(--color-text-muted)', marginBottom:'6px' }}>
            Promedio por Venta
          </p>
          <p style={{ fontSize:'22px', fontWeight:700, color:'#D97706' }}>
            {metricas.totalTransacc > 0
              ? formatLempiras(metricas.totalVentas / metricas.totalTransacc)
              : formatLempiras(0)}
          </p>
          <p style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'4px' }}>
            por transacción
          </p>
        </div>
      </div>

      {/* Gráfica ingresos mensuales */}
      <div className="card" style={{ marginBottom:'24px' }}>
        <h3 style={{ fontSize:'14px', fontWeight:600, marginBottom:'16px' }}>
          Tendencia de Ingresos — Últimos 12 meses
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={ventasMensuales}
            margin={{ top:5, right:20, left:10, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="mes" tick={{ fontSize:12, fill:'#64748B' }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#64748B' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `L ${(v/1000).toFixed(0)}k`} />
            <Tooltip content={TooltipLempiras} />
            <Line type="monotone" dataKey="total" stroke="#CC0000"
              strokeWidth={2.5} dot={{ fill:'#CC0000', r:4 }}
              activeDot={{ r:6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
        gap:'20px', marginBottom:'24px' }}>

        {/* Top 10 productos */}
        <div className="card">
          <h3 style={{ fontSize:'14px', fontWeight:600, marginBottom:'16px' }}>
            Top 10 Productos por Ingresos
          </h3>
          {topProductos.length === 0 ? (
            <p style={{ fontSize:'13px', color:'var(--color-text-muted)',
              textAlign:'center', padding:'24px 0' }}>
              Sin datos de ventas aún
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProductos} layout="vertical"
                margin={{ top:0, right:20, left:10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"
                  horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11, fill:'#64748B' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `L ${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nombre" width={130}
                  tick={{ fontSize:10, fill:'#64748B' }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={TooltipLempiras} />
                <Bar dataKey="total" fill="#CC0000" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ventas por categoría */}
        <div className="card">
          <h3 style={{ fontSize:'14px', fontWeight:600, marginBottom:'16px' }}>
            Ventas por Categoría
          </h3>
          {ventasCategoria.length === 0 ? (
            <p style={{ fontSize:'13px', color:'var(--color-text-muted)',
              textAlign:'center', padding:'24px 0' }}>
              Sin datos de ventas aún
            </p>
          ) : ventasCategoria.map((c, i) => {
            const maxCat = ventasCategoria[0].total;
            const pct    = Math.round((c.total / maxCat) * 100);
            return (
              <div key={i} style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  fontSize:'13px', marginBottom:'5px' }}>
                  <span style={{ fontWeight:500 }}>{c.categoria}</span>
                  <span style={{ color:'var(--color-text-muted)' }}>
                    {formatLempiras(c.total)}
                  </span>
                </div>
                <div style={{ height:'8px', background:'var(--gris-claro)',
                  borderRadius:'4px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`,
                    background:'#CC0000', borderRadius:'4px',
                    transition:'width .5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla resumen mensual */}
      <div className="card">
        <h3 style={{ fontSize:'14px', fontWeight:600, marginBottom:'14px' }}>
          Resumen mensual
        </h3>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr style={{ borderBottom:'0.5px solid var(--color-border)' }}>
              {['Mes','Total Vendido','Barra'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px',
                  fontSize:'11px', fontWeight:600,
                  color:'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ventasMensuales.map((v, i) => {
              const pct = Math.round((v.total / maxMes) * 100);
              return (
                <tr key={i} style={{ borderBottom:'0.5px solid var(--color-border)' }}>
                  <td style={{ padding:'10px 8px', fontWeight:500 }}>{v.mes}</td>
                  <td style={{ padding:'10px 8px',
                    color:   v.total > 0 ? '#CC0000' : 'var(--color-text-muted)',
                    fontWeight: v.total > 0 ? 600 : 400 }}>
                    {v.total > 0 ? formatLempiras(v.total) : '—'}
                  </td>
                  <td style={{ padding:'10px 8px', width:'50%' }}>
                    {v.total > 0 && (
                      <div style={{ height:'6px', background:'var(--gris-claro)',
                        borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`,
                          background:'#CC0000', borderRadius:'3px' }} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}