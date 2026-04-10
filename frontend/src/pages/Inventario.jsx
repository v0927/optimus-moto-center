import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { formatLempiras } from '../utils/format';

const CATEGORIAS = ['Todas', 'Filtros', 'Frenos', 'Lubricantes', 'Eléctricos', 'Accesorios'];
const ESTADOS    = ['Todos', 'Disponible', 'Bajo', 'Crítico'];

function getEstadoBadge(stock, minimo) {
  if (stock === 0)     return { clase: 'badge-critico',    texto: 'Sin stock'  };
  if (stock <= minimo) return { clase: 'badge-bajo',       texto: 'Bajo'       };
  return                      { clase: 'badge-disponible', texto: 'Disponible' };
}

function getStockColor(stock, minimo) {
  if (stock === 0)     return '#DC2626';
  if (stock <= minimo) return '#D97706';
  return '#16A34A';
}

const productoVacio = {
  sku: '', nombre: '', categoria: '', vehiculo: '',
  stock: 0, stock_minimo: 5, precio_compra: 0, precio_venta: 0,
  imagen_url: null, imagen_archivo: null,
};

const inputStyle = {
  width: '100%', padding: '8px 10px', fontSize: '13px',
  border: '0.5px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
};

const labelStyle = {
  fontSize: '11px', fontWeight: 500,
  color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block',
};

