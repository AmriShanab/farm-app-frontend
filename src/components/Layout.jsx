import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Coins,
  Users,
  Tractor,
  Sprout,
  Bird,
  Landmark,
  ShieldCheck,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  Nut,
  Wallet,
  UserPlus,
  CalendarCheck,
  Calculator,
  Search,
  Sun,
  User
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State to track which sidebar menus are expanded
  const [expandedMenus, setExpandedMenus] = useState({
    sales: location.pathname.includes('/sales') // Auto-expand if currently inside sales
  });

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleMenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => navigate('/login');

  const getHeaderContent = () => {
    const path = location.pathname;

    if (path === '/') {
      return {
        title: 'Dashboard',
        subtitle: 'Farm overview and quick status',
        section: 'Overview',
      };
    }

    if (path.includes('/sales/coconuts')) {
      return { title: 'Coconut Estate', subtitle: 'Track estate sales and yield', section: 'Sales & Income' };
    }

    if (path.includes('/sales/cashews')) {
      return { title: 'Cashew Nuts', subtitle: 'Monitor cashew income records', section: 'Sales & Income' };
    }

    if (path.includes('/sales/other')) {
      return { title: 'Other Incomes', subtitle: 'Record miscellaneous income streams', section: 'Sales & Income' };
    }

    if (path.includes('/payroll/profiles')) {
      return { title: 'Employees', subtitle: 'Manage staff profiles and records', section: 'HR & Payroll' };
    }

    if (path.includes('/payroll/attendance')) {
      return { title: 'Daily Attendance', subtitle: 'Review workforce attendance logs', section: 'HR & Payroll' };
    }

    if (path.includes('/payroll/advances')) {
      return { title: 'Cash Advances', subtitle: 'Track advance requests and balances', section: 'HR & Payroll' };
    }

    if (path.includes('/payroll/calculator')) {
      return { title: 'Run Payroll', subtitle: 'Calculate payroll for the current cycle', section: 'HR & Payroll' };
    }

    if (path.includes('/expenses')) {
      return { title: 'Expenses', subtitle: 'Manage operational spending', section: 'Operations' };
    }

    if (path.includes('/fertilizer')) {
      return { title: 'Fertilizer', subtitle: 'Track fertilizer stock and usage', section: 'Operations' };
    }

    if (path.includes('/poultry')) {
      return { title: 'Poultry Farm', subtitle: 'Monitor poultry operations', section: 'Operations' };
    }

    if (path.includes('/finances')) {
      return { title: 'Finances', subtitle: 'View cash flow and balances', section: 'Accounts' };
    }

    if (path.includes('/assets')) {
      return { title: 'Assets & Warranty', subtitle: 'Manage equipment and warranty status', section: 'Asset Control' };
    }

    return {
      title: 'MR Farm',
      subtitle: 'Estate & poultry operations',
      section: 'Home',
    };
  };

  const headerContent = getHeaderContent();

  // Updated Navigation Array with Sub-Items
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    {
      name: 'Sales & Income',
      key: 'sales',
      icon: Coins,
      subItems: [
        { name: 'Coconut Estate', path: '/sales/coconuts', icon: Sprout },
        { name: 'Cashew Nuts', path: '/sales/cashews', icon: Nut },
        { name: 'Other Incomes', path: '/sales/other', icon: Wallet },
      ]
    },
    {
      name: 'HR & Payroll',
      key: 'payroll',
      icon: Users,
      subItems: [
        { name: 'Employees', path: '/payroll/profiles', icon: UserPlus },
        { name: 'Daily Attendance', path: '/payroll/attendance', icon: CalendarCheck },
        { name: 'Cash Advances', path: '/payroll/advances', icon: Wallet },
        { name: 'Run Payroll', path: '/payroll/calculator', icon: Calculator },
      ]
    },
    { name: 'Expenses', path: '/expenses', icon: Tractor },
    { name: 'Fertilizer', path: '/fertilizer', icon: Sprout },
    { name: 'Poultry Farm', path: '/poultry', icon: Bird },
    { name: 'Finances', path: '/finances', icon: Landmark },
    { name: 'Assets & Warranty', path: '/assets', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-50 border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/30">
            <Tractor size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text font-heading leading-tight">MR Farm</h1>
            <p className="text-[11px] text-earth font-bold uppercase tracking-wider">Estate & Poultry</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {

            // Render Items with Sub-Navigation
            if (item.subItems) {
              const isActiveGroup = location.pathname.includes('/sales');
              return (
                <div key={item.key} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${isActiveGroup ? 'bg-primary/5 text-primary font-bold' : 'text-earth hover:bg-gray-100 hover:text-text'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} strokeWidth={isActiveGroup ? 2.5 : 2} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    {expandedMenus[item.key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {/* The Dropdown Sub-menu */}
                  {expandedMenus[item.key] && (
                    <div className="pl-9 pr-2 space-y-1 pt-1 pb-2">
                      {item.subItems.map(sub => (
                        <NavLink
                          key={sub.name}
                          to={sub.path}
                          onClick={closeSidebar}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${isActive
                              ? 'bg-primary-light/20 text-primary font-bold shadow-sm border border-primary/10'
                              : 'text-earth hover:bg-gray-100 hover:text-text'
                            }`
                          }
                        >
                          {/* Corrected Sub-Item Icon Rendering */}
                          {({ isActive }) => (
                            <>
                              <sub.icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                              <span>{sub.name}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Render Standard Single Link Items
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-primary-light/20 text-primary font-bold shadow-sm border border-primary/10'
                    : 'text-earth hover:bg-gray-100 hover:text-text'
                  }`
                }
              >
                {/* Corrected Standard Item Icon Rendering */}
                {({ isActive }) => (
                  <>
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-sm">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">PR</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-text truncate">Proprietor</p>
              <p className="text-[10px] uppercase text-earth font-bold">Admin Access</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-earth hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full font-bold">
            <LogOut size={16} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-white lg:ml-0">

        {/* Top Header */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-8 z-20 sticky top-0 bg-white/90 backdrop-blur-md">
          {/* ── LEFT SIDE: Hamburger, Greeting, & Search ── */}
          <div className="flex items-center gap-4 flex-1">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>

            <div className="hidden md:flex items-center gap-6 flex-1 max-w-2xl">
              {/* 1. Quick Greeting */}
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Welcome Back</span>
                <span className="text-sm font-bold text-gray-800">Admin User</span>
              </div>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-gray-200"></div>

              {/* 2. Global Search Bar */}
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400 group-focus-within:text-green-600 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search assets, expenses, or staff..."
                  className="block w-full pl-10 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black text-gray-400 bg-white border border-gray-200 shadow-sm">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE: Date, Notifications, Profile ── */}
          <div className="flex items-center gap-4">
            {/* Dynamic Date & Weather/Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 shadow-sm">
              <Sun size={14} className="text-orange-400" />
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-400 hover:text-green-600 transition-colors rounded-full hover:bg-green-50">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* User Avatar */}
            <button className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-800 border-2 border-white shadow-md flex items-center justify-center hover:scale-105 transition-transform">
              <User size={16} className="text-white" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}