import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CalendarDays,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Store
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Produtos', path: '/produtos', icon: Package },
    { name: 'Vendas', path: '/vendas', icon: ShoppingCart },
    { name: 'Parcelas', path: '/parcelas', icon: CalendarDays },
    { name: 'Relatórios', path: '/relatorios', icon: TrendingUp },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const activeItem = navigationItems.find(item => isActive(item.path));
    return activeItem ? activeItem.name : 'Estoque Karoquíssimo';
  };

  const SidebarContent = () => (
    <>
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
            <Store size={22} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-slate-900">
              Karoquíssimo
            </h1>
            <span className="text-xs text-slate-400">Painel de Estoque</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                }`}
              >
                <Icon
                  size={17}
                  className={active ? 'text-amber-600' : 'text-slate-400'}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User footer */}
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
            {user?.name?.substring(0, 2).toUpperCase() || 'FE'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Fernanda'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'fernanda@karoquissimo.com'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg text-xs font-medium transition-all duration-150"
        >
          <LogOut size={14} />
          <span>Sair do Painel</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white px-4 py-6 justify-between shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 md:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 px-4 py-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 bg-white sticky top-0 z-30 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 md:hidden transition-colors"
            >
              <Menu size={19} />
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Karoquíssimo</span>
              <span>/</span>
              <span className="text-amber-600 font-semibold">{getPageTitle()}</span>
            </div>
            <h2 className="text-base font-semibold text-slate-800 md:hidden">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Conectado</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
