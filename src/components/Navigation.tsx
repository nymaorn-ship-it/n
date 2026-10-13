import React from 'react';
import { Package, ArrowDownLeft, ArrowUpRight, BarChart3, Sheet, CheckCircle2, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

export type NavTab = 'inventory' | 'stock-in' | 'stock-out' | 'reports';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  totalStockUnits: number;
  totalProductsCount: number;
  lowStockCount: number;
  googleUser: User | null;
  onOpenGoogleModal: () => void;
  sheetId: string | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  totalStockUnits,
  lowStockCount,
  googleUser,
  onOpenGoogleModal,
  sheetId,
}) => {
  const tabs = [
    {
      id: 'inventory' as NavTab,
      label: 'จัดการสต๊อก',
      icon: Package,
      activeColor: 'bg-blue-600 text-white shadow-md shadow-blue-500/20',
      iconColor: activeTab === 'inventory' ? 'text-white' : 'text-blue-600',
      badge: totalStockUnits.toLocaleString() + ' ชิ้น',
      badgeColor: activeTab === 'inventory' ? 'bg-blue-700/80 text-blue-100' : 'bg-blue-100 text-blue-700',
    },
    {
      id: 'stock-in' as NavTab,
      label: 'รับเข้า',
      icon: ArrowDownLeft,
      activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
      iconColor: activeTab === 'stock-in' ? 'text-white' : 'text-emerald-600',
    },
    {
      id: 'stock-out' as NavTab,
      label: 'เบิกสินค้า',
      icon: ArrowUpRight,
      activeColor: 'bg-amber-600 text-white shadow-md shadow-amber-500/20',
      iconColor: activeTab === 'stock-out' ? 'text-white' : 'text-amber-600',
    },
    {
      id: 'reports' as NavTab,
      label: 'รายงาน',
      icon: BarChart3,
      activeColor: 'bg-purple-600 text-white shadow-md shadow-purple-500/20',
      iconColor: activeTab === 'reports' ? 'text-white' : 'text-purple-600',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">StockMaster</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium hidden sm:inline-block">
                  คลังสินค้า
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">ระบบจัดการสต็อก & แจ้งเตือนอัจฉริยะ</p>
            </div>
          </div>

          {/* Segmented Pill Navigation (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? tab.activeColor
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.iconColor}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ml-1 transition-colors ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Google Sheets & User Status */}
          <div className="flex items-center gap-2">
            {lowStockCount > 0 && (
              <button
                onClick={() => onTabChange('inventory')}
                title={`${lowStockCount} รายการใกล้หมดหรือหมดสต็อก`}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                เตือน {lowStockCount} รายการ
              </button>
            )}

            <button
              onClick={onOpenGoogleModal}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                googleUser
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Sheet className={`w-4 h-4 ${googleUser ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {googleUser ? (sheetId ? 'Google Sheets เชื่อมต่อแล้ว' : 'ซิงค์ Google Sheets') : 'เชื่อมต่อ Google Sheets'}
              </span>
              <span className="sm:hidden">
                {googleUser ? 'ซิงค์ Sheets' : 'ต่อ Sheets'}
              </span>
              {googleUser && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Segmented Pill Navigation */}
        <div className="md:hidden pb-3 pt-1">
          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? tab.activeColor
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-0.5 ${tab.iconColor}`} />
                  <span className="truncate max-w-full text-[11px]">{tab.label}</span>
                  {tab.id === 'inventory' && (
                    <span className="text-[10px] opacity-90 leading-tight">
                      {totalStockUnits} ชิ้น
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
