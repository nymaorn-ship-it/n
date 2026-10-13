import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  XCircle,
  Calendar,
  Plus,
  Minus,
  Search,
  Filter,
  PlusCircle,
  Clock,
  ArrowUpDown,
  Building2,
  MapPin,
  Check,
} from 'lucide-react';
import { Product } from '../types/inventory';

interface StockManagementProps {
  products: Product[];
  onOpenStockMovement: (type: 'IN' | 'OUT', sku: string) => void;
  onOpenAddProductModal: () => void;
}

type FilterStatus = 'ALL' | 'LOW' | 'OUT' | 'EXPIRING';

export const StockManagement: React.FC<StockManagementProps> = ({
  products,
  onOpenStockMovement,
  onOpenAddProductModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'expiry'>('quantity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Check if date is within next 30 days
  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return exp >= now && exp - now <= thirtyDaysMs;
  };

  // Check if expired
  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    return exp < now;
  };

  // Calculated Metrics for the 4 Quick Status Summary Cards
  const metrics = useMemo(() => {
    const totalSKUs = products.length;
    const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);

    const lowStockItems = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock);
    const outOfStockItems = products.filter((p) => p.quantity === 0);
    const expiringItems = products.filter((p) => isExpiringSoon(p.expiryDate) || isExpired(p.expiryDate));

    return {
      totalSKUs,
      totalUnits,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      expiringCount: expiringItems.length,
    };
  }, [products]);

  // Unique Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Status filter
        if (statusFilter === 'LOW' && !(p.quantity > 0 && p.quantity <= p.minStock)) return false;
        if (statusFilter === 'OUT' && p.quantity !== 0) return false;
        if (statusFilter === 'EXPIRING' && !(isExpiringSoon(p.expiryDate) || isExpired(p.expiryDate))) return false;

        // Category filter
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchName = p.name.toLowerCase().includes(q);
          const matchSupplier = (p.defaultSupplier || '').toLowerCase().includes(q);
          if (!matchSku && !matchName && !matchSupplier) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortBy === 'name') {
          compare = a.name.localeCompare(b.name);
        } else if (sortBy === 'quantity') {
          compare = a.quantity - b.quantity;
        } else if (sortBy === 'expiry') {
          const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : 9999999999999;
          const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : 9999999999999;
          compare = dateA - dateB;
        }
        return sortOrder === 'asc' ? compare : -compare;
      });
  }, [products, statusFilter, selectedCategory, searchQuery, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* 4 Quick Status Summary Cards (แถบสรุปสถานะด่วน 4 ช่อง) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. สินค้าทั้งหมดในคลัง */}
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">ทั้งหมดในคลัง</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalSKUs}</span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            รวม {metrics.totalUnits.toLocaleString()} ชิ้นในสต็อก
          </p>
        </button>

        {/* 2. ใกล้หมดสต๊อก */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'LOW'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-amber-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700">ใกล้หมดสต๊อก</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{metrics.lowStockCount}</span>
            <span className="text-xs text-amber-700">รายการ</span>
          </div>
          <p className="text-xs text-amber-600 mt-1">ต่ำกว่าจุดสั่งซื้อขั้นต่ำ</p>
        </button>

        {/* 3. สินค้าหมดสต๊อก */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'OUT' ? 'ALL' : 'OUT')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'OUT'
              ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-red-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-700">สินค้าหมดสต๊อก</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">{metrics.outOfStockCount}</span>
            <span className="text-xs text-red-700">รายการ</span>
          </div>
          <p className="text-xs text-red-600 mt-1">คงเหลือ 0 ชิ้น ต้องสั่งด่วน</p>
        </button>

        {/* 4. สินค้าใกล้หมดอายุ */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'EXPIRING' ? 'ALL' : 'EXPIRING')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'EXPIRING'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-rose-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700">สินค้าใกล้หมดอายุ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{metrics.expiringCount}</span>
            <span className="text-xs text-rose-700">รายการ</span>
          </div>
          <p className="text-xs text-rose-600 mt-1">ภายใน 30 วัน หรือหมดแล้ว</p>
        </button>
      </div>

      {/* Action Bar: Search, Category, and Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า, SKU, ผู้ขาย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">ทุกหมวดหมู่ ({products.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as ['name' | 'quantity' | 'expiry', 'asc' | 'desc'];
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="quantity-asc">คงเหลือ: น้อยไปมาก</option>
              <option value="quantity-desc">คงเหลือ: มากไปน้อย</option>
              <option value="name-asc">ชื่อ: ก-ฮ</option>
              <option value="expiry-asc">วันหมดอายุ: ใกล้สุด</option>
            </select>
          </div>
        </div>

        {/* Add Product Button */}
        <button
          onClick={onOpenAddProductModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>เพิ่มสินค้าใหม่</span>
        </button>
      </div>

      {/* Active Filter Indicator */}
      {statusFilter !== 'ALL' && (
        <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-xl text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>กำลังกรอง:</span>
            <span className="font-semibold text-slate-900">
              {statusFilter === 'LOW' && 'สินค้าใกล้หมดสต๊อก'}
              {statusFilter === 'OUT' && 'สินค้าหมดสต๊อก'}
              {statusFilter === 'EXPIRING' && 'สินค้าใกล้หมดอายุ'}
            </span>
            <span>({filteredProducts.length} รายการ)</span>
          </div>
          <button
            onClick={() => setStatusFilter('ALL')}
            className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
          >
            แสดงทั้งหมด
          </button>
        </div>
      )}

      {/* Product List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">ไม่พบรายการสินค้าที่ค้นหา</h3>
            <p className="text-sm text-slate-500 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกตัวกรองใหม่</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setStatusFilter('ALL');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              รีเซ็ตตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">รหัส / ชื่อสินค้า</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">หมวดหมู่ & จัดเก็บ</th>
                  <th className="py-3.5 px-4">คงเหลือ / ขั้นต่ำ</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">วันหมดอายุ</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">ผู้จัดจำหน่าย</th>
                  <th className="py-3.5 px-4 text-right">ดำเนินการ (ด่วน)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((product) => {
                  const isOut = product.quantity === 0;
                  const isLow = product.quantity > 0 && product.quantity <= product.minStock;
                  const expiring = isExpiringSoon(product.expiryDate);
                  const expired = isExpired(product.expiryDate);

                  // Progress percentage toward minStock
                  const stockHealthPct = Math.min(
                    100,
                    Math.round((product.quantity / (product.minStock * 2 || 20)) * 100)
                  );

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isOut ? 'bg-red-50/20' : isLow ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* SKU & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div>
                            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                              {product.sku}
                            </span>
                            <div className="font-semibold text-slate-900 mt-1">{product.name}</div>
                            {/* Mobile Info */}
                            <div className="flex sm:hidden items-center gap-2 mt-1 text-xs text-slate-500">
                              <span>{product.category}</span>
                              {product.location && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {product.location}
                                </span>
                              )}
                            </div>
                            {/* Mobile Expiry */}
                            {product.expiryDate && (
                              <div className="sm:hidden mt-1 text-xs">
                                <span
                                  className={`inline-flex items-center gap-1 font-medium ${
                                    expired
                                      ? 'text-red-700 font-bold'
                                      : expiring
                                      ? 'text-rose-600'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  {product.expiryDate} {expired && '(หมดอายุแล้ว!)'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="py-3.5 px-4 hidden sm:table-cell text-slate-600">
                        <div className="font-medium text-slate-800">{product.category}</div>
                        {product.location ? (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>จุดเก็บ: {product.location}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Quantity & Stock Level */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`text-lg font-bold ${
                              isOut
                                ? 'text-red-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {product.quantity.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{product.unit}</span>
                        </div>

                        {/* Health Bar / Threshold Indicator */}
                        <div className="w-28 mt-1.5">
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOut
                                  ? 'bg-red-500 w-0'
                                  : isLow
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(5, stockHealthPct)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                            <span>เตือนที่: {product.minStock} {product.unit}</span>
                          </div>
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        {product.expiryDate ? (
                          <div className="flex flex-col">
                            <span
                              className={`text-xs font-semibold flex items-center gap-1 ${
                                expired
                                  ? 'text-red-600'
                                  : expiring
                                  ? 'text-rose-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {product.expiryDate}
                            </span>
                            {expired ? (
                              <span className="text-[10px] text-red-600 font-bold">หมดอายุแล้ว</span>
                            ) : expiring ? (
                              <span className="text-[10px] text-rose-500 font-medium">ใกล้หมดอายุ</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">ยังไม่หมดอายุ</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">ไม่ได้ระบุ</span>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-600">
                        {product.defaultSupplier ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]" title={product.defaultSupplier}>
                              {product.defaultSupplier}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Action Buttons: "+ รับเข้า" and "- เบิกออก" with Distinct Colors */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* "+ รับเข้า" Button (Emerald) */}
                          <button
                            onClick={() => onOpenStockMovement('IN', product.sku)}
                            title={`รับเข้าสินค้า ${product.name}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>รับเข้า</span>
                          </button>

                          {/* "- เบิกออก" Button (Rose/Amber) */}
                          <button
                            onClick={() => onOpenStockMovement('OUT', product.sku)}
                            disabled={isOut}
                            title={isOut ? 'สินค้าหมดสต๊อก ไม่สามารถเบิกได้' : `เบิกจ่าย ${product.name}`}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                              isOut
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow'
                            }`}
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>เบิกออก</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
