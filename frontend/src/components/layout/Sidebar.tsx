import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MonitorPlay, Package, ArchiveRestore, Tag,
  Users, Truck, Receipt, ShoppingCart, CreditCard, BarChart3,
  UserCog, Settings, LogOut, X, Store
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
      { name: 'POS', path: '/pos', icon: MonitorPlay },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Inventory', path: '/inventory', icon: ArchiveRestore },
      { name: 'Categories', path: '/categories', icon: Tag },
      { name: 'Customers', path: '/customers', icon: Users },
      { name: 'Suppliers', path: '/suppliers', icon: Truck },
      { name: 'Sales', path: '/sales', icon: Receipt },
      { name: 'Purchases', path: '/purchases', icon: ShoppingCart },
      { name: 'Expenses', path: '/expenses', icon: CreditCard },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { name: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { name: 'Users & Staff', path: '/users', icon: UserCog },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Foji Store POS</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold px-3 py-2">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role || 'ADMIN'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
            >
              <SidebarContent onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