export default function Inventario() {
  const [productos,     setProductos]  = useState([]);
  const [loading,       setLoading]    = useState(true);
  const [busqueda,      setBusqueda]   = useState('');
  const [categoria,     setCategoria]  = useState('Todas');
  const [estadoFiltro,  setEstado]     = useState('Todos');
  const [pagina,        setPagina]     = useState(1);
  const [modal,         setModal]      = useState(false);
  const [editando,      setEditando]   = useState(null);
  const [form,          setForm]       = useState(productoVacio);
  const [guardando,     setGuardando]  = useState(false);
  const [confirmDelete, setConfirm]    = useState(null);
  const POR_PAGINA = 8;

  // ── Cargar productos ──────────────────────────────────────────
  useEffect(() => {
    async function cargarProductos() {
      setLoading(true);
      const { data } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: true });
      setProductos(data || []);
      setLoading(false);
    }
    cargarProductos();
  }, []);

  // ── Cargar productos ──────────────────────────────────────────
  async function recargar() {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('id', { ascending: true });
    setProductos(data || []);
  }

  async function subirImagen(archivo, sku) {
    const extension = archivo.name.split('.').pop();
    const nombre    = `${sku}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from('productos')
      .upload(nombre, archivo, { upsert: true });
    if (error) {
      alert('Error al subir la imagen');
      return null;
    }
    const { data } = supabase.storage
      .from('productos')
      .getPublicUrl(nombre);
    return data.publicUrl;
  }

  const filtrados = productos.filter(p => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(texto) ||
      p.sku.toLowerCase().includes(texto)    ||
      (p.vehiculo || '').toLowerCase().includes(texto);

    const coincideCategoria =
      categoria === 'Todas' || p.categoria === categoria;

    const badge = getEstadoBadge(p.stock, p.stock_minimo).texto;
    const coincideEstado =
      estadoFiltro === 'Todos'                                   ||
      (estadoFiltro === 'Disponible' && badge === 'Disponible')  ||
      (estadoFiltro === 'Bajo'       && badge === 'Bajo')        ||
      (estadoFiltro === 'Crítico'    && badge === 'Sin stock');

    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // ── Modal agregar ─────────────────────────────────────────────
  function abrirAgregar() {
    setEditando(null);
    setForm(productoVacio);
    setModal(true);
  }

  // ── Modal editar ──────────────────────────────────────────────
  function abrirEditar(p) {
    setEditando(p.id);
    setForm({
      sku:            p.sku,
      nombre:         p.nombre,
      categoria:      p.categoria    || '',
      vehiculo:       p.vehiculo     || '',
      stock:          p.stock,
      stock_minimo:   p.stock_minimo,
      precio_compra:  p.precio_compra,
      precio_venta:   p.precio_venta,
      imagen_url:     p.imagen_url   || null,
      imagen_archivo: null,
    });
    setModal(true);
  }

  // ── Guardar ───────────────────────────────────────────────────
  async function guardar() {
    if (!form.sku || !form.nombre) {
      alert('SKU y nombre son obligatorios');
      return;
    }
    setGuardando(true);
    let imagen_url = form.imagen_url || null;
    if (form.imagen_archivo) {
      imagen_url = await subirImagen(form.imagen_archivo, form.sku);
    }
    const datos = {
      sku:           form.sku,
      nombre:        form.nombre,
      categoria:     form.categoria,
      vehiculo:      form.vehiculo,
      stock:         parseInt(form.stock),
      stock_minimo:  parseInt(form.stock_minimo),
      precio_compra: parseFloat(form.precio_compra),
      precio_venta:  parseFloat(form.precio_venta),
      imagen_url,
    };
    if (editando) {
      await supabase.from('productos').update(datos).eq('id', editando);
    } else {
      await supabase.from('productos').insert([{ ...datos, activo: true }]);
    }
    setGuardando(false);
    setModal(false);
    recargar();
  }

    // ── Eliminar ──────────────────────────────────────────────────
  async function eliminar(id) {
    await supabase.from('productos').update({ activo: false }).eq('id', id);
    setConfirm(null);
    recargar();
  }

  // ── Cambio en formulario ──────────────────────────────────────
  function handleForm(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:'60vh', fontSize:'14px', color:'var(--color-text-muted)' }}>
        Cargando inventario...
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ padding:'24px', maxWidth:'1400px', margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:700 }}>Inventario</h1>
        <button className="btn btn-primary" onClick={abrirAgregar}>
          + Agregar Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom:'16px' }}>
        <div className="filtros-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:'10px' }}>
          <input style={inputStyle}
            placeholder="Buscar por nombre, SKU, vehículo..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }} />
          <select style={inputStyle} value={categoria}
            onChange={e => { setCategoria(e.target.value); setPagina(1); }}>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={inputStyle} value={estadoFiltro}
            onChange={e => { setEstado(e.target.value); setPagina(1); }}>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button className="btn btn-outline" onClick={() => {
            setBusqueda(''); setCategoria('Todas'); setEstado('Todos'); setPagina(1);
          }}>Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card inv-table-wrap" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr style={{ background:'var(--gris-claro)',
              borderBottom:'0.5px solid var(--color-border)' }}>
              {['Imagen','SKU','Nombre del Producto','Categoría','Vehículo Compatible',
                'Stock','Precio Compra','Precio Venta','Estado','Acciones'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'10px 12px',
                  fontSize:'11px', fontWeight:600, color:'var(--color-text-muted)',
                  whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginados.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign:'center', padding:'32px',
                  color:'var(--color-text-muted)', fontSize:'13px' }}>
                  No se encontraron productos
                </td>
              </tr>
            ) : paginados.map((p, i) => {
              const { clase, texto } = getEstadoBadge(p.stock, p.stock_minimo);
              return (
                <tr key={p.id} style={{
                  borderBottom:'0.5px solid var(--color-border)',
                  background: i % 2 === 0 ? 'white' : '#FAFAFA',
                }}>
                  <td style={{ padding:'10px 12px' }}>
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre}
                        style={{ width:'40px', height:'40px', objectFit:'cover',
                          borderRadius:'6px', border:'0.5px solid var(--color-border)' }} />
                    ) : (
                      <div style={{ width:'40px', height:'40px',
                        background:'var(--gris-claro)', borderRadius:'6px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'10px', color:'var(--color-text-muted)' }}>
                        IMG
                      </div>
                    )}
                  </td>
                  <td style={{ padding:'10px 12px', fontWeight:600, color:'#1A56DB' }}>{p.sku}</td>
                  <td style={{ padding:'10px 12px', fontWeight:500 }}>{p.nombre}</td>
                  <td style={{ padding:'10px 12px', color:'var(--color-text-muted)' }}>{p.categoria}</td>
                  <td style={{ padding:'10px 12px', color:'var(--color-text-muted)' }}>{p.vehiculo}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ fontWeight:700, fontSize:'14px',
                      color: getStockColor(p.stock, p.stock_minimo) }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px' }}>{formatLempiras(p.precio_compra)}</td>
                  <td style={{ padding:'10px 12px', fontWeight:500 }}>{formatLempiras(p.precio_venta)}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span className={`badge ${clase}`}>{texto}</span>
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button onClick={() => abrirEditar(p)}
                        style={{ background:'none', border:'none',
                          cursor:'pointer', fontSize:'16px' }}
                        title="Editar">✏️</button>
                      <button onClick={() => setConfirm(p)}
                        style={{ background:'none', border:'none',
                          cursor:'pointer', fontSize:'16px' }}
                        title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', padding:'12px 16px',
            borderTop:'0.5px solid var(--color-border)' }}>
            <span style={{ fontSize:'12px', color:'var(--color-text-muted)' }}>
              Mostrando {((pagina-1)*POR_PAGINA)+1} a {Math.min(pagina*POR_PAGINA,
              filtrados.length)} de {filtrados.length} resultados
            </span>
            <div style={{ display:'flex', gap:'6px' }}>
              <button className="btn btn-outline"
                style={{ padding:'4px 10px', fontSize:'12px' }}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}>Anterior</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPagina(n)} style={{
                  padding:'4px 10px', fontSize:'12px', borderRadius:'6px',
                  border:'0.5px solid var(--color-border)', cursor:'pointer',
                  background: n === pagina ? '#CC0000' : 'white',
                  color: n === pagina ? 'white' : 'var(--color-text)',
                  fontWeight: n === pagina ? 600 : 400,
                }}>{n}</button>
              ))}
              <button className="btn btn-outline"
                style={{ padding:'4px 10px', fontSize:'12px' }}
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL Agregar / Editar */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'white', borderRadius:'12px', padding:'24px',
            width:'560px', maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>

            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'16px', fontWeight:700 }}>
                {editando ? 'Editar Producto' : 'Agregar Producto'}
              </h2>
              <button onClick={() => setModal(false)} style={{
                background:'none', border:'none', cursor:'pointer',
                fontSize:'20px', color:'var(--color-text-muted)' }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div>
                <label style={labelStyle}>SKU *</label>
                <input style={inputStyle} value={form.sku}
                  onChange={e => handleForm('sku', e.target.value)}
                  placeholder="Ej: OF-4567" disabled={!!editando} />
              </div>
              <div>
                <label style={labelStyle}>Categoría</label>
                <select style={inputStyle} value={form.categoria}
                  onChange={e => handleForm('categoria', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {CATEGORIAS.filter(c => c !== 'Todas').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={labelStyle}>Nombre del Producto *</label>
                <input style={inputStyle} value={form.nombre}
                  onChange={e => handleForm('nombre', e.target.value)}
                  placeholder="Ej: Filtro de Aceite Premium" />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={labelStyle}>Vehículo Compatible</label>
                <input style={inputStyle} value={form.vehiculo}
                  onChange={e => handleForm('vehiculo', e.target.value)}
                  placeholder="Ej: Honda Civic 2018-2023" />
              </div>
              <div>
                <label style={labelStyle}>Stock actual</label>
                <input style={inputStyle} type="number" min="0"
                  value={form.stock}
                  onChange={e => handleForm('stock', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Stock mínimo</label>
                <input style={inputStyle} type="number" min="0"
                  value={form.stock_minimo}
                  onChange={e => handleForm('stock_minimo', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Precio de Compra (L)</label>
                <input style={inputStyle} type="number" min="0" step="0.01"
                  value={form.precio_compra}
                  onChange={e => handleForm('precio_compra', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Precio de Venta (L)</label>
                <input style={inputStyle} type="number" min="0" step="0.01"
                  value={form.precio_venta}
                  onChange={e => handleForm('precio_venta', e.target.value)} />
              </div>

              {/* Campo imagen — DENTRO del grid */}
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={labelStyle}>Imagen del producto</label>

                {form.imagen_url && !form.imagen_archivo && (
                  <div style={{ marginBottom:'8px' }}>
                    <img src={form.imagen_url} alt="preview"
                      style={{ width:'80px', height:'80px', objectFit:'cover',
                        borderRadius:'8px', border:'0.5px solid var(--color-border)' }} />
                  </div>
                )}

                {form.imagen_archivo && (
                  <div style={{ marginBottom:'8px' }}>
                    <img src={URL.createObjectURL(form.imagen_archivo)} alt="preview"
                      style={{ width:'80px', height:'80px', objectFit:'cover',
                        borderRadius:'8px', border:'0.5px solid var(--color-border)' }} />
                  </div>
                )}

                <input type="file" accept="image/*"
                  style={{ ...inputStyle, padding:'6px' }}
                  onChange={e => {
                    const archivo = e.target.files[0];
                    if (archivo) handleForm('imagen_archivo', archivo);
                  }} />
                <p style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'4px' }}>
                  Formatos: JPG, PNG, WEBP. Máximo 2MB.
                </p>
              </div>
            </div>

            <div style={{ display:'flex', gap:'10px',
              justifyContent:'flex-end', marginTop:'20px' }}>
              <button className="btn btn-outline" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Confirmar eliminación */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'white', borderRadius:'12px', padding:'24px',
            width:'400px', maxWidth:'95vw' }}>
            <h2 style={{ fontSize:'16px', fontWeight:700, marginBottom:'10px' }}>
              Eliminar producto
            </h2>
            <p style={{ fontSize:'13px', color:'var(--color-text-muted)', marginBottom:'20px' }}>
              ¿Estás seguro que deseas eliminar <strong>{confirmDelete.nombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setConfirm(null)}>
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmDelete.id)}
                style={{ background:'#DC2626', color:'white', border:'none',
                  padding:'8px 16px', borderRadius:'8px', cursor:'pointer',
                  fontSize:'13px', fontWeight:500 }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}