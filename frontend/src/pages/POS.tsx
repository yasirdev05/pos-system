import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Plus, Minus, Trash2, X, Package, Search, CheckCircle } from 'lucide-react';
import { productService, categoryService, customerService, saleService } from '@/services/api';
import type { Product, Category, Customer } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/toastStore';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

export default function POS() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToast();
  const cart = useCartStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-pos', search, categoryFilter],
    queryFn: async () => (await productService.getAll({ search, categoryId: categoryFilter })).data,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await categoryService.getAll()).data,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => (await customerService.getAll()).data,
  });

  const TAX_RATE = 10;
  const subtotal = cart.getSubtotal();
  const discountAmt = Math.min(discount, subtotal);
  const taxAmount = (subtotal - discountAmt) * (TAX_RATE / 100);
  const total = subtotal - discountAmt + taxAmount;
  const change = paymentMethod === 'CASH' ? parseFloat(amountPaid || '0') - total : 0;

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch)
  );

  const handleCheckout = async () => {
    if (cart.items.length === 0) return toastError('Cart is empty');
    if (paymentMethod === 'CASH' && parseFloat(amountPaid || '0') < total) return toastError('Amount paid is less than total');

    setCheckoutLoading(true);
    try {
      const res = await saleService.create({
        customerId: selectedCustomer?.id || null,
        items: cart.items.map(i => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.sellingPrice })),
        subtotal,
        taxAmount,
        discountAmount: discountAmt,
        totalAmount: total,
        paymentMethod,
        amountPaid: paymentMethod === 'CASH' ? parseFloat(amountPaid) : total,
        change: paymentMethod === 'CASH' ? change : 0,
      });
      setCompletedSale(res.data);
      cart.clearCart();
      setSelectedCustomer(null);
      setAmountPaid('');
      setDiscount(0);
      success('Sale completed! 🎉');
    } catch {
      toastError('Failed to complete sale. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-0 -m-4 md:-m-6 overflow-hidden">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-200 space-y-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name or SKU…" className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setCategoryFilter('')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>All</button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setCategoryFilter(c.id === categoryFilter ? '' : c.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === c.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>{c.name}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Package className="w-16 h-16 mb-3 opacity-20" />
              <p className="font-medium">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAdd={() => cart.addItem(p)} inCart={cart.items.find(i => i.product.id === p.id)?.quantity || 0} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-[380px] flex flex-col bg-white border-l border-slate-200 min-h-0 overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-900">Current Sale</span>
            {cart.items.length > 0 && <span className="text-xs bg-slate-900 text-white rounded-full px-2 py-0.5">{cart.items.length}</span>}
          </div>
          {cart.items.length > 0 && (
            <button onClick={() => cart.clearCart()} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">Cart is empty</p>
              <p className="text-xs mt-1 text-center">Add products from the left panel to begin a sale</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.items.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.product.sellingPrice)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-md border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                    <button onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className="w-6 h-6 rounded-md border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => cart.removeItem(item.product.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"><X className="w-3 h-3" /></button>
                  </div>
                  <div className="w-16 text-right flex-shrink-0">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(item.product.sellingPrice * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t border-slate-100 p-4 space-y-4 flex-shrink-0">
            {/* Customer */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CUSTOMER</label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-100">
                  <div>
                    <p className="text-sm font-medium text-green-800">{selectedCustomer.name}</p>
                    <p className="text-xs text-green-600">{selectedCustomer.phone}</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="relative">
                  <Input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customer or walk-in…" className="h-9 text-sm" />
                  {customerSearch && filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-36 overflow-y-auto">
                      {filteredCustomers.slice(0, 5).map(c => (
                        <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors">
                          <p className="font-medium text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>Discount ($)</span>
                <Input type="number" min="0" value={discount} onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} className="h-7 w-20 text-xs text-right" />
              </div>
              {discountAmt > 0 && <div className="flex justify-between text-red-600"><span>Discount Applied</span><span>-{formatCurrency(discountAmt)}</span></div>}
              <div className="flex justify-between text-slate-600"><span>Tax (10%)</span><span>{formatCurrency(taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">PAYMENT METHOD</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'CARD', 'TRANSFER'] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${paymentMethod === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>{m}</button>
                ))}
              </div>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-500">AMOUNT RECEIVED ($)</label>
                <Input type="number" min={total} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder={total.toFixed(2)} className="h-10 text-lg font-bold" />
                {change >= 0 && parseFloat(amountPaid) > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-green-700 bg-green-50 rounded-lg p-2.5">
                    <span>Change</span><span>{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}

            <Button onClick={handleCheckout} disabled={checkoutLoading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base gap-2">
              {checkoutLoading ? 'Processing…' : (<><CheckCircle className="w-5 h-5" />Complete Sale</>)}
            </Button>
          </div>
        )}
      </div>

      {/* Success Invoice Modal */}
      <Modal isOpen={!!completedSale} onClose={() => setCompletedSale(null)} title="Sale Completed!" size="xl">
        {completedSale && (
          <div className="p-6" id="invoice-print">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Payment Successful</p>
                <p className="text-sm text-slate-500">{formatDateTime(completedSale.createdAt)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-500">Invoice</p>
                <p className="font-mono font-bold text-slate-900">{completedSale.invoiceNumber}</p>
              </div>
            </div>

            <div className="mb-4 flex justify-between text-sm">
              <div><p className="text-slate-500">Customer</p><p className="font-medium text-slate-900">{completedSale.customer?.name || 'Walk-in Customer'}</p></div>
              <div className="text-right"><p className="text-slate-500">Cashier</p><p className="font-medium text-slate-900">{user?.name}</p></div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead><tr className="border-b border-slate-100"><th className="text-left py-2 text-slate-500 font-medium">Item</th><th className="text-right py-2 text-slate-500 font-medium">Qty</th><th className="text-right py-2 text-slate-500 font-medium">Price</th><th className="text-right py-2 text-slate-500 font-medium">Total</th></tr></thead>
              <tbody>{completedSale.items?.map((item: any) => (<tr key={item.id} className="border-b border-slate-50"><td className="py-2 text-slate-800">{item.product?.name}</td><td className="py-2 text-right text-slate-600">{item.quantity}</td><td className="py-2 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td><td className="py-2 text-right font-medium text-slate-900">{formatCurrency(item.total)}</td></tr>))}</tbody>
            </table>

            <div className="flex justify-end mb-6">
              <div className="w-48 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(completedSale.subtotal)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Tax (10%)</span><span>{formatCurrency(completedSale.taxAmount)}</span></div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span>{formatCurrency(completedSale.totalAmount)}</span></div>
                <div className="flex justify-between text-slate-600 text-xs"><span>Paid ({completedSale.paymentMethod})</span><span>{formatCurrency(completedSale.amountPaid)}</span></div>
                {completedSale.change > 0 && <div className="flex justify-between text-green-700 font-medium text-xs"><span>Change</span><span>{formatCurrency(completedSale.change)}</span></div>}
              </div>
            </div>

            <div className="text-center text-sm text-slate-400 border-t border-slate-100 pt-4 mb-4">
              <p>Thank you for shopping at TechMart Pro!</p>
              <p className="text-xs mt-1">Returns accepted within 30 days with receipt.</p>
            </div>

            <div className="flex gap-3 justify-end no-print">
              <Button variant="outline" onClick={() => window.print()}>Print Invoice</Button>
              <Button onClick={() => setCompletedSale(null)} className="bg-slate-900 text-white hover:bg-slate-800">New Sale</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProductCard({ product, onAdd, inCart }: { product: Product; onAdd: () => void; inCart: number }) {
  const outOfStock = product.stock === 0;
  return (
    <div className={`bg-white rounded-xl border p-3 flex flex-col gap-2 transition-all hover:shadow-md ${outOfStock ? 'opacity-60' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="w-full h-28 rounded-lg bg-slate-100 border border-slate-100 flex items-center justify-center overflow-hidden relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              (e.target as HTMLElement).parentElement?.querySelector('.pos-fallback-icon')?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Package className={`w-8 h-8 text-slate-300 pos-fallback-icon ${product.imageUrl ? 'hidden' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate" title={product.name}>{product.name}</p>
        <p className="text-[10px] text-slate-400 font-mono">{product.sku}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-base font-bold text-slate-900">{formatCurrency(product.sellingPrice)}</span>
          <Badge variant={outOfStock ? 'danger' : product.stock <= product.minStock ? 'warning' : 'success'} className="text-[10px]">{outOfStock ? 'Out' : `${product.stock} left`}</Badge>
        </div>
      </div>
      <button
        onClick={onAdd}
        disabled={outOfStock}
        className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${inCart > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'} disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed`}
      >
        {outOfStock ? 'Out of Stock' : inCart > 0 ? `In Cart (${inCart})` : 'Add to Cart'}
      </button>
    </div>
  );
}
