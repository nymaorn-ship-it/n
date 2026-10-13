import { Product, PurchaseOrder, StockTransaction, StaffMember } from '../types/inventory';

const STORAGE_KEYS = {
  PRODUCTS: 'stockmaster_products',
  POS: 'stockmaster_purchase_orders',
  TRANSACTIONS: 'stockmaster_transactions',
  STAFF: 'stockmaster_staff',
  SHEET_ID: 'stockmaster_google_sheet_id',
};

// Seed realistic data for instant demonstration
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'SKU-COF-01',
    name: 'เมล็ดกาแฟ อาราบิก้า คั่วกลาง 500g',
    category: 'เครื่องดื่ม/วัตถุดิบ',
    unit: 'ถุง',
    quantity: 85,
    minStock: 20,
    location: 'A-01-02',
    defaultSupplier: 'บริษัท นอร์ทเทิร์น คอฟฟี่ จำกัด',
    expiryDate: '2026-12-15',
    costPrice: 180,
    sellingPrice: 320,
    updatedAt: '2026-10-10T08:30:00Z',
  },
  {
    id: 'prod-2',
    sku: 'SKU-MLK-02',
    name: 'นมสดพาสเจอร์ไรส์ เมจิ 2,000 มล.',
    category: 'วัตถุดิบสด',
    unit: 'แกลลอน',
    quantity: 8,
    minStock: 15, // Low stock!
    location: 'CHILL-01',
    defaultSupplier: 'ซีพี-เมจิ จำกัด',
    expiryDate: '2026-10-25', // Expiring soon (within 12 days)!
    costPrice: 95,
    sellingPrice: 140,
    updatedAt: '2026-10-12T10:15:00Z',
  },
  {
    id: 'prod-3',
    sku: 'SKU-SYR-03',
    name: 'ไซรัปคาราเมล โมแนง 700 มล.',
    category: 'เครื่องดื่ม/วัตถุดิบ',
    unit: 'ขวด',
    quantity: 4,
    minStock: 10, // Low stock!
    location: 'B-02-01',
    defaultSupplier: 'สยาม ไซรัป ดิสทริบิวชั่น',
    expiryDate: '2027-04-18',
    costPrice: 280,
    sellingPrice: 420,
    updatedAt: '2026-10-11T14:20:00Z',
  },
  {
    id: 'prod-4',
    sku: 'SKU-CUP-04',
    name: 'แก้วกระดาษ ร้อน 16 ออนซ์ (แถวละ 50 ชิ้น)',
    category: 'บรรจุภัณฑ์',
    unit: 'แถว',
    quantity: 0, // Out of stock!
    minStock: 25,
    location: 'C-04-03',
    defaultSupplier: 'บริษัท กรีน แพคเกจจิ้ง จำกัด',
    expiryDate: '2028-01-01',
    costPrice: 65,
    sellingPrice: 95,
    updatedAt: '2026-10-09T16:00:00Z',
  },
  {
    id: 'prod-5',
    sku: 'SKU-TEA-05',
    name: 'ใบชาเขียวมัทฉะ อูจิ เกรดพรีเมียม 100g',
    category: 'เครื่องดื่ม/วัตถุดิบ',
    unit: 'กระป๋อง',
    quantity: 12,
    minStock: 5,
    location: 'A-02-04',
    defaultSupplier: 'ยูเนี่ยน เจแปน ที จำกัด',
    expiryDate: '2026-11-05', // Expiring soon (within ~23 days)!
    costPrice: 450,
    sellingPrice: 690,
    updatedAt: '2026-10-12T11:00:00Z',
  },
  {
    id: 'prod-6',
    sku: 'SKU-STR-06',
    name: 'หลอดไบโอพลาสติกย่อยสลายได้ (ห่อ 100 เส้น)',
    category: 'บรรจุภัณฑ์',
    unit: 'ห่อ',
    quantity: 60,
    minStock: 30,
    location: 'C-01-01',
    defaultSupplier: 'บริษัท กรีน แพคเกจจิ้ง จำกัด',
    expiryDate: '2028-12-31',
    costPrice: 35,
    sellingPrice: 55,
    updatedAt: '2026-10-08T09:00:00Z',
  },
  {
    id: 'prod-7',
    sku: 'SKU-BAK-07',
    name: 'แป้งเค้กญี่ปุ่น ตราพัดโบก 1 กก.',
    category: 'เบเกอรี่',
    unit: 'ถุง',
    quantity: 5,
    minStock: 10, // Low stock!
    location: 'B-01-05',
    defaultSupplier: 'สหไทย ฟลาวมิลล์ จำกัด',
    expiryDate: '2026-10-30', // Expiring soon!
    costPrice: 42,
    sellingPrice: 65,
    updatedAt: '2026-10-05T13:45:00Z',
  },
];

