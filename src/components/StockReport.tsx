import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Printer,
  Sheet,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { Product, StockTransaction } from '../types/inventory';

interface StockReportProps {
  products: Product[];
  transactions: StockTransaction[];
  onOpenGoogleModal: () => void;
  onPrintReport: (monthKey: string) => void;
}

export const StockReport: React.FC<StockReportProps> = ({
  products,
  transactions,
  onOpenGoogleModal,
  onPrintReport,
}) => {
  // Available Months from transactions and current year
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    const thaiMonthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];

    // Seed recent 6 months
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthNum}`;
      const label = `${thaiMonthNames[d.getMonth()]} ${year + 543}`;
      monthsMap.set(key, label);
    }

    // Also include any months from transactions
    transactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthNum}`;
      const label = `${thaiMonthNames[d.getMonth()]} ${year + 543}`;
      monthsMap.set(key, label);
    });

    return Array.from(monthsMap.entries()).map(([key, label]) => ({ key, label }));
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths[0]?.key || '2026-10'
  );

  // Active hover/touch index for the vertical guide line on the chart
  const [activeGuidePoint, setActiveGuidePoint] = useState<number | null>(null);

  // Transactions filtered by selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.timestamp.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Aggregate monthly stats
  const monthlyMetrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    monthlyTransactions.forEach((tx) => {
      if (tx.type === 'IN') {
        totalIn += tx.quantity;
      } else {
        totalOut += tx.quantity;
      }
    });

    const netChange = totalIn - totalOut;

    return {
      totalIn,
      totalOut,
      netChange,
      txCount: monthlyTransactions.length,
    };
  }, [monthlyTransactions]);

  // Per-product breakdown for selected month
  const productBreakdown = useMemo(() => {
    return products.map((prod) => {
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
        currentStock: prod.quantity,
      };
    });
  }, [products, monthlyTransactions]);

  // Generate 6-month trend data for the interactive line chart
  const trendData = useMemo(() => {
    const list = [...availableMonths].reverse(); // Oldest to newest
    return list.map((m) => {
      const txs = transactions.filter((tx) => tx.timestamp.startsWith(m.key));
      const inQty = txs
        .filter((t) => t.type === 'IN')
        .reduce((sum, t) => sum + t.quantity, 0);
      const outQty = txs
        .filter((t) => t.type === 'OUT')
        .reduce((sum, t) => sum + t.quantity, 0);
      const net = inQty - outQty;

      return {
        key: m.key,
        label: m.label.split(' ')[0], // short month name
        fullLabel: m.label,
        inQty,
        outQty,
        net,
      };
    });
  }, [availableMonths, transactions]);

  // Max value for scaling SVG chart
  const maxChartValue = useMemo(() => {
    let max = 50;
    trendData.forEach((d) => {
      if (d.inQty > max) max = d.inQty;
      if (d.outQty > max) max = d.outQty;
    });
    return Math.ceil(max * 1.25);
  }, [trendData]);

  // CSV Export Function (with UTF-8 BOM for Excel support)
  const handleExportCSV = () => {
    const header = [
      'รหัสสินค้า (SKU)',
      'ชื่อสินค้า',
      'หมวดหมู่',
      'ยอดรับเข้าในเดือน',
      'ยอดเบิกออกในเดือน',
      'ผลต่างสุทธิ',
      'คงเหลือปัจจุบัน',
      'หน่วย',
    ];

    const rows = productBreakdown.map((item) => [
      `"${item.product.sku}"`,
      `"${item.product.name}"`,
      `"${item.product.category}"`,
      item.inQty,
      item.outQty,
      item.net,
      item.currentStock,
      `"${item.product.unit}"`,
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM
      [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `รายงานสต็อก_${selectedMonth}_StockMaster.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart SVG Coordinates calculation
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 30;

  const pointsIn = trendData.map((d, index) => {
    const x = paddingX + (index / (trendData.length - 1 || 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.inQty / maxChartValue) * (chartHeight - 2 * paddingY);
    return { x, y, data: d };
  });

  const pointsOut = trendData.map((d, index) => {
    const x = paddingX + (index / (trendData.length - 1 || 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.outQty / maxChartValue) * (chartHeight - 2 * paddingY);
    return { x, y, data: d };
  });

  const pathIn = pointsIn.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const pathOut = pointsOut.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  return (
    <div className="space-y-6">
      {/* Top Header & Month Filter & Export Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>รายงานสรุปสต็อกสินค้าประจำเดือน</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปยอดรับเข้า, เบิกจ่าย, และคงเหลือสุทธิ พร้อมส่งออกรายงาน
          </p>
        </div>

        {/* Month Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="ดาวน์โหลดไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={() => onPrintReport(selectedMonth)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="พิมพ์หรือบันทึกเป็น PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>

          {/* Google Sheets Sync Button */}
          <button
            onClick={onOpenGoogleModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="ซิงค์ไปยัง Google Sheets"
          >
            <Sheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>ส่งออกไปยัง Sheets</span>
          </button>
        </div>
      </div>

      {/* Monthly Trend Chart with Interactive Vertical Guide Line */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>กราฟแนวโน้มการรับเข้าและเบิกจ่าย (6 เดือนย้อนหลัง)</span>
            </h3>
            <span className="text-xs text-slate-400">
              แตะหรือเลื่อนเมาส์บนจุดข้อมูลเพื่อดูรายละเอียดพร้อมเส้นแนวดิ่งนำสายตา
            </span>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>ยอดรับเข้า (Inflow)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span>ยอดเบิกออก (Outflow)</span>
            </div>
          </div>
        </div>

        {/* SVG Line Chart Canvas */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-56 select-none"
            onMouseLeave={() => setActiveGuidePoint(null)}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight - paddingY - ratio * (chartHeight - 2 * paddingY);
              const val = Math.round(ratio * maxChartValue);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Inflow Line & Area */}
            <path
              d={pathIn}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Outflow Line & Area */}
            <path
              d={pathOut}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Vertical Guide Line on Hover/Touch */}
            {activeGuidePoint !== null && pointsIn[activeGuidePoint] && (
              <g>
                <line
                  x1={pointsIn[activeGuidePoint].x}
                  y1={paddingY - 10}
                  x2={pointsIn[activeGuidePoint].x}
                  y2={chartHeight - paddingY}
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              </g>
            )}

            {/* Interactive Points and Touch Area */}
            {pointsIn.map((pt, i) => {
              const ptOut = pointsOut[i];
              const isHovered = activeGuidePoint === i;

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveGuidePoint(i)}
                  onTouchStart={() => setActiveGuidePoint(i)}
                  onClick={() => setSelectedMonth(pt.data.key)}
                >
                  {/* Invisible broad hitbox for easy touch on mobile */}
                  <rect
                    x={pt.x - 25}
                    y={0}
                    width={50}
                    height={chartHeight}
                    fill="transparent"
                  />

                  {/* Inflow Point */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all"
                  />

                  {/* Outflow Point */}
                  <circle
                    cx={ptOut.x}
                    cy={ptOut.y}
                    r={isHovered ? 6 : 4}
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all"
                  />

                  {/* X-Axis Month Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className={`text-[11px] font-semibold ${
                      selectedMonth === pt.data.key
                        ? 'fill-purple-700 font-bold'
                        : 'fill-slate-500'
                    }`}
                  >
                    {pt.data.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip during Hover */}
          {activeGuidePoint !== null && pointsIn[activeGuidePoint] && (
            <div
              className="absolute top-2 pointer-events-none bg-slate-900/90 backdrop-blur-xs text-white px-3 py-2 rounded-xl text-xs shadow-lg transform -translate-x-1/2 z-10 space-y-1"
              style={{
                left: `${(pointsIn[activeGuidePoint].x / chartWidth) * 100}%`,
              }}
            >
              <div className="font-bold border-b border-slate-700 pb-1">
                {trendData[activeGuidePoint].fullLabel}
              </div>
              <div className="flex items-center justify-between gap-4 text-emerald-400">
                <span>รับเข้า:</span>
                <span className="font-bold font-mono">
                  +{trendData[activeGuidePoint].inQty} ชิ้น
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-rose-400">
                <span>เบิกออก:</span>
                <span className="font-bold font-mono">
                  -{trendData[activeGuidePoint].outQty} ชิ้น
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Summary Bar Directly Beneath Chart (แถบสรุปข้อมูลของเดือนที่เลือกอยู่ด้านล่างกราฟ) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
            {/* 1. ยอดรับเข้ารวม */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block">
                ยอดรับเข้ารวมประจำเดือน
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-emerald-600 font-bold text-xl">
                <ArrowDownLeft className="w-4 h-4" />
                <span>+{monthlyMetrics.totalIn.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-normal">ชิ้น</span>
              </div>
            </div>

            {/* 2. ยอดเบิกรวม */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block">
                ยอดเบิกจ่ายรวมประจำเดือน
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-rose-600 font-bold text-xl">
                <ArrowUpRight className="w-4 h-4" />
                <span>-{monthlyMetrics.totalOut.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-normal">ชิ้น</span>
              </div>
            </div>

            {/* 3. ยอดคงเหลือสุทธิ / ผลต่าง */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block">
                ผลต่างสุทธิ (รับเข้า - เบิก)
              </span>
              <div
                className={`flex items-baseline gap-1 mt-1 font-bold text-xl ${
                  monthlyMetrics.netChange >= 0 ? 'text-blue-600' : 'text-amber-600'
                }`}
              >
                <span>
                  {monthlyMetrics.netChange >= 0
                    ? `+${monthlyMetrics.netChange.toLocaleString()}`
                    : monthlyMetrics.netChange.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-normal">ชิ้น</span>
              </div>
            </div>

            {/* 4. จำนวนรายการบันทึก */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block">
                จำนวนครั้งที่ทำรายการ
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-slate-900 font-bold text-xl">
                <span>{monthlyMetrics.txCount}</span>
                <span className="text-xs text-slate-500 font-normal">รายการ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product-by-product breakdown table for selected month */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>ตารางสรุปการเคลื่อนไหวรายสินค้า ({selectedMonth})</span>
          </h3>
          <span className="text-xs text-slate-400">{products.length} รายการ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-4">รหัส / ชื่อสินค้า</th>
                <th className="py-3 px-4 text-center">รับเข้าในเดือน (+)</th>
                <th className="py-3 px-4 text-center">เบิกออกในเดือน (-)</th>
                <th className="py-3 px-4 text-center">ผลต่างสุทธิ</th>
                <th className="py-3 px-4 text-right">สต็อกคงเหลือปัจจุบัน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productBreakdown.map((row) => (
                <tr key={row.product.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold mr-2 border border-slate-200">
                      {row.product.sku}
                    </span>
                    <span className="font-semibold text-slate-900">{row.product.name}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-semibold ${
                        row.inQty > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {row.inQty > 0 ? `+${row.inQty}` : '0'} {row.product.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-semibold ${
                        row.outQty > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {row.outQty > 0 ? `-${row.outQty}` : '0'} {row.product.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-bold ${
                        row.net > 0
                          ? 'text-emerald-700'
                          : row.net < 0
                          ? 'text-rose-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {row.net > 0 ? `+${row.net}` : row.net}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-bold ${
                        row.currentStock <= row.product.minStock
                          ? 'text-amber-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {row.currentStock} {row.product.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
