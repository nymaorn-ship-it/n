import React, { useState } from 'react';
import { X, UserPlus, Trash2, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { StaffMember } from '../types/inventory';

interface StaffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onAddStaff: (name: string, role: string) => void;
  onDeleteStaff: (id: string) => void;
}

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onAddStaff,
  onDeleteStaff,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('เจ้าหน้าที่คลัง');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อ-นามสกุลของผู้บันทึก');
      return;
    }

    onAddStaff(name.trim(), role.trim());
    setName('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">จัดการรายชื่อผู้ลงบันทึก</h3>
              <p className="text-xs text-slate-500">เพิ่มหรือลดรายชื่อในเมนูดรอปดาวน์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to Add New Staff */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              เพิ่มรายชื่อใหม่
            </h4>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล เช่น กิตติศักดิ์ พูลสวัสดิ์"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />

              <div className="flex gap-2">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="หัวหน้าคลังสินค้า">หัวหน้าคลังสินค้า</option>
                  <option value="เจ้าหน้าที่คลัง">เจ้าหน้าที่คลัง</option>
                  <option value="ฝ่ายจัดซื้อ">ฝ่ายจัดซื้อ</option>
                  <option value="ผู้จัดการสาขา">ผู้จัดการสาขา</option>
                  <option value="พนักงานตรวจรับ">พนักงานตรวจรับ</option>
                </select>

                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>เพิ่ม</span>
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
            </div>
          </form>

          {/* Current Staff List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                รายชื่อปัจจุบัน ({staffList.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
              {staffList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  ยังไม่มีรายชื่อผู้บันทึก
                </div>
              ) : (
                staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{staff.name}</div>
                      <div className="text-[11px] text-slate-500">{staff.role}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteStaff(staff.id)}
                      title="ลบรายชื่อ"
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