const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-1001',
    supplier: 'บริษัท นอร์ทเทิร์น คอฟฟี่ จำกัด',
    orderDate: '2026-10-01',
    expectedDeliveryDate: '2026-10-05',
    status: 'partially_received',
    items: [
      {
        sku: 'SKU-COF-01',
        productName: 'เมล็ดกาแฟ อาราบิก้า คั่วกลาง 500g',
        orderedQuantity: 100,
        receivedQuantity: 60,
        remainingQuantity: 40,
        expiryDate: '2026-12-15',
        unitCost: 180,
      },
    ],
    notes: 'จัดส่งรอบสองวันพุธถัดไป',
  },
  {
    id: 'po-2',
    poNumber: 'PO-2026-1002',
    supplier: 'ซีพี-เมจิ จำกัด',
    orderDate: '2026-10-08',
    expectedDeliveryDate: '2026-10-10',
    status: 'pending',
    items: [
      {
        sku: 'SKU-MLK-02',
        productName: 'นมสดพาสเจอร์ไรส์ เมจิ 2,000 มล.',
        orderedQuantity: 30,
        receivedQuantity: 0,
        remainingQuantity: 30,
        expiryDate: '2026-10-25',
        unitCost: 95,
      },
    ],
    notes: 'ควบคุมอุณหภูมิระหว่างขนส่ง 2-4 องศา',
  },
  {
    id: 'po-3',
    poNumber: 'PO-2026-1003',
    supplier: 'บริษัท กรีน แพคเกจจิ้ง จำกัด',
    orderDate: '2026-09-25',
    expectedDeliveryDate: '2026-09-28',
    status: 'locked', // Completed & locked
    items: [
      {
        sku: 'SKU-CUP-04',
        productName: 'แก้วกระดาษ ร้อน 16 ออนซ์ (แถวละ 50 ชิ้น)',
        orderedQuantity: 50,
        receivedQuantity: 50,
        remainingQuantity: 0,
        expiryDate: '2028-01-01',
        unitCost: 65,
      },
    ],
    notes: 'รับสินค้าและเบิกหมดเรียบร้อยแล้ว',
  },
  {
    id: 'po-4',
    poNumber: 'PO-2026-1004',
    supplier: 'สยาม ไซรัป ดิสทริบิวชั่น',
    orderDate: '2026-10-10',
    expectedDeliveryDate: '2026-10-14',
    status: 'pending',
    items: [
      {
        sku: 'SKU-SYR-03',
        productName: 'ไซรัปคาราเมล โมแนง 700 มล.',
        orderedQuantity: 20,
        receivedQuantity: 0,
        remainingQuantity: 20,
        expiryDate: '2027-04-18',
        unitCost: 280,
      },
    ],
    notes: 'รอบเร่งด่วนสำหรับสาขาหลัก',
  },
];

