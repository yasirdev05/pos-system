import { useState } from 'react';
import { Save, Store, Receipt, Bell, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/store/toastStore';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'receipt' | 'notifications' | 'security'>('general');
  const { addToast } = useToast();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      companyName: 'Foji Kiryana Store',
      ownerName: 'Qaiser Abbas',
      phone: '0307-8838980',
      email: 'qabbas5658@gmail.com',
      address: '24 np sadiqabad JDW road',
      taxPercentage: 0, 
      currency: 'PKR',
      invoicePrefix: 'TMP-',
    }
  });

  const onSubmit = (_data: any) => {
    // In a real app, this would call settingsService.update(data)
    setTimeout(() => {
      addToast('Settings saved successfully', 'success');
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500">Manage your business preferences and system configurations</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'general' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Store className="w-5 h-5" />
            General Details
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'receipt' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-5 h-5" />
            Billing & Receipts
          </button>
          {/* <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-5 h-5" />
            Notifications
          </button> */}
          {/* <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-5 h-5" />
            Security & Access
          </button> */}
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit(onSubmit)}>
            {activeTab === 'general' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Business Details</h2>
                  <p className="text-sm text-slate-500">This information will be displayed on receipts and reports.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Company Name" {...register('companyName')} />
                  <Input label="Owner / Manager Name" {...register('ownerName')} />
                  <Input label="Phone Number" {...register('phone')} />
                  <Input label="Email Address" type="email" {...register('email')} />
                  <div className="md:col-span-2">
                    <Input label="Physical Address" {...register('address')} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'receipt' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Billing & Receipts</h2>
                  <p className="text-sm text-slate-500">Configure how taxes and invoice numbers are generated.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Default Tax Percentage (%)" type="number" {...register('taxPercentage')} />
                  <Input label="Currency" {...register('currency')} />
                  <Input label="Invoice Prefix" {...register('invoicePrefix')} />
                </div>
              </div>
            )}

            {(activeTab === 'notifications' || activeTab === 'security') && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  {activeTab === 'notifications' ? <Bell className="w-8 h-8 text-slate-400" /> : <Shield className="w-8 h-8 text-slate-400" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Coming Soon</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  This settings module is currently under development. Advanced configurations will be available in the next release.
                </p>
              </div>
            )}

            {/* Form Actions */}
            {(activeTab === 'general' || activeTab === 'receipt') && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
                <Button type="button" variant="outline">Discard Changes</Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
