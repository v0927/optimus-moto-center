// Formatea cualquier número a Lempiras hondureños
export const formatLempiras = (amount) => {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2,
  }).format(amount);
};

// IVA Honduras = 15%
export const IVA = 0.15;

export const calcularIVA = (subtotal) => subtotal * IVA;

export const calcularTotal = (subtotal) => subtotal * (1 + IVA);

// Formatea fecha a español Honduras
export const formatFecha = (date) => {
  return new Intl.DateTimeFormat('es-HN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};