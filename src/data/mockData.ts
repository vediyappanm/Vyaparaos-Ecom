// Mock data for VyaparOS — represents one demo tenant: "Sharma General Store"

export const STORE = {
  name: "Sharma General Store",
  ownerName: "Rajesh Sharma",
  address: "12, MG Road, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560038",
  phone: "+91 98450 12345",
  email: "rajesh@sharmastore.in",
  gstin: "29ABCDE1234F1Z5",
  upiId: "rajeshsharma@okhdfcbank",
  invoicePrefix: "SGS",
  stateCode: "29", // Karnataka
};

export type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  hsnCode: string;
  unit: string;
  mrp: number;
  price: number;
  taxRate: number; // GST %
  stock: number;
  lowStockAlert: number;
  image: string;
  isActive: boolean;
};

export const CATEGORIES = [
  "Groceries", "Beverages", "Snacks", "Dairy", "Personal Care", "Household",
];

const img = (q: string) => `https://images.unsplash.com/${q}?w=300&h=300&fit=crop`;

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Tata Salt 1kg", category: "Groceries", sku: "GRC-001", hsnCode: "2501", unit: "pkt", mrp: 28, price: 26, taxRate: 5, stock: 142, lowStockAlert: 20, image: img("photo-1518110925495-b37653f102e3"), isActive: true },
  { id: "p2", name: "Aashirvaad Atta 5kg", category: "Groceries", sku: "GRC-002", hsnCode: "1101", unit: "bag", mrp: 320, price: 295, taxRate: 5, stock: 38, lowStockAlert: 10, image: img("photo-1574323347407-f5e1ad6d020b"), isActive: true },
  { id: "p3", name: "India Gate Basmati 1kg", category: "Groceries", sku: "GRC-003", hsnCode: "1006", unit: "pkt", mrp: 185, price: 169, taxRate: 5, stock: 67, lowStockAlert: 15, image: img("photo-1586201375761-83865001e31c"), isActive: true },
  { id: "p4", name: "Amul Butter 500g", category: "Dairy", sku: "DRY-001", hsnCode: "0405", unit: "pkt", mrp: 280, price: 270, taxRate: 12, stock: 8, lowStockAlert: 12, image: img("photo-1589985270826-4b7bb135bc9d"), isActive: true },
  { id: "p5", name: "Amul Gold Milk 1L", category: "Dairy", sku: "DRY-002", hsnCode: "0401", unit: "pkt", mrp: 68, price: 66, taxRate: 0, stock: 95, lowStockAlert: 30, image: img("photo-1550583724-b2692b85b150"), isActive: true },
  { id: "p6", name: "Maggi Noodles 70g", category: "Snacks", sku: "SNK-001", hsnCode: "1902", unit: "pkt", mrp: 14, price: 13, taxRate: 18, stock: 320, lowStockAlert: 50, image: img("photo-1612927601601-6638404737ce"), isActive: true },
  { id: "p7", name: "Lays Classic Salted 52g", category: "Snacks", sku: "SNK-002", hsnCode: "2005", unit: "pkt", mrp: 20, price: 18, taxRate: 12, stock: 4, lowStockAlert: 25, image: img("photo-1566478989037-eec170784d0b"), isActive: true },
  { id: "p8", name: "Coca-Cola 750ml", category: "Beverages", sku: "BEV-001", hsnCode: "2202", unit: "btl", mrp: 40, price: 38, taxRate: 28, stock: 76, lowStockAlert: 20, image: img("photo-1554866585-cd94860890b7"), isActive: true },
  { id: "p9", name: "Tata Tea Gold 250g", category: "Beverages", sku: "BEV-002", hsnCode: "0902", unit: "pkt", mrp: 165, price: 155, taxRate: 5, stock: 45, lowStockAlert: 15, image: img("photo-1597481499750-3e6b22637e12"), isActive: true },
  { id: "p10", name: "Colgate MaxFresh 150g", category: "Personal Care", sku: "PCR-001", hsnCode: "3306", unit: "tube", mrp: 110, price: 99, taxRate: 18, stock: 52, lowStockAlert: 15, image: img("photo-1559591935-c6c92c6cd09b"), isActive: true },
  { id: "p11", name: "Surf Excel Quick Wash 1kg", category: "Household", sku: "HSE-001", hsnCode: "3402", unit: "pkt", mrp: 240, price: 220, taxRate: 18, stock: 28, lowStockAlert: 10, image: img("photo-1610557892470-55d9e80c0bce"), isActive: true },
  { id: "p12", name: "Vim Dishwash Bar 200g", category: "Household", sku: "HSE-002", hsnCode: "3401", unit: "pc", mrp: 22, price: 20, taxRate: 18, stock: 180, lowStockAlert: 40, image: img("photo-1585421514738-01798e348b17"), isActive: true },
];

// Sales trend (last 14 days)
export const SALES_TREND = [
  { date: "12 Apr", sales: 18420, orders: 47 },
  { date: "13 Apr", sales: 22150, orders: 53 },
  { date: "14 Apr", sales: 19870, orders: 49 },
  { date: "15 Apr", sales: 25340, orders: 61 },
  { date: "16 Apr", sales: 28920, orders: 68 },
  { date: "17 Apr", sales: 31250, orders: 72 },
  { date: "18 Apr", sales: 26780, orders: 64 },
  { date: "19 Apr", sales: 23410, orders: 56 },
  { date: "20 Apr", sales: 29870, orders: 71 },
  { date: "21 Apr", sales: 33420, orders: 78 },
  { date: "22 Apr", sales: 35120, orders: 82 },
  { date: "23 Apr", sales: 30890, orders: 73 },
  { date: "24 Apr", sales: 34560, orders: 80 },
  { date: "25 Apr", sales: 27340, orders: 64 },
];

export const TOP_PRODUCTS = [
  { name: "Maggi Noodles", sold: 248 },
  { name: "Amul Milk 1L", sold: 192 },
  { name: "Tata Salt 1kg", sold: 167 },
  { name: "Coca-Cola 750ml", sold: 134 },
  { name: "Aashirvaad Atta", sold: 98 },
];

export const RECENT_ORDERS = [
  { id: "SGS-1042", customer: "Priya Verma", phone: "98765 43210", items: 6, total: 842, status: "Delivered", payment: "UPI", time: "2 min ago" },
  { id: "SGS-1041", customer: "Walk-in", phone: "—", items: 3, total: 156, status: "Confirmed", payment: "Cash", time: "12 min ago" },
  { id: "SGS-1040", customer: "Anil Kumar", phone: "98123 45678", items: 11, total: 2340, status: "Packed", payment: "UPI", time: "28 min ago" },
  { id: "SGS-1039", customer: "Meena Iyer", phone: "98234 56789", items: 4, total: 487, status: "Delivered", payment: "Card", time: "1 hr ago" },
  { id: "SGS-1038", customer: "Walk-in", phone: "—", items: 2, total: 84, status: "Delivered", payment: "Cash", time: "2 hrs ago" },
  { id: "SGS-1037", customer: "Rohit Mehra", phone: "97654 32198", items: 8, total: 1620, status: "Pending", payment: "Credit", time: "3 hrs ago" },
];

export const KPIS = {
  todaySales: 27340,
  todayOrders: 64,
  pendingDues: 18450,
  lowStockCount: 3,
};
