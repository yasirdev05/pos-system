import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface HeaderProps {
  onMenuOpen: () => void;
}

export default function Header({ onMenuOpen }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onMenuOpen} className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className='text-lg font-bold'>Foji Departmental Store</h2>
        {/* <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input type="text" placeholder="Search products, customers..." className="pl-9 pr-4 py-2 bg-slate-50 rounded-full text-sm outline-none focus:ring-2 focus:ring-slate-200 text-slate-900 w-72 border border-slate-200" />
        </div> */}
      </div>

      <div className="flex items-center gap-3">
        {/* <button className="relative p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button> */}

        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2.5 pl-3 border-l border-slate-200 focus:outline-none">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900 leading-none">{user?.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{user?.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg py-1 ring-1 ring-slate-200 z-40">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
