import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { productService, categoryService } from '@/services/api';
import type { Product, Category } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  sku: z.string().min(1, 'SKU required'),
  categoryId: z.string().min(1, 'Category required'),
  purchasePrice: z.coerce.number().positive('Must be positive'),
  sellingPrice: z.coerce.number().positive('Must be positive'),
  stock: z.coerce.number().int().min(0, 'Cannot be negative'),
  minStock: z.coerce.number().int().min(0),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Products() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const debounce = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as any).__debounce);
    (window as any).__debounce = setTimeout(() => setDebouncedSearch(val), 400);
  }, []);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', debouncedSearch],
    queryFn: async () => (await productService.getAll({ search: debouncedSearch })).data,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await categoryService.getAll()).data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editProduct || {},
  });

  const createMut = useMutation({
    mutationFn: (data: FormValues) => editProduct ? productService.update(editProduct.id, data) : productService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      success(editProduct ? 'Product updated!' : 'Product added!');
      setModalOpen(false); setEditProduct(null); reset();
    },
    onError: () => toastError('Failed to save product'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); success('Product deleted'); setDeleteId(null); },
    onError: () => toastError('Failed to delete product'),
  });

  const openAdd = () => { setEditProduct(null); reset({}); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditProduct(p); reset({ name: p.name, sku: p.sku, categoryId: p.categoryId, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, stock: p.stock, minStock: p.minStock, description: p.description || '' }); setModalOpen(true); };

  const paginated = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(products.length / PER_PAGE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{products.length} products total</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search products…" className="pl-9 h-9" value={search} onChange={(e) => debounce(e.target.value)} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Buy Price</TableHead>
              <TableHead className="text-right">Sell Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableSkeleton rows={5} cols={7} /> : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <Package className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-medium">No products found</p>
                    <p className="text-sm mt-1">Add your first product to get started</p>
                    <Button onClick={openAdd} className="mt-4 gap-2 bg-slate-900 text-white text-sm"><Plus className="w-4 h-4" />Add Product</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginated.map((p) => {
              const stockBadge = p.stock === 0 ? 'danger' : p.stock <= p.minStock ? 'warning' : 'success';
              return (
                <TableRow key={p.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="font-medium text-slate-900">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">{p.sku}</TableCell>
                  <TableCell><Badge variant="default">{p.category?.name}</Badge></TableCell>
                  <TableCell className="text-right text-slate-600">{formatCurrency(p.purchasePrice)}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(p.sellingPrice)}</TableCell>
                  <TableCell className="text-center"><Badge variant={stockBadge}>{p.stock}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditProduct(null); reset(); }} title={editProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit((data) => createMut.mutate(data))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <Input {...register('name')} placeholder="e.g. iPhone 16 Pro" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
              <Input {...register('sku')} placeholder="e.g. IP16-001" />
              {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select {...register('categoryId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price *</label>
              <Input type="number" step="0.01" {...register('purchasePrice')} placeholder="0.00" />
              {errors.purchasePrice && <p className="text-xs text-red-500 mt-1">{errors.purchasePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price *</label>
              <Input type="number" step="0.01" {...register('sellingPrice')} placeholder="0.00" />
              {errors.sellingPrice && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock *</label>
              <Input type="number" {...register('stock')} placeholder="0" />
              {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock *</label>
              <Input type="number" {...register('minStock')} placeholder="5" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea {...register('description')} rows={2} placeholder="Optional product description..." className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditProduct(null); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
              {isSubmitting ? 'Saving…' : editProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to delete this product? This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button onClick={() => deleteId && deleteMut.mutate(deleteId)} className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
