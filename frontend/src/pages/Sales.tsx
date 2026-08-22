import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Receipt } from 'lucide-react';
import { saleService } from '@/services/api';
import type { Sale } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { BadgeVariant } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';

export default function Sales() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['sales', search, startDate, endDate, paymentFilter],
    queryFn: async () => (await saleService.getAll({ search, startDate, endDate, paymentMethod: paymentFilter })).data,
  });

  const pmBadge: Record<string, BadgeVariant> = { CASH: 'success', CARD: 'info', TRANSFER: 'default' };

  const paginated = sales.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(sales.length / PER_PAGE);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
        <p className="text-sm text-slate-500">{sales.length} transactions total</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search invoices…" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Input type="date" className="h-9 w-auto" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input type="date" className="h-9 w-auto" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">All Payments</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Payment</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableSkeleton rows={5} cols={8} /> : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={8}>
                <div className="flex flex-col items-center py-16 text-slate-400">
                  <Receipt className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No sales found</p>
                </div>
              </TableCell></TableRow>
            ) : paginated.map(s => (
              <TableRow key={s.id} className="hover:bg-slate-50">
                <TableCell className="font-mono text-xs font-medium text-slate-700">{s.invoiceNumber}</TableCell>
                <TableCell className="text-slate-700">{s.customer?.name || <span className="text-slate-400">Walk-in</span>}</TableCell>
                <TableCell className="text-slate-600">{s.user?.name || '—'}</TableCell>
                <TableCell className="text-slate-500 text-sm">{formatDateTime(s.createdAt)}</TableCell>
                <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(s.totalAmount)}</TableCell>
                <TableCell className="text-center"><Badge variant={pmBadge[s.paymentMethod] || 'default'}>{s.paymentMethod}</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="success">{s.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <button onClick={() => setViewSale(s)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"><Eye className="w-4 h-4" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice View Modal */}
      <Modal isOpen={!!viewSale} onClose={() => setViewSale(null)} title={`Invoice ${viewSale?.invoiceNumber}`} size="xl">
        {viewSale && (
          <div className="p-6" id="invoice-print">
            <div className="flex justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">TechMart Pro</h2>
                <p className="text-sm text-slate-500">123 Commerce St, Business City</p>
                <p className="text-sm text-slate-500">info@techmartpro.com</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Invoice #{viewSale.invoiceNumber}</p>
                <p className="text-sm text-slate-500">{formatDateTime(viewSale.createdAt)}</p>
                <p className="text-sm text-slate-500">Cashier: {viewSale.user?.name}</p>
              </div>
            </div>
            {viewSale.customer && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700">Bill To: {viewSale.customer.name}</p>
                {viewSale.customer.phone && <p className="text-sm text-slate-500">{viewSale.customer.phone}</p>}
              </div>
            )}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-600 font-medium">Item</th>
                  <th className="text-right py-2 text-slate-600 font-medium">Qty</th>
                  <th className="text-right py-2 text-slate-600 font-medium">Price</th>
                  <th className="text-right py-2 text-slate-600 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewSale.items.map(item => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-800">{item.product?.name}</td>
                    <td className="py-2.5 text-right text-slate-600">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 text-right font-medium text-slate-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-56 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(viewSale.subtotal)}</span></div>
                {viewSale.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-{formatCurrency(viewSale.discountAmount)}</span></div>}
                <div className="flex justify-between text-slate-600"><span>Tax (10%)</span><span>{formatCurrency(viewSale.taxAmount)}</span></div>
                <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span>{formatCurrency(viewSale.totalAmount)}</span></div>
                <div className="flex justify-between text-slate-600 text-xs pt-1"><span>Payment</span><span>{viewSale.paymentMethod}</span></div>
                {viewSale.change > 0 && <div className="flex justify-between text-slate-600 text-xs"><span>Change</span><span>{formatCurrency(viewSale.change)}</span></div>}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100 no-print">
              <Button variant="outline" onClick={() => window.print()}>Print Invoice</Button>
              <Button variant="outline" onClick={() => setViewSale(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
