import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { customerService } from '@/services/api';
import type { Customer } from '@/types';
import { useToast } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function Customers() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => (await customerService.getAll()).data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const saveMut = useMutation({
    mutationFn: (data: FormValues) => editCustomer ? customerService.update(editCustomer.id, data) : customerService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); success(editCustomer ? 'Customer updated!' : 'Customer added!'); setModalOpen(false); setEditCustomer(null); reset(); },
    onError: () => toastError('Failed to save customer'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); success('Customer deleted'); setDeleteId(null); },
    onError: () => toastError('Failed to delete customer'),
  });

  const openAdd = () => { setEditCustomer(null); reset({}); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditCustomer(c); reset({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }); setModalOpen(true); };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{customers.length} customers total</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"><Plus className="w-4 h-4" />Add Customer</Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search customers…" className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableSkeleton rows={5} cols={5} /> : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5}>
                <div className="flex flex-col items-center py-16 text-slate-400">
                  <UsersIcon className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">{search ? 'No customers match your search' : 'No customers yet'}</p>
                  {!search && <Button onClick={openAdd} className="mt-4 gap-2 bg-slate-900 text-white text-sm"><Plus className="w-4 h-4" />Add Customer</Button>}
                </div>
              </TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-600">{c.name[0].toUpperCase()}</span>
                    </div>
                    <span className="font-medium text-slate-900">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{c.phone || '—'}</TableCell>
                <TableCell className="text-slate-600">{c.email || '—'}</TableCell>
                <TableCell className="text-center text-slate-700 font-medium">{c._count?.sales || 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditCustomer(null); reset(); }} title={editCustomer ? 'Edit Customer' : 'Add Customer'} size="md">
        <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <Input {...register('name')} placeholder="John Doe" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <Input {...register('phone')} placeholder="555-0100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input {...register('email')} placeholder="john@example.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <Input {...register('address')} placeholder="123 Main St" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Optional notes…" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditCustomer(null); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">{isSubmitting ? 'Saving…' : editCustomer ? 'Save Changes' : 'Add Customer'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Customer" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to delete this customer?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button onClick={() => deleteId && deleteMut.mutate(deleteId)} className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteMut.isPending}>{deleteMut.isPending ? 'Deleting…' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