const INITIAL_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'tx-1',
    type: 'IN',
    sku: 'SKU-COF-01',
    productName: 'เมล็ดกาแฟ อาราบิก้า คั่วกลาง 500g',
    quantity: 60,
    poNumber: 'PO-2026-1001',
    supplier: 'บริษัท นอร์ทเทิร์น คอฟฟี่ จำกัด',
    expiryDate: '2026-12-15',
    recorderName: 'สมชาย ใจดี (หัวหน้าคลัง)',
    note: 'รับเข้าตามรอบ PO-2026-1001 ล็อต 1',
    timestamp: '2026-10-05T09:30:00Z',
  },
  {
    id: 'tx-2',
    type: 'OUT',
    sku: 'SKU-COF-01',
    productName: 'เมล็ดกาแฟ อาราบิก้า คั่วกลาง 500g',
    quantity: 15,
    poNumber: 'PO-2026-1001',
    supplier: 'บริษัท นอร์ทเทิร์น คอฟฟี่ จำกัด',
    recorderName: 'วิภาวรรณ สดใส (เจ้าหน้าที่คลัง)',
    note: 'เบิกจ่ายหน้าร้านสาขา 1 ประจำสัปดาห์',
    timestamp: '2026-10-08T14:15:00Z',
  },
  {
    id: 'tx-3',
    type: 'OUT',
    sku: 'SKU-MLK-02',
    productName: 'นมสดพาสเจอร์ไรส์ เมจิ 2,000 มล.',
    quantity: 12,
    poNumber: 'PO-2026-0955',
    supplier: 'ซีพี-เมจิ จำกัด',
    expiryDate: '2026-10-25',
    recorderName: 'สมชาย ใจดี (หัวหน้าคลัง)',
    note: 'เบิกผสมเครื่องดื่มประจำวัน',
    timestamp: '2026-10-11T08:00:00Z',
  },
  {
    id: 'tx-4',
    type: 'IN',
    sku: 'SKU-STR-06',
    productName: 'หลอดไบโอพลาสติกย่อยสลายได้ (ห่อ 100 เส้น)',
    quantity: 50,
    poNumber: 'PO-2026-0988',
    supplier: 'บริษัท กรีน แพคเกจจิ้ง จำกัด',
    expiryDate: '2028-12-31',
    recorderName: 'เอกชัย มีทรัพย์ (ฝ่ายจัดซื้อ)',
    note: 'รับเข้าสต๊อกกลาง',
    timestamp: '2026-10-04T11:20:00Z',
  },
  {
    id: 'tx-5',
    type: 'OUT',
    sku: 'SKU-CUP-04',
    productName: 'แก้วกระดาษ ร้อน 16 ออนซ์ (แถวละ 50 ชิ้น)',
    quantity: 35,
    poNumber: 'PO-2026-1003',
    supplier: 'บริษัท กรีน แพคเกจจิ้ง จำกัด',
    recorderName: 'วิภาวรรณ สดใส (เจ้าหน้าที่คลัง)',
    note: 'เบิกใช้สต๊อกหมดเกลี้ยง ต้องสั่งเพิ่มด่วน',
    timestamp: '2026-10-09T16:00:00Z',
  },
];

const INITIAL_STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'สมชาย ใจดี', role: 'หัวหน้าคลังสินค้า', isActive: true },
  { id: 'staff-2', name: 'วิภาวรรณ สดใส', role: 'เจ้าหน้าที่คลังสินค้า', isActive: true },
  { id: 'staff-3', name: 'เอกชัย มีทรัพย์', role: 'เจ้าหน้าที่จัดซื้อ/รับสินค้า', isActive: true },
  { id: 'staff-4', name: 'ณัชชา เรืองโรจน์', role: 'ผู้จัดการสาขา', isActive: true },
];

export const StorageService = {
  getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getPurchaseOrders(): PurchaseOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.POS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(INITIAL_POS));
      return INITIAL_POS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_POS;
    }
  },

  savePurchaseOrders(pos: PurchaseOrder[]) {
    localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(pos));
  },

  getTransactions(): StockTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(transactions: StockTransaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getStaff(): StaffMember[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STAFF;
    }
  },

  saveStaff(staff: StaffMember[]) {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  },

  getGoogleSheetId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  },

  saveGoogleSheetId(id: string) {
    localStorage.setItem(STORAGE_KEYS.SHEET_ID, id);
  },

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(INITIAL_POS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
  },
};
