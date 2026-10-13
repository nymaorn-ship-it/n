import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, PurchaseOrder, StockTransaction } from '../types/inventory';

// Ensure single Firebase instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not cached, wait or request re-auth if needed
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Creates a dedicated inventory spreadsheet in the user's Google Drive
 */
export const createInventorySpreadsheet = async (
  accessToken: string,
  title = `StockMaster - รายงานสต็อกสินค้า (${new Date().toLocaleDateString('th-TH')})`
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'สต็อกสินค้าคงเหลือ',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'ประวัติรับเข้า-เบิกออก',
          gridProperties: { rowCount: 200, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'รายการใบสั่งซื้อ PO',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Sheets ใหม่ได้');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
};

/**
 * Synchronize products, transactions, and POs into Google Sheets
 */
export const syncDataToGoogleSheets = async (
  accessToken: string,
  spreadsheetId: string,
  products: Product[],
  transactions: StockTransaction[],
  pos: PurchaseOrder[]
) => {
  // Format Products tab
  const productRows = [
    ['รหัสสินค้า (SKU)', 'ชื่อสินค้า', 'หมวดหมู่', 'คงเหลือ', 'หน่วย', 'จุดเตือนขั้นต่ำ', 'ผู้จำหน่ายหลัก', 'วันหมดอายุ', 'ตำแหน่งจัดเก็บ', 'อัปเดตล่าสุด'],
    ...products.map((p) => [
      p.sku,
      p.name,
      p.category,
      p.quantity,
      p.unit,
      p.minStock,
      p.defaultSupplier || '-',
      p.expiryDate || '-',
      p.location || '-',
      new Date(p.updatedAt).toLocaleString('th-TH'),
    ]),
  ];

  // Format Transactions tab
  const transactionRows = [
    ['วัน-เวลา', 'ประเภท', 'รหัส SKU', 'ชื่อสินค้า', 'จำนวน', 'เลขที่ PO', 'ผู้ขาย/ผู้จัดส่ง', 'วันหมดอายุ', 'ผู้ลงบันทึก', 'หมายเหตุ'],
    ...transactions.map((tx) => [
      new Date(tx.timestamp).toLocaleString('th-TH'),
      tx.type === 'IN' ? 'รับเข้า (+)' : 'เบิกออก (-)',
      tx.sku,
      tx.productName,
      tx.type === 'IN' ? tx.quantity : -tx.quantity,
      tx.poNumber || '-',
      tx.supplier || '-',
      tx.expiryDate || '-',
      tx.recorderName,
      tx.note || '-',
    ]),
  ];

  // Format POs tab
  const poRows = [
    ['เลขที่ PO', 'ผู้ขาย/ซัพพลายเออร์', 'วันที่สั่ง', 'กำหนดส่ง', 'สถานะ', 'รหัสสินค้า', 'จำนวนที่สั่ง', 'รับแล้ว', 'คงเหลือเบิกได้', 'หมายเหตุ'],
    ...pos.flatMap((po) =>
      po.items.map((item) => [
        po.poNumber,
        po.supplier,
        po.orderDate,
        po.expectedDeliveryDate || '-',
        po.status === 'locked' ? 'ปิดยอด/ล็อกแล้ว' : po.status === 'partially_received' ? 'รับบางส่วน' : 'รอดำเนินการ',
        item.sku,
        item.orderedQuantity,
        item.receivedQuantity,
        item.remainingQuantity,
        po.notes || '-',
      ])
    ),
  ];

  const updateData = [
    {
      range: 'สต็อกสินค้าคงเหลือ!A1:J' + Math.max(productRows.length, 2),
      values: productRows,
    },
    {
      range: 'ประวัติรับเข้า-เบิกออก!A1:J' + Math.max(transactionRows.length, 2),
      values: transactionRows,
    },
    {
      range: 'รายการใบสั่งซื้อ PO!A1:J' + Math.max(poRows.length, 2),
      values: poRows,
    },
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updateData,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถอัปเดตข้อมูลลงใน Google Sheets ได้');
  }

  return await res.json();
};
