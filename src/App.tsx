/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Product, PurchaseOrder, StockTransaction, StaffMember } from './types/inventory';
import { StorageService } from './services/storage';
import { initAuth } from './services/googleSheets';
import { Navigation, NavTab } from './components/Navigation';
import { StockManagement } from './components/StockManagement';
import { StockMovement } from './components/StockMovement';
import { StockReport } from './components/StockReport';
import { AddProductModal } from './components/AddProductModal';
import { StaffManagerModal } from './components/StaffManagerModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PrintReportView } from './components/PrintReportView';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('inventory');
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => StorageService.getPurchaseOrders());
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => StorageService.getTransactions());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => StorageService.getStaff());
  const [sheetId, setSheetId] = useState<string | null>(() => StorageService.getGoogleSheetId());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Cross-navigation selection state (when user clicks "+ รับเข้า" or "- เบิกออก" in table)
  const [movementAction, setMovementAction] = useState<{
    type: 'IN' | 'OUT';
    sku: string;
  } | null>(null);

  // Modal open states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isStaffManagerOpen, setIsStaffManagerOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [printMonthKey, setPrintMonthKey] = useState<string | null>(null);

  // Initialize Firebase Auth listener on app load
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync to local storage on changes
  useEffect(() => {
    StorageService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    StorageService.savePurchaseOrders(purchaseOrders);
  }, [purchaseOrders]);

  useEffect(() => {
    StorageService.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    StorageService.saveStaff(staffList);
  }, [staffList]);

  useEffect(() => {
    if (sheetId) {
      StorageService.saveGoogleSheetId(sheetId);
    }
  }, [sheetId]);

  // Total stock units count for real-time badge in Navigation
  const totalStockUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + p.quantity, 0);
  }, [products]);

  // Low stock count for alert badge
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.quantity <= p.minStock).length;
  }, [products]);

  // Handle direct click on "+ รับเข้า" or "- เบิกออก" from item row
  const handleOpenStockMovement = (type: 'IN' | 'OUT', sku: string) => {
    setMovementAction({ type, sku });
    setActiveTab(type === 'IN' ? 'stock-in' : 'stock-out');
  };

  // Record Stock Transaction (IN / OUT)
  const handleRecordTransaction = (data: {
    type: 'IN' | 'OUT';
    sku: string;
    productName: string;
    quantity: number;
    poNumber?: string;
    supplier?: string;
    expiryDate?: string;
    recorderName: string;
    note?: string;
  }) => {
    const now = new Date().toISOString();

    // 1. Create Transaction Record
    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      type: data.type,
      sku: data.sku,
      productName: data.productName,
      quantity: data.quantity,
      poNumber: data.poNumber,
      supplier: data.supplier,
      expiryDate: data.expiryDate,
      recorderName: data.recorderName,
      note: data.note,
      timestamp: now,
    };

    // 2. Update Product Inventory Level
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === data.sku) {
          const newQty = data.type === 'IN' ? p.quantity + data.quantity : Math.max(0, p.quantity - data.quantity);
          return {
            ...p,
            quantity: newQty,
            expiryDate: data.expiryDate || p.expiryDate,
            defaultSupplier: data.supplier || p.defaultSupplier,
            updatedAt: now,
          };
        }
        return p;
      })
    );

    // 3. Update Purchase Order if attached
    if (data.poNumber) {
      setPurchaseOrders((prev) =>
        prev.map((po) => {
          if (po.poNumber === data.poNumber) {
            const updatedItems = po.items.map((item) => {
              if (item.sku === data.sku) {
                if (data.type === 'IN') {
                  const newReceived = item.receivedQuantity + data.quantity;
                  const newRemaining = Math.max(0, item.orderedQuantity - newReceived);
                  return {
                    ...item,
                    receivedQuantity: newReceived,
                    remainingQuantity: newRemaining,
                  };
                } else {
                  // Out / Pick from PO
                  const newRemaining = Math.max(0, item.remainingQuantity - data.quantity);
                  return {
                    ...item,
                    remainingQuantity: newRemaining,
                  };
                }
              }
              return item;
            });

            // If all items depleted, lock PO
            const allDepleted = updatedItems.every((i) => i.remainingQuantity <= 0);
            return {
              ...po,
              items: updatedItems,
              status: allDepleted ? 'locked' : 'partially_received',
            };
          }
          return po;
        })
      );
    }

    // 4. Prepend Transaction to history
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Add new Product
  const handleAddProduct = (newProdData: Omit<Product, 'id' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  // Add Staff Member
  const handleAddStaff = (name: string, role: string) => {
    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name,
      role,
      isActive: true,
    };
    setStaffList((prev) => [...prev, newStaff]);
  };

  // Delete Staff Member
  const handleDeleteStaff = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  // Unique categories list
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // If Print View is requested
  if (printMonthKey) {
    return (
      <PrintReportView
        monthKey={printMonthKey}
        products={products}
        transactions={transactions}
        onBack={() => setPrintMonthKey(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setMovementAction(null);
        }}
        totalStockUnits={totalStockUnits}
        totalProductsCount={products.length}
        lowStockCount={lowStockCount}
        googleUser={currentUser}
        onOpenGoogleModal={() => setIsGoogleModalOpen(true)}
        sheetId={sheetId}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: Stock Management (หน้าจัดการสต๊อก) */}
        {activeTab === 'inventory' && (
          <StockManagement
            products={products}
            onOpenStockMovement={handleOpenStockMovement}
            onOpenAddProductModal={() => setIsAddProductOpen(true)}
          />
        )}

        {/* Tab 2: Stock In (หน้าบันทึกรับเข้าสินค้า) */}
        {activeTab === 'stock-in' && (
          <StockMovement
            initialType="IN"
            initialSku={movementAction?.sku}
            products={products}
            purchaseOrders={purchaseOrders}
            staffList={staffList}
            transactions={transactions}
            onRecordTransaction={handleRecordTransaction}
            onOpenStaffManager={() => setIsStaffManagerOpen(true)}
          />
        )}

        {/* Tab 3: Stock Out (หน้าบันทึกเบิกจ่ายสินค้า) */}
        {activeTab === 'stock-out' && (
          <StockMovement
            initialType="OUT"
            initialSku={movementAction?.sku}
            products={products}
            purchaseOrders={purchaseOrders}
            staffList={staffList}
            transactions={transactions}
            onRecordTransaction={handleRecordTransaction}
            onOpenStaffManager={() => setIsStaffManagerOpen(true)}
          />
        )}

        {/* Tab 4: Stock Report (หน้ารายงานคงเหลือ) */}
        {activeTab === 'reports' && (
          <StockReport
            products={products}
            transactions={transactions}
            onOpenGoogleModal={() => setIsGoogleModalOpen(true)}
            onPrintReport={(mKey) => setPrintMonthKey(mKey)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/70 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StockMaster • ระบบบริหารจัดการสต็อกสินค้า & รายงานอัจฉริยะ</span>
          <span>รองรับการเชื่อมต่อและส่งออก Google Sheets</span>
        </div>
      </footer>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={handleAddProduct}
        existingCategories={existingCategories}
      />

      <StaffManagerModal
        isOpen={isStaffManagerOpen}
        onClose={() => setIsStaffManagerOpen(false)}
        staffList={staffList}
        onAddStaff={handleAddStaff}
        onDeleteStaff={handleDeleteStaff}
      />

      <GoogleSheetsModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        sheetId={sheetId}
        onSheetIdChange={setSheetId}
        products={products}
        transactions={transactions}
        purchaseOrders={purchaseOrders}
      />
    </div>
  );
}
