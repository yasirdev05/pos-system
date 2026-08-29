import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArchiveRestore, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { inventoryService } from '@/services/api';
import type { Product } from '@/types';
import { formatCurrency, getStockStatus } from '@/utils/formatters';
import { useToast } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';

const adjustSchema = z.object({
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  quantity: z.coerce.number().int().positive('Must be > 0'),
  reason: z.string().min(1, 'Reason required'),
});
type AdjustValues = z.infer<typeof adjustSchema>;

const REASONS = ['Damaged', 'Lost', 'Manual Correction', 'Returned', 'Purchase'];

export default function Inventory() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['inventory'],
    queryFn: async () => (await inventoryService.getAll()).data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: 'ADD', reason: 'Manual Correction' },
  });

  const adjustMut = useMutation({
    mutationFn: (data: AdjustValues) => inventoryService.adjustStock({ productId: adjustProduct!.id, ...data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); success('Stock adjusted!'); setAdjustProduct(null); reset(); },
    onError: () => toastError('Failed to adjust stock'),
  });

  const inStock = products.filter(p => p.stock > p.minStock).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500">Monitor and manage your stock levels</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, color: 'text-slate-900' },
          { label: 'In Stock', value: inStock, color: 'text-green-600' },
          { label: 'Low Stock', value: lowStock, color: 'text-amber-600' },
          { label: 'Out of Stock', value: outOfStock, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Min Stock</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableSkeleton rows={6} cols={8} /> : products.length === 0 ? (
              <TableRow><TableCell colSpan={8}>
                <div className="flex flex-col items-center py-16 text-slate-400">
                  <ArchiveRestore className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No inventory data</p>
                </div>
              </TableCell></TableRow>
            ) : products.map(p => {
              const status = getStockStatus(p.stock, p.minStock);
              const statusVariant = status === 'out-of-stock' ? 'danger' : status === 'low-stock' ? 'warning' : 'success';
              const statusLabel = status === 'out-of-stock' ? 'Out of Stock' : status === 'low-stock' ? 'Low Stock' : 'In Stock';
              return (
                <TableRow key={p.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              (e.target as HTMLElement).parentElement?.querySelector('.inv-fallback-icon')?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Package className={`w-4 h-4 text-slate-400 inv-fallback-icon ${p.imageUrl ? 'hidden' : ''}`} />
                      </div>
                      <span className="font-medium text-slate-900">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{p.sku}</TableCell>
                  <TableCell><Badge variant="default">{p.category?.name}</Badge></TableCell>
                  <TableCell className="text-center font-semibold text-slate-800">{p.stock}</TableCell>
                  <TableCell className="text-center text-slate-500">{p.minStock}</TableCell>
                  <TableCell className="text-center"><Badge variant={statusVariant}>{statusLabel}</Badge></TableCell>
                  <TableCell className="text-right text-slate-700">{formatCurrency(p.stock * p.purchasePrice)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => { setAdjustProduct(p); reset({ type: 'ADD', reason: 'Manual Correction' }); }}>Adjust</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Adjust Stock Modal */}
      <Modal isOpen={!!adjustProduct} onClose={() => { setAdjustProduct(null); reset(); }} title="Adjust Stock" size="sm">
        {adjustProduct && (
          <form onSubmit={handleSubmit(d => adjustMut.mutate(d))} className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-800">{adjustProduct.name}</p>
              <p className="text-xs text-slate-500">Current stock: <strong>{adjustProduct.stock}</strong> units</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Type</label>
              <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="ADD">Add Stock</option>
                <option value="REMOVE">Remove Stock</option>
                <option value="SET">Set Quantity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
              <Input type="number" min="1" {...register('quantity')} placeholder="0" />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
              <select {...register('reason')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => { setAdjustProduct(null); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">{isSubmitting ? 'Saving…' : 'Apply Adjustment'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
