import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { formatLempiras } from '../utils/format';
import { useWindowSize } from '../useWindowSize';

const IVA = 0.15;

function getEstadoBadge(stock, minimo) {
  if (stock === 0)     return { clase: 'badge-critico',    texto: 'Sin stock'  };
  if (stock <= minimo) return { clase: 'badge-bajo',       texto: 'Bajo'       };
  return                      { clase: 'badge-disponible', texto: 'Disponible' };
}

export default function POS() {
  const [productos,   setProductos]  = useState([]);
  const [busqueda,    setBusqueda]   = useState('');
  const [carrito,     setCarrito]    = useState([]);
  const [metodoPago,  setMetodoPago] = useState('Efectivo');
  const [loading,     setLoading]    = useState(true);
  const [confirmando, setConfirmando]= useState(false);
  const [exitoVenta,  setExitoVenta] = useState(null);

  const { isMobile, isTablet } = useWindowSize();
  const esMovil = isMobile || isTablet;

  useEffect(() => {
    async function cargarProductos() {
      setLoading(true);
      const { data } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      setProductos(data || []);
      setLoading(false);
    }
    cargarProductos();
  }, []);

  async function recargarProductos() {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });
    setProductos(data || []);
  }

  const productosFiltrados = productos.filter(p => {
    const texto = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(texto)             ||
      p.sku.toLowerCase().includes(texto)                ||
      (p.categoria || '').toLowerCase().includes(texto)
    );
  });

  function agregarAlCarrito(producto) {
    if (producto.stock === 0) return;
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stock) return prev;
        return prev.map(i =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id, delta) {
    setCarrito(prev =>
      prev
        .map(i => {
          if (i.id !== id) return i;
          const nueva = i.cantidad + delta;
          if (nueva <= 0)      return null;
          if (nueva > i.stock) return i;
          return { ...i, cantidad: nueva };
        })
        .filter(Boolean)
    );
  }

  function quitarDelCarrito(id) {
    setCarrito(prev => prev.filter(i => i.id !== id));
  }

  const subtotal = carrito.reduce((sum, i) => sum + i.precio_venta * i.cantidad, 0);
  const iva      = subtotal * IVA;
  const total    = subtotal + iva;

  async function confirmarVenta() {
    if (carrito.length === 0) return;
    setConfirmando(true);
    try {
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert([{
          subtotal:    parseFloat(subtotal.toFixed(2)),
          iva:         parseFloat(iva.toFixed(2)),
          total:       parseFloat(total.toFixed(2)),
          metodo_pago: metodoPago,
          estado:      'Completado',
        }])
        .select()
        .single();
      if (ventaError) throw ventaError;

      const items = carrito.map(i => ({
        venta_id:    ventaData.id,
        producto_id: i.id,
        cantidad:    i.cantidad,
        precio:      i.precio_venta,
        subtotal:    parseFloat((i.precio_venta * i.cantidad).toFixed(2)),
      }));
      const { error: itemsError } = await supabase.from('venta_items').insert(items);
      if (itemsError) throw itemsError;

      for (const item of carrito) {
        await supabase
          .from('productos')
          .update({ stock: item.stock - item.cantidad })
          .eq('id', item.id);
      }

      setExitoVenta({ id: ventaData.id, total, metodoPago, items: carrito });
      setCarrito([]);
      setMetodoPago('Efectivo');
      recargarProductos();
    } catch (error) {
      alert('Error al procesar la venta. Intenta de nuevo.');
      console.error(error);
    }
    setConfirmando(false);
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '13px',
    border: '0.5px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'60vh', fontSize:'14px', color:'var(--color-text-muted)' }}>
      Cargando productos...
    </div>
  );

  return (
    <div style={{ padding: esMovil ? '16px' : '24px',
      maxWidth:'1400px', margin:'0 auto' }}>
      <h1 style={{ fontSize: esMovil ? '18px' : '22px',
        fontWeight:700, marginBottom:'20px' }}>
        Punto de Venta
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: esMovil ? '1fr' : '1fr 380px',
        gap: '20px', alignItems: 'start',
      }}>

        {/* Productos */}
        <div>
          <input
            style={{ ...inputStyle, marginBottom:'16px' }}
            placeholder="Buscar productos por nombre, SKU o categoría..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3,1fr)' : 'repeat(3,1fr)',
            gap: '12px',
          }}>
            {productosFiltrados.map(p => {
              const { clase, texto } = getEstadoBadge(p.stock, p.stock_minimo);
              const enCarrito = carrito.find(i => i.id === p.id);
              const sinStock  = p.stock === 0;

              return (
                <div key={p.id} onClick={() => agregarAlCarrito(p)}
                  className="card"
                  style={{
                    cursor:      sinStock ? 'not-allowed' : 'pointer',
                    opacity:     sinStock ? 0.5 : 1,
                    transition:  'all .15s', padding: '12px',
                    borderColor: enCarrito ? '#CC0000' : 'var(--color-border)',
                    borderWidth: enCarrito ? '1.5px' : '0.5px',
                  }}>
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre}
                      style={{ width:'100%', height: isMobile ? '80px' : '120px',
                        objectFit:'cover', borderRadius:'8px', marginBottom:'10px',
                        border:'0.5px solid var(--color-border)' }} />
                  ) : (
                    <div style={{ width:'100%', height: isMobile ? '80px' : '120px',
                      background:'var(--gris-claro)', borderRadius:'8px',
                      marginBottom:'10px', display:'flex', alignItems:'center',
                      justifyContent:'center', color:'var(--color-text-muted)',
                      fontSize:'11px' }}>Sin imagen</div>
                  )}
                  <div style={{ fontSize:'11px', color:'var(--color-text-muted)',
                    marginBottom:'2px' }}>{p.sku}</div>
                  <div style={{ fontSize: isMobile ? '12px' : '13px',
                    fontWeight:600, marginBottom:'6px', lineHeight:1.3 }}>
                    {p.nombre}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:'6px', flexWrap:'wrap', gap:'4px' }}>
                    <span style={{ fontSize: isMobile ? '13px' : '15px',
                      fontWeight:700, color:'#CC0000' }}>
                      {formatLempiras(p.precio_venta)}
                    </span>
                    <span className={`badge ${clase}`}>{texto}</span>
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-text-muted)',
                    marginBottom:'8px' }}>Stock: {p.stock}</div>
                  <button disabled={sinStock} style={{
                    width:'100%', padding: isMobile ? '6px' : '7px',
                    fontSize:'12px', fontWeight:500, borderRadius:'6px',
                    border:'none', cursor: sinStock ? 'not-allowed' : 'pointer',
                    background: enCarrito ? '#CC0000' : '#1A56DB',
                    color: 'white', transition:'all .15s',
                  }}>
                    {sinStock ? 'Sin stock' : enCarrito
                      ? `En carrito (${enCarrito.cantidad})` : 'Agregar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrito */}
        <div className="card"
          style={{ position: esMovil ? 'static' : 'sticky', top:'76px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:700, marginBottom:'16px' }}>
            Resumen del Pedido
          </h2>

          {carrito.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0',
              color:'var(--color-text-muted)', fontSize:'13px' }}>
              <div style={{ fontSize:'32px', marginBottom:'8px' }}>🛒</div>
              Carrito vacío
              <div style={{ fontSize:'12px', marginTop:'4px' }}>
                Agrega productos para iniciar una venta
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px',
              marginBottom:'16px', maxHeight:'320px', overflowY:'auto' }}>
              {carrito.map(item => (
                <div key={item.id} style={{ background:'var(--gris-claro)',
                  borderRadius:'8px', padding:'10px' }}>
                  <div style={{ display:'flex', gap:'8px',
                    alignItems:'flex-start', marginBottom:'6px' }}>
                    {item.imagen_url ? (
                      <img src={item.imagen_url} alt={item.nombre}
                        style={{ width:'36px', height:'36px', objectFit:'cover',
                          borderRadius:'6px', flexShrink:0,
                          border:'0.5px solid var(--color-border)' }} />
                    ) : (
                      <div style={{ width:'36px', height:'36px', flexShrink:0,
                        background:'white', borderRadius:'6px', display:'flex',
                        alignItems:'center', justifyContent:'center',
                        fontSize:'9px', color:'var(--color-text-muted)',
                        border:'0.5px solid var(--color-border)' }}>IMG</div>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'12px', fontWeight:500, lineHeight:1.3,
                        marginBottom:'2px', overflow:'hidden',
                        textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.nombre}
                      </div>
                      <div style={{ fontSize:'11px', color:'var(--color-text-muted)' }}>
                        {formatLempiras(item.precio_venta)} c/u
                      </div>
                    </div>
                    <button onClick={() => quitarDelCarrito(item.id)}
                      style={{ background:'none', border:'none', cursor:'pointer',
                        color:'var(--color-text-muted)', fontSize:'14px',
                        padding:'0', lineHeight:1, flexShrink:0 }}>✕</button>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <button onClick={() => cambiarCantidad(item.id, -1)}
                        style={{ width:'24px', height:'24px', borderRadius:'4px',
                          border:'0.5px solid var(--color-border)', background:'white',
                          cursor:'pointer', fontSize:'14px', fontWeight:700,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                        −
                      </button>
                      <span style={{ fontSize:'13px', fontWeight:600,
                        minWidth:'20px', textAlign:'center' }}>{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.id, 1)}
                        style={{ width:'24px', height:'24px', borderRadius:'4px',
                          border:'0.5px solid var(--color-border)', background:'white',
                          cursor:'pointer', fontSize:'14px', fontWeight:700,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                        +
                      </button>
                    </div>
                    <span style={{ fontSize:'13px', fontWeight:600 }}>
                      {formatLempiras(item.precio_venta * item.cantidad)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop:'0.5px solid var(--color-border)', paddingTop:'12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              fontSize:'13px', color:'var(--color-text-muted)', marginBottom:'6px' }}>
              <span>Subtotal</span><span>{formatLempiras(subtotal)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between',
              fontSize:'13px', color:'var(--color-text-muted)', marginBottom:'10px' }}>
              <span>IVA (15%)</span><span>{formatLempiras(iva)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between',
              fontSize:'17px', fontWeight:700, marginBottom:'16px' }}>
              <span>Total</span>
              <span style={{ color:'#CC0000' }}>{formatLempiras(total)}</span>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'12px', fontWeight:500,
                color:'var(--color-text-muted)', display:'block', marginBottom:'6px' }}>
                Método de Pago
              </label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px' }}>
                {['Efectivo','Tarjeta','Crédito'].map(m => (
                  <button key={m} onClick={() => setMetodoPago(m)} style={{
                    padding:'7px', fontSize:'12px', fontWeight:500,
                    borderRadius:'6px', cursor:'pointer', transition:'all .15s',
                    border:     metodoPago === m ? '2px solid #CC0000' : '0.5px solid var(--color-border)',
                    background: metodoPago === m ? '#FEF2F2' : 'white',
                    color:      metodoPago === m ? '#CC0000' : 'var(--color-text)',
                  }}>{m}</button>
                ))}
              </div>
            </div>

            <button onClick={confirmarVenta}
              disabled={carrito.length === 0 || confirmando}
              style={{
                width:'100%', padding:'10px', fontSize:'14px', fontWeight:600,
                borderRadius:'8px', border:'none',
                cursor:     carrito.length === 0 ? 'not-allowed' : 'pointer',
                background: carrito.length === 0 ? '#CBD5E0' : '#16A34A',
                color:'white', marginBottom:'8px', transition:'all .15s',
              }}>
              {confirmando ? 'Procesando...' : 'Confirmar Venta'}
            </button>
            <button onClick={() => setCarrito([])}
              disabled={carrito.length === 0}
              style={{
                width:'100%', padding:'10px', fontSize:'13px', fontWeight:500,
                borderRadius:'8px', border:'0.5px solid var(--color-border)',
                cursor:     carrito.length === 0 ? 'not-allowed' : 'pointer',
                background: 'white', color:'var(--color-text)',
              }}>
              Nueva Cotización
            </button>
          </div>
        </div>
      </div>

      {/* Modal éxito */}
      {exitoVenta && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'white', borderRadius:'12px', padding:'28px',
            width: esMovil ? '95vw' : '420px', maxWidth:'95vw', textAlign:'center' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>✅</div>
            <h2 style={{ fontSize:'18px', fontWeight:700, marginBottom:'6px' }}>
              ¡Venta completada!
            </h2>
            <p style={{ fontSize:'13px', color:'var(--color-text-muted)', marginBottom:'16px' }}>
              Venta #{exitoVenta.id} · {exitoVenta.metodoPago}
            </p>
            <div style={{ background:'var(--gris-claro)', borderRadius:'8px',
              padding:'14px', marginBottom:'20px', textAlign:'left' }}>
              {exitoVenta.items.map(i => (
                <div key={i.id} style={{ display:'flex', alignItems:'center',
                  gap:'10px', marginBottom:'8px' }}>
                  {i.imagen_url ? (
                    <img src={i.imagen_url} alt={i.nombre}
                      style={{ width:'32px', height:'32px', objectFit:'cover',
                        borderRadius:'4px', flexShrink:0 }} />
                  ) : (
                    <div style={{ width:'32px', height:'32px', flexShrink:0,
                      background:'white', borderRadius:'4px', display:'flex',
                      alignItems:'center', justifyContent:'center',
                      fontSize:'9px', color:'var(--color-text-muted)' }}>IMG</div>
                  )}
                  <span style={{ flex:1, fontSize:'13px' }}>
                    {i.cantidad}x {i.nombre}
                  </span>
                  <span style={{ fontSize:'13px', fontWeight:500 }}>
                    {formatLempiras(i.precio_venta * i.cantidad)}
                  </span>
                </div>
              ))}
              <div style={{ borderTop:'0.5px solid var(--color-border)',
                paddingTop:'8px', marginTop:'4px', display:'flex',
                justifyContent:'space-between', fontWeight:700, fontSize:'15px' }}>
                <span>Total</span>
                <span style={{ color:'#CC0000' }}>{formatLempiras(exitoVenta.total)}</span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width:'100%' }}
              onClick={() => setExitoVenta(null)}>
              Nueva venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}