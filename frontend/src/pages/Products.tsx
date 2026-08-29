import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, Upload, Link, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { productService, categoryService, uploadService } from '@/services/api';
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
  imageUrl: z.string().optional(),
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
  const [uploading, setUploading] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [previewImage, setPreviewImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editProduct || {},
  });

  const currentImageUrl = watch('imageUrl');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadService.uploadImage(file);
      const url = res.data.imageUrl;
      setValue('imageUrl', url);
      setPreviewImage(url);
      success('Image uploaded successfully!');
    } catch (err: any) {
      console.error('Upload failed:', err);
      toastError(err.response?.data?.error || 'Failed to upload image. You can also paste an image URL directly.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setValue('imageUrl', '');
    setPreviewImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createMut = useMutation({
    mutationFn: (data: FormValues) => editProduct ? productService.update(editProduct.id, data) : productService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      success(editProduct ? 'Product updated!' : 'Product added!');
      setModalOpen(false);
      setEditProduct(null);
      setPreviewImage('');
      reset();
    },
    onError: () => toastError('Failed to save product'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      success('Product deleted');
      setDeleteId(null);
    },
    onError: () => toastError('Failed to delete product'),
  });

  const openAdd = () => {
    setEditProduct(null);
    setPreviewImage('');
    reset({});
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setPreviewImage(p.imageUrl || '');
    reset({
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      stock: p.stock,
      minStock: p.minStock,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
    });
    setModalOpen(true);
  };

  const paginated = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(products.length / PER_PAGE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{products.length} products in inventory</p>
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
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              (e.target as HTMLElement).parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Package className={`w-5 h-5 text-slate-400 fallback-icon ${p.imageUrl ? 'hidden' : ''}`} />
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 block">{p.name}</span>
                        {p.description && <span className="text-xs text-slate-400 line-clamp-1">{p.description}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">{p.sku}</TableCell>
                  <TableCell><Badge variant="default">{p.category?.name || 'Uncategorized'}</Badge></TableCell>
                  <TableCell className="text-right text-slate-600">{formatCurrency(p.purchasePrice)}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(p.sellingPrice)}</TableCell>
                  <TableCell className="text-center"><Badge variant={stockBadge}>{p.stock}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" title="Edit Product"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Product"><Trash2 className="w-4 h-4" /></button>
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
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditProduct(null); setPreviewImage(''); reset(); }} title={editProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit((data) => createMut.mutate(data))} className="p-6 space-y-4">
          
          {/* Image Upload & Preview Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Product Image</label>
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${imageTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${imageTab === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Link className="w-3.5 h-3.5" /> Image URL
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Image Preview Box */}
              <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden group">
                {(previewImage || currentImageUrl) ? (
                  <>
                    <img
                      src={previewImage || currentImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        toastError('Image could not be loaded from this URL');
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 shadow transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                    <span className="text-[10px]">No image</span>
                  </div>
                )}
              </div>

              {/* Upload or URL Controls */}
              <div className="flex-1 w-full">
                {imageTab === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className={`w-full flex flex-col items-center justify-center border border-slate-300 border-dashed rounded-lg p-3.5 cursor-pointer bg-white hover:bg-slate-50 hover:border-slate-400 transition-all text-center ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {uploading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Uploading image…
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-700">Click to choose image file</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP, GIF up to 5MB</span>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <div>
                    <Input
                      placeholder="https://images.unsplash.com/... or /uploads/..."
                      {...register('imageUrl')}
                      onChange={(e) => {
                        setValue('imageUrl', e.target.value);
                        setPreviewImage(e.target.value);
                      }}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Paste any direct web image link or CDN URL.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <Input {...register('name')} placeholder="e.g. iPhone 16 Pro Max" />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price ($) *</label>
              <Input type="number" step="0.01" {...register('purchasePrice')} placeholder="0.00" />
              {errors.purchasePrice && <p className="text-xs text-red-500 mt-1">{errors.purchasePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price ($) *</label>
              <Input type="number" step="0.01" {...register('sellingPrice')} placeholder="0.00" />
              {errors.sellingPrice && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock *</label>
              <Input type="number" {...register('stock')} placeholder="0" />
              {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock Alert *</label>
              <Input type="number" {...register('minStock')} placeholder="5" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea {...register('description')} rows={2} placeholder="Optional product description..." className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditProduct(null); setPreviewImage(''); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || uploading} className="bg-slate-900 text-white hover:bg-slate-800">
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
