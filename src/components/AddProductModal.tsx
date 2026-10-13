import React, { useState } from 'react';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import { Product } from '../types/inventory';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  existingCategories: string[];
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  existingCategories,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(existingCategories[0] || 'เครื่องดื่ม/วัตถุดิบ');
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState('ชิ้น');
  const [quantity, setQuantity] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [location, setLocation] = useState('');
  const [defaultSupplier, setDefaultSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      setError('กรุณาระบุรหัสสินค้า (SKU)');
      return;
    }
    if (!name.trim()) {
      setError('กรุณาระบุชื่อสินค้า');
      return;
    }

    const finalCategory = category === '__NEW__' ? customCategory.trim() || 'ทั่วไป' : category;

    onAddProduct({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: finalCategory,
      unit: unit.trim() || 'ชิ้น',
      quantity: Number(quantity) || 0,
      minStock: Number(minStock) || 0,
      location: location.trim() || undefined,
      defaultSupplier: defaultSupplier.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      costPrice: costPrice !== '' ? Number(costPrice) : undefined,
      sellingPrice: sellingPrice !== '' ? Number(sellingPrice) : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">เพิ่มรายการสินค้าใหม่</h3>
              <p className="text-xs text-slate-500">บันทึกข้อมูลสินค้าเข้าสู่ระบบคลัง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสสินค้า (SKU) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น SKU-TEA-09"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมวดหมู่สินค้า
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {existingCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__NEW__">+ สร้างหมวดหมู่ใหม่</option>
              </select>
            </div>
          </div>

          {category === '__NEW__' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อหมวดหมู่ใหม่
              </label>
              <input
                type="text"
                placeholder="เช่น อุปกรณ์ทำความสะอาด"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อสินค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น ชาเขียวผงมัทฉะ ตราชาเขียวแท้ 500g"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หน่วยนับ
              </label>
              <input
                type="text"
                placeholder="เช่น ชิ้น, ถุง"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนตั้งต้น
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จุดเตือนขั้นต่ำ
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ผู้จำหน่าย / ซัพพลายเออร์หลัก
              </label>
              <input
                type="text"
                placeholder="เช่น บจก. นอร์ทเทิร์น ที แอนด์ คอฟฟี่"
                value={defaultSupplier}
                onChange={(e) => setDefaultSupplier(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันหมดอายุ (ถ้ามี)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ตำแหน่งจุดจัดเก็บในคลัง (Location)
            </label>
            <input
              type="text"
              placeholder="เช่น ชั้นวาง B-02-04 หรือ โซนห้องเย็น"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              บันทึกสินค้า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
