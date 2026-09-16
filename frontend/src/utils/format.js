// Formatea cualquier número a Lempiras hondureños
export const formatLempiras = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// IVA Honduras = 7%
export const IVA = 0.07;

export const calcularIVA = (subtotal) => subtotal * IVA;

export const calcularTotal = (subtotal) => subtotal * (1 + IVA);

// Formatea fecha a español Honduras
export const formatFecha = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};