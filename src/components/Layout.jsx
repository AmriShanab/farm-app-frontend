import { useState } from 'react';
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
  Wallet
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State to track which sidebar menus are expanded
  const [expandedMenus, setExpandedMenus] = useState({
    sales: location.pathname.includes('/sales') // Auto-expand if currently inside sales
  });

  const toggleMenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => navigate('/login');

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
    { name: 'HR & Payroll', path: '/payroll', icon: Users },
    { name: 'Operations', path: '/operations', icon: Tractor },
    { name: 'Fertilizer', path: '/fertilizer', icon: Sprout },
    { name: 'Poultry Farm', path: '/poultry', icon: Bird },
    { name: 'Finances', path: '/finances', icon: Landmark },
    { name: 'Assets & Warranty', path: '/assets', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/30">
            <Tractor size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text font-heading leading-tight">Farm Manager</h1>
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActiveGroup ? 'bg-primary/5 text-primary font-bold' : 'text-earth hover:bg-gray-100 hover:text-text'
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
                           className={({ isActive }) =>
                             `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
                               isActive 
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
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-white">
        
        {/* Top Header */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 z-10 sticky top-0 bg-white">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-earth hover:text-primary transition-colors rounded-lg hover:bg-gray-50"><Menu size={24} /></button>
          </div>
          
          <div className="flex items-center gap-5">
             <button className="relative p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-primary/5">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             <div className="hidden md:block px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-earth">
               {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}