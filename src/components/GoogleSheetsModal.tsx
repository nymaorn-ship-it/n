import React, { useState } from 'react';
import {
  X,
  Sheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  LogOut,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Product, PurchaseOrder, StockTransaction } from '../types/inventory';
import {
  googleSignIn,
  logout,
  createInventorySpreadsheet,
  syncDataToGoogleSheets,
  getAccessToken,
} from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  sheetId: string | null;
  onSheetIdChange: (id: string | null) => void;
  products: Product[];
  transactions: StockTransaction[];
  purchaseOrders: PurchaseOrder[];
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  sheetId,
  onSheetIdChange,
  products,
  transactions,
  purchaseOrders,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );
  const [customSheetId, setCustomSheetId] = useState('');
  const [showConfirmSync, setShowConfirmSync] = useState(false);

  if (!isOpen) return null;

  // Handle Sign In with Google
  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onUserChange(result.user);
        setStatusMessage({
          type: 'success',
          text: `เข้าสู่ระบบสำเร็จในชื่อ ${result.user.email}`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'ไม่สามารถเข้าสู่ระบบ Google ได้ โปรดลองอีกครั้ง',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      onUserChange(null);
      setStatusMessage({
        type: 'info',
        text: 'ออกจากระบบ Google เรียบร้อยแล้ว',
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create New Spreadsheet
  const handleCreateSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบด้วย Google ก่อน' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const { spreadsheetId } = await createInventorySpreadsheet(token);
      onSheetIdChange(spreadsheetId);

      // Perform initial sync into the newly created sheet
      await syncDataToGoogleSheets(token, spreadsheetId, products, transactions, purchaseOrders);

      setStatusMessage({
        type: 'success',
        text: 'สร้าง Google Sheet ใหม่และซิงค์ข้อมูลสำเร็จแล้ว!',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'ไม่สามารถสร้าง Google Sheet ได้',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Sync (after user confirmation)
  const handleExecuteSync = async () => {
    setShowConfirmSync(false);
    const targetId = sheetId || customSheetId.trim();
    if (!targetId) {
      setStatusMessage({ type: 'error', text: 'กรุณาระบุหรือสร้าง Google Sheet ก่อนทำการซิงค์' });
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบด้วย Google ก่อน' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      await syncDataToGoogleSheets(token, targetId, products, transactions, purchaseOrders);
      if (!sheetId && customSheetId.trim()) {
        onSheetIdChange(customSheetId.trim());
      }
      setStatusMessage({
        type: 'success',
        text: `ซิงค์ข้อมูลสต็อก (${products.length} สินค้า, ${transactions.length} รายการเคลื่อนไหว) ไปยัง Google Sheet สำเร็จ!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลไปยัง Google Sheets',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">การเชื่อมต่อ Google Sheets</h3>
              <p className="text-xs text-slate-500">เก็บและส่งออกข้อมูลสต็อกไปยัง Google Drive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* User Sign-In Section */}
          {!currentUser ? (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-white shadow-xs mx-auto flex items-center justify-center text-slate-700">
                <Sheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">เชื่อมต่อบัญชี Google ของคุณ</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  เข้าสู่ระบบเพื่ออนุญาตให้แอพสร้างและบันทึกไฟล์สเปรดชีตใน Google Drive ได้อัตโนมัติ
                </p>
              </div>

              {/* Official Google Sign-In Styled Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSignIn}
                  className="flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs text-slate-700 font-semibold text-xs transition-all cursor-pointer hover:shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Connected Account Card */
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-9 h-9 rounded-full border border-emerald-300"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.email?.[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    {currentUser.displayName || 'Google Account'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-400 hover:text-red-600 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออก</span>
              </button>
            </div>
          )}

          {/* Spreadsheet Target Controls (Available once logged in) */}
          {currentUser && (
            <div className="space-y-4">
              {/* If sheet connected */}
              {sheetId ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      ไฟล์ Google Sheet ที่เชื่อมต่ออยู่
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      พร้อมใช้งาน
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 truncate select-all">
                    ID: {sheetId}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {sheetUrl && (
                      <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                        <span>เปิดดูใน Google Sheets</span>
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setShowConfirmSync(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>{isLoading ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเดี๋ยวนี้'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Not connected to any sheet yet */
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      ตัวเลือกที่ 1: สร้าง Google Sheet ใหม่ทันที
                    </h4>
                    <p className="text-xs text-slate-500">
                      ระบบจะสร้างสเปรดชีตชื่อ <strong>StockMaster - ข้อมูลสต็อกสินค้า</strong> ให้ใน Google Drive ของคุณโดยอัตโนมัติ
                    </p>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleCreateSheet}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isLoading ? 'กำลังสร้างไฟล์...' : 'สร้าง Google Sheet ใหม่ใน Drive'}</span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      ตัวเลือกที่ 2: ระบุ Spreadsheet ID ที่มีอยู่แล้ว
                    </h4>
                    <input
                      type="text"
                      placeholder="เช่น 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      value={customSheetId}
                      onChange={(e) => setCustomSheetId(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      disabled={isLoading || !customSheetId.trim()}
                      onClick={() => setShowConfirmSync(true)}
                      className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      เชื่อมต่อและซิงค์ข้อมูล
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              ข้อมูลจะถูกซิงค์เป็น 3 แผ่นงานหลัก ได้แก่ <strong>สต็อกสินค้าคงเหลือ</strong>,{' '}
              <strong>ประวัติรับเข้า-เบิกออก</strong>, และ <strong>รายการใบสั่งซื้อ PO</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog before Updating/Overwriting Data */}
      {showConfirmSync && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">ยืนยันการบันทึกทับข้อมูลใน Google Sheets</h4>
                <p className="text-xs text-slate-500">โปรดตรวจสอบก่อนดำเนินการ</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              การซิงค์จะทำการบันทึกและปรับปรุงข้อมูลในแท็บสต็อกสินค้า, ประวัติการเคลื่อนไหว ({transactions.length} รายการ), และ PO ทั้งหมดลงใน Google Sheet ของคุณ
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                ยืนยันการซิงค์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
