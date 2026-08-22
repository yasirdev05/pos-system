export const formatCurrency = (amount: number, currency = 'PKR') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));

export const formatDateTime = (date: string | Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));

export const getStockStatus = (stock: number, minStock: number): 'in-stock' | 'low-stock' | 'out-of-stock' => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= minStock) return 'low-stock';
  return 'in-stock';
};

export const getStockLabel = (stock: number, minStock: number): string => {
  const status = getStockStatus(stock, minStock);
  if (status === 'out-of-stock') return 'Out of Stock';
  if (status === 'low-stock') return 'Low Stock';
  return 'In Stock';
};
