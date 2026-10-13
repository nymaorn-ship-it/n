import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Zap,
  Clock,
  ChevronRight,
  UserPlus,
  History,
  Info,
} from 'lucide-react';
import { Product, PurchaseOrder, StockTransaction, StaffMember } from '../types/inventory';

interface StockMovementProps {
  initialType?: 'IN' | 'OUT';
  initialSku?: string;
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  staffList: StaffMember[];
  transactions: StockTransaction[];
  onRecordTransaction: (data: {
    type: 'IN' | 'OUT';
    sku: string;
    productName: string;
    quantity: number;
    poNumber?: string;
    supplier?: string;
    expiryDate?: string;
    recorderName: string;
    note?: string;
  }) => void;
  onOpenStaffManager: () => void;
}

export const StockMovement: React.FC<StockMovementProps> = ({
  initialType = 'IN',
  initialSku,
  products,
  purchaseOrders,
  staffList,
  transactions,
  onRecordTransaction,
  onOpenStaffManager,
}) => {
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>(initialType);
  const [selectedSku, setSelectedSku] = useState<string>(initialSku || (products[0]?.sku ?? ''));
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [supplier, setSupplier] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [recorderName, setRecorderName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Sync initial type or SKU if props change
  useEffect(() => {
    if (initialType) setMovementType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialSku) setSelectedSku(initialSku);
  }, [initialSku]);

  // Set default recorder name if none selected
  useEffect(() => {
    if (!recorderName && staffList.length > 0) {
      setRecorderName(staffList[0].name);
    }
  }, [staffList, recorderName]);

  // Current selected product
  const currentProduct = useMemo(() => {
    return products.find((p) => p.sku === selectedSku);
  }, [products, selectedSku]);

  // Relevant POs for the selected product (or all POs if no product selected)
  const relevantPOs = useMemo(() => {
    if (!selectedSku) return purchaseOrders;
    return purchaseOrders.filter((po) =>
      po.items.some((item) => item.sku === selectedSku)
    );
  }, [purchaseOrders, selectedSku]);

  // Current selected PO object
  const selectedPO = useMemo(() => {
    return purchaseOrders.find((po) => po.id === selectedPoId);
  }, [purchaseOrders, selectedPoId]);

  // Current item info in the selected PO
  const currentPoItem = useMemo(() => {
    if (!selectedPO || !selectedSku) return null;
    return selectedPO.items.find((item) => item.sku === selectedSku);
  }, [selectedPO, selectedSku]);

  // Auto-fill supplier and expiry date when product or PO changes
  useEffect(() => {
    if (selectedPO) {
      setSupplier(selectedPO.supplier || '');
      if (currentPoItem?.expiryDate) {
        setExpiryDate(currentPoItem.expiryDate);
      }
    } else if (currentProduct) {
      if (currentProduct.defaultSupplier) {
        setSupplier(currentProduct.defaultSupplier);
      }
      if (currentProduct.expiryDate) {
        setExpiryDate(currentProduct.expiryDate);
      }
    }
  }, [selectedPO, currentPoItem, currentProduct]);

  // Calculate Maximum Pickable Quantity (for OUT / เบิกสินค้า)
  const maxPickableQuantity = useMemo(() => {
    if (!currentProduct) return 0;

    const availableInWarehouse = currentProduct.quantity;

    // If a PO is selected, the pick limit is constrained by the PO remaining quantity AND warehouse stock
    if (selectedPO && currentPoItem) {
      return Math.min(currentPoItem.remainingQuantity, availableInWarehouse);
    }

    return availableInWarehouse;
  }, [currentProduct, selectedPO, currentPoItem]);

  // Max Receivable Quantity (for IN / รับเข้าสินค้า)
  const maxReceivableFromPO = useMemo(() => {
    if (selectedPO && currentPoItem) {
      return currentPoItem.remainingQuantity;
    }
    return null; // No limit if not from PO
  }, [selectedPO, currentPoItem]);

  // Shortcut button: "เบิกทั้งหมดของ PO นี้"
  const handlePickAllFromPO = () => {
    if (movementType === 'OUT') {
      if (maxPickableQuantity > 0) {
        setQuantity(maxPickableQuantity);
        setValidationError('');
      }
    } else {
      if (maxReceivableFromPO && maxReceivableFromPO > 0) {
        setQuantity(maxReceivableFromPO);
        setValidationError('');
      }
    }
  };

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedSku || !currentProduct) {
      setValidationError('กรุณาเลือกรายการสินค้า');
      return;
    }

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setValidationError('กรุณาระบุจำนวนที่มากกว่า 0');
      return;
    }

    // Validation for OUT (เบิกจ่าย)
    if (movementType === 'OUT') {
      if (numQty > currentProduct.quantity) {
        setValidationError(
          `จำนวนที่เบิก (${numQty} ${currentProduct.unit}) เกินกว่าสต็อกคงเหลือในคลัง (${currentProduct.quantity} ${currentProduct.unit})`
        );
        return;
      }

      if (selectedPO && currentPoItem && numQty > currentPoItem.remainingQuantity) {
        setValidationError(
          `จำนวนที่เบิก (${numQty} ${currentProduct.unit}) เกินกว่ายอดคงเหลือที่เบิกได้ของ PO นี้ (${currentPoItem.remainingQuantity} ${currentProduct.unit})`
        );
        return;
      }
    }

    if (!recorderName.trim()) {
      setValidationError('กรุณาเลือกผู้ลงบันทึกรายการ');
      return;
    }

    // Process Transaction
    onRecordTransaction({
      type: movementType,
      sku: currentProduct.sku,
      productName: currentProduct.name,
      quantity: numQty,
      poNumber: selectedPO?.poNumber || undefined,
      supplier: supplier.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      recorderName: recorderName.trim(),
      note: note.trim() || undefined,
    });

    // Reset Form
    setQuantity('');
    setNote('');
    setSelectedPoId('');
    setSuccessToast(
      movementType === 'IN'
        ? `บันทึกรับเข้า ${currentProduct.name} จำนวน ${numQty} ${currentProduct.unit} สำเร็จ!`
        : `บันทึกเบิกจ่าย ${currentProduct.name} จำนวน ${numQty} ${currentProduct.unit} สำเร็จ!`
    );

    setTimeout(() => {
      setSuccessToast('');
    }, 4000);
  };

  // Recent transactions (filtered or all)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 10);
  }, [transactions]);

  return (
    <div className="space-y-8">
      {/* Type Toggle Header (รับเข้า vs เบิกสินค้า) */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMovementType('IN');
              setValidationError('');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              movementType === 'IN'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ รับเข้าสินค้า (Stock In)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMovementType('OUT');
              setValidationError('');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              movementType === 'OUT'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- เบิกจ่ายสินค้า (Stock Out)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          {movementType === 'IN' ? 'เพิ่มยอดสต็อกสินค้าเข้าคลัง' : 'ตัดจ่ายสินค้าออกจากสต็อก'}
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successToast}</p>
        </div>
      )}

      {/* Main Movement Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  movementType === 'IN' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {movementType === 'IN' ? 'ฟอร์มบันทึกรับเข้าสินค้า' : 'ฟอร์มบันทึกเบิกจ่ายสินค้า'}
            </h2>

            {/* 1. Select Product */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. เลือกรายการสินค้า <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSku}
                onChange={(e) => {
                  setSelectedSku(e.target.value);
                  setSelectedPoId('');
                  setQuantity('');
                  setValidationError('');
                }}
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    [{p.sku}] {p.name} (คงเหลือ: {p.quantity} {p.unit})
                  </option>
                ))}
              </select>

              {currentProduct && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">สต็อกคงเหลือปัจจุบัน: </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentProduct.quantity.toLocaleString()} {currentProduct.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">จุดเตือนขั้นต่ำ: </span>
                    <span className="font-semibold text-slate-700">
                      {currentProduct.minStock} {currentProduct.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. PO Selection Cards (การ์ดเลือกเลขที่ใบสั่งซื้อ PO) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. เลือกเลขที่ใบสั่งซื้อ (PO) {movementType === 'OUT' ? 'สำหรับการตัดเบิก' : 'สำหรับการรับเข้า'}
                </label>
                {selectedPoId && (
                  <button
                    type="button"
                    onClick={() => setSelectedPoId('')}
                    className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                  >
                    ยกเลิกการเลือก PO
                  </button>
                )}
              </div>

              {relevantPOs.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  ไม่มีใบสั่งซื้อ (PO) สำหรับสินค้านี้ สามารถทำรายการแบบทั่วไปได้
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relevantPOs.map((po) => {
                    const isSelected = selectedPoId === po.id;
                    const item = po.items.find((i) => i.sku === selectedSku);
                    const remaining = item ? item.remainingQuantity : 0;
                    const isLocked = po.status === 'locked' || remaining <= 0;

                    return (
                      <div
                        key={po.id}
                        onClick={() => {
                          if (isLocked && movementType === 'OUT') return; // Cannot pick if locked
                          setSelectedPoId(isSelected ? '' : po.id);
                          setValidationError('');
                        }}
                        className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                            : isLocked
                            ? 'bg-slate-50/80 border-slate-200 opacity-70 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Blue circular status indicator when selected */}
                            <div
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-600 ring-4 ring-blue-100 shadow-xs'
                                  : 'border-2 border-slate-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {po.poNumber}
                            </span>
                          </div>

                          {/* Tag: Green tag when remaining > 0, Red locked tag when depleted */}
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">
                              <Lock className="w-3 h-3" />
                              ยอด PO หมดแล้ว / ล็อก
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              เบิกได้คงเหลือ: {remaining} {currentProduct?.unit}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-slate-600 flex flex-col gap-0.5">
                          <div className="truncate">
                            <span className="text-slate-400">ผู้ขาย: </span>
                            {po.supplier}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            สั่งเมื่อ: {po.orderDate} {po.expectedDeliveryDate ? `| ส่ง: ${po.expectedDeliveryDate}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Smart Quantity Input with Limit & One-Click Shortcut */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. จำนวน ({currentProduct?.unit || 'ชิ้น'}) <span className="text-red-500">*</span>
                </label>

                {/* Smart Limit Display */}
                {movementType === 'OUT' && currentProduct && (
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>เบิกได้สูงสุด: </span>
                    <span className="text-blue-700 font-bold">
                      {maxPickableQuantity} {currentProduct.unit}
                    </span>
                    {selectedPO && (
                      <span className="text-slate-400 text-[11px]">(ตามยอด PO)</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max={movementType === 'OUT' ? maxPickableQuantity : undefined}
                    placeholder="ระบุจำนวนตัวเลข..."
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setQuantity(val);
                      setValidationError('');
                    }}
                    className="w-full py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {currentProduct && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      {currentProduct.unit}
                    </span>
                  )}
                </div>

                {/* Smart Shortcut Button: "เบิกทั้งหมดของ PO นี้" */}
                {selectedPO && (
                  <button
                    type="button"
                    onClick={handlePickAllFromPO}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>{movementType === 'OUT' ? 'เบิกทั้งหมดของ PO นี้' : 'รับทั้งหมดของ PO นี้'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4. Additional Fields: Supplier, Expiry, Recorder, Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier Name (ชื่อผู้ขาย) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>ชื่อผู้ขาย / ซัพพลายเออร์</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น บจก. นอร์ทเทิร์น คอฟฟี่"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Expiration Date (วันเดือนปี ที่หมดอายุ) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>วันเดือนปี ที่หมดอายุ</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Recorded By (ชื่อคนที่ลงบันทึก) Dropdown + Manage Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>ผู้ลงบันทึกรายการ <span className="text-red-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={onOpenStaffManager}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    จัดการรายชื่อ
                  </button>
                </div>
                <select
                  value={recorderName}
                  onChange={(e) => setRecorderName(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.name}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หมายเหตุ / เหตุผลการทำรายการ
                </label>
                <input
                  type="text"
                  placeholder="เช่น จ่ายหน้าร้าน, รับสินค้าล็อตใหม่"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-3 px-6 rounded-xl font-bold text-sm text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  movementType === 'IN'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                }`}
              >
                {movementType === 'IN' ? (
                  <>
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>ยืนยันการรับเข้าสินค้า</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>ยืนยันการเบิกจ่ายสินค้า</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Transaction History (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>ประวัติทำรายการล่าสุด</span>
              </h3>
              <span className="text-xs text-slate-400">{recentTransactions.length} รายการ</span>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  ยังไม่มีประวัติการทำรายการ
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const isTxIn = tx.type === 'IN';
                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isTxIn
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isTxIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isTxIn ? 'รับเข้า' : 'เบิกออก'} {tx.quantity}
                        </span>

                        {tx.poNumber && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                            {tx.poNumber}
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {tx.productName}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>โดย: {tx.recorderName}</span>
                        <span>{new Date(tx.timestamp).toLocaleDateString('th-TH')}</span>
                      </div>

                      {(tx.supplier || tx.expiryDate) && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 border-t border-slate-200/50 pt-1 mt-1">
                          {tx.supplier && <span className="truncate">ผู้ขาย: {tx.supplier}</span>}
                          {tx.expiryDate && <span>หมดอายุ: {tx.expiryDate}</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
