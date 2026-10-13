import React from 'react';
import { ArrowLeft, Printer, Download, Package } from 'lucide-react';
import { Product, StockTransaction } from '../types/inventory';

interface PrintReportViewProps {
  monthKey: string;
  products: Product[];
  transactions: StockTransaction[];
  onBack: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  monthKey,
  products,
  transactions,
  onBack,
}) => {
  const [yearStr, monthStr] = monthKey.split('-');
  const thaiMonthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = thaiMonthNames[monthIndex] || monthStr;
  const thaiYear = parseInt(yearStr, 10) + 543;

  const monthlyTransactions = transactions.filter((tx) => tx.timestamp.startsWith(monthKey));

  let totalIn = 0;
  let totalOut = 0;
  monthlyTransactions.forEach((tx) => {
    if (tx.type === 'IN') totalIn += tx.quantity;
    else totalOut += tx.quantity;
  });

  const productBreakdown = products.map((prod) => {
    const inQty = monthlyTransactions
      .filter((tx) => tx.sku === prod.sku && tx.type === 'IN')
      .reduce((sum, tx) => sum + tx.quantity, 0);

    const outQty = monthlyTransactions
      .filter((tx) => tx.sku === prod.sku && tx.type === 'OUT')
      .reduce((sum, tx) => sum + tx.quantity, 0);

    return {
      product: prod,
      inQty,
      outQty,
      net: inQty - outQty,
      endingStock: prod.quantity,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white">
      {/* Top Controls Bar (hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายงาน</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน / บันทึกเป็น PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 / Formal Layout) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  StockMaster Inventory System
                </h1>
              </div>
              <h2 className="text-base font-semibold text-slate-700 mt-1">
                รายงานสรุปยอดรับเข้า, ยอดเบิก, และยอดคงเหลือสินค้าประจำเดือน
              </h2>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>พิมพ์วันที่: {new Date().toLocaleDateString('th-TH')}</div>
              <div className="font-semibold text-slate-700 mt-1">
                ประจำเดือน: {monthName} {thaiYear}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Summary KPI Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 font-semibold block">ยอดรับเข้ารวม</span>
            <span className="text-base font-bold text-emerald-700">+{totalIn.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 font-semibold block">ยอดเบิกออกรวม</span>
            <span className="text-base font-bold text-rose-700">-{totalOut.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 font-semibold block">ผลต่างสุทธิ</span>
            <span className={`text-base font-bold ${totalIn - totalOut >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
              {totalIn - totalOut >= 0 ? `+${(totalIn - totalOut).toLocaleString()}` : (totalIn - totalOut).toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 font-semibold block">จำนวนรายการ</span>
            <span className="text-base font-bold text-slate-800">{monthlyTransactions.length}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            รายการสินค้าและการเคลื่อนไหว ({products.length} รายการ)
          </h3>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 font-bold text-slate-700">
                <th className="py-2 px-2.5">ลำดับ</th>
                <th className="py-2 px-2.5">รหัส SKU</th>
                <th className="py-2 px-2.5">ชื่อสินค้า</th>
                <th className="py-2 px-2.5">หมวดหมู่</th>
                <th className="py-2 px-2.5 text-center">รับเข้า (+)</th>
                <th className="py-2 px-2.5 text-center">เบิกออก (-)</th>
                <th className="py-2 px-2.5 text-center">ผลต่างสุทธิ</th>
                <th className="py-2 px-2.5 text-right">คงเหลือสุทธิ</th>
                <th className="py-2 px-2.5 text-center">หน่วย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productBreakdown.map((row, idx) => (
                <tr key={row.product.id} className="text-slate-800">
                  <td className="py-2 px-2.5 text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-2.5 font-mono font-semibold">{row.product.sku}</td>
                  <td className="py-2 px-2.5 font-medium">{row.product.name}</td>
                  <td className="py-2 px-2.5 text-slate-600">{row.product.category}</td>
                  <td className="py-2 px-2.5 text-center font-semibold text-emerald-700">
                    {row.inQty > 0 ? `+${row.inQty}` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-center font-semibold text-rose-700">
                    {row.outQty > 0 ? `-${row.outQty}` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-center font-bold">
                    {row.net > 0 ? `+${row.net}` : row.net}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold">
                    {row.endingStock}
                  </td>
                  <td className="py-2 px-2.5 text-center text-slate-500">{row.product.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 text-center text-xs">
          <div>
            <div className="h-12 border-b border-slate-400 mb-2" />
            <div className="font-semibold text-slate-800">ลงชื่อ ผู้จัดทำรายงาน</div>
            <div className="text-slate-500 text-[11px] mt-0.5">(เจ้าหน้าที่คลังสินค้า)</div>
          </div>
          <div>
            <div className="h-12 border-b border-slate-400 mb-2" />
            <div className="font-semibold text-slate-800">ลงชื่อ ผู้ตรวจสอบ</div>
            <div className="text-slate-500 text-[11px] mt-0.5">(หัวหน้าแผนกคลังสินค้า)</div>
          </div>
          <div>
            <div className="h-12 border-b border-slate-400 mb-2" />
            <div className="font-semibold text-slate-800">ลงชื่อ ผู้อนุมัติ</div>
            <div className="text-slate-500 text-[11px] mt-0.5">(ผู้จัดการฝ่ายปฏิบัติการ)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
