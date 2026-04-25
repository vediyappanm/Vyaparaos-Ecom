// Mock data for VyaparOS — represents one demo tenant: "Sharma Royal Mart"

export const STORE = {
  name: "Sharma Royal Mart",
  ownerName: "Rajesh Sharma",
  address: "12, MG Road, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560038",
  phone: "+91 98450 12345",
  email: "rajesh@sharmaroyal.in",
  gstin: "29ABCDE1234F1Z5",
  upiId: "rajeshsharma@okhdfcbank",
  invoicePrefix: "SRM",
  stateCode: "29",
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
  purchasePrice: number;
  taxRate: number;
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
  { id: "p1", name: "Tata Salt 1kg", category: "Groceries", sku: "GRC-001", hsnCode: "2501", unit: "pkt", mrp: 28, price: 26, purchasePrice: 22, taxRate: 5, stock: 142, lowStockAlert: 20, image: img("photo-1518110925495-b37653f102e3"), isActive: true },
  { id: "p2", name: "Aashirvaad Atta 5kg", category: "Groceries", sku: "GRC-002", hsnCode: "1101", unit: "bag", mrp: 320, price: 295, purchasePrice: 260, taxRate: 5, stock: 38, lowStockAlert: 10, image: img("photo-1574323347407-f5e1ad6d020b"), isActive: true },
  { id: "p3", name: "India Gate Basmati 1kg", category: "Groceries", sku: "GRC-003", hsnCode: "1006", unit: "pkt", mrp: 185, price: 169, purchasePrice: 142, taxRate: 5, stock: 67, lowStockAlert: 15, image: img("photo-1586201375761-83865001e31c"), isActive: true },
  { id: "p4", name: "Amul Butter 500g", category: "Dairy", sku: "DRY-001", hsnCode: "0405", unit: "pkt", mrp: 280, price: 270, purchasePrice: 235, taxRate: 12, stock: 8, lowStockAlert: 12, image: img("photo-1589985270826-4b7bb135bc9d"), isActive: true },
  { id: "p5", name: "Amul Gold Milk 1L", category: "Dairy", sku: "DRY-002", hsnCode: "0401", unit: "pkt", mrp: 68, price: 66, purchasePrice: 58, taxRate: 0, stock: 95, lowStockAlert: 30, image: img("photo-1550583724-b2692b85b150"), isActive: true },
  { id: "p6", name: "Maggi Noodles 70g", category: "Snacks", sku: "SNK-001", hsnCode: "1902", unit: "pkt", mrp: 14, price: 13, purchasePrice: 10, taxRate: 18, stock: 320, lowStockAlert: 50, image: img("photo-1612927601601-6638404737ce"), isActive: true },
  { id: "p7", name: "Lays Classic Salted 52g", category: "Snacks", sku: "SNK-002", hsnCode: "2005", unit: "pkt", mrp: 20, price: 18, purchasePrice: 14, taxRate: 12, stock: 4, lowStockAlert: 25, image: img("photo-1566478989037-eec170784d0b"), isActive: true },
  { id: "p8", name: "Coca-Cola 750ml", category: "Beverages", sku: "BEV-001", hsnCode: "2202", unit: "btl", mrp: 40, price: 38, purchasePrice: 30, taxRate: 28, stock: 76, lowStockAlert: 20, image: img("photo-1554866585-cd94860890b7"), isActive: true },
  { id: "p9", name: "Tata Tea Gold 250g", category: "Beverages", sku: "BEV-002", hsnCode: "0902", unit: "pkt", mrp: 165, price: 155, purchasePrice: 130, taxRate: 5, stock: 45, lowStockAlert: 15, image: img("photo-1597481499750-3e6b22637e12"), isActive: true },
  { id: "p10", name: "Colgate MaxFresh 150g", category: "Personal Care", sku: "PCR-001", hsnCode: "3306", unit: "tube", mrp: 110, price: 99, purchasePrice: 78, taxRate: 18, stock: 52, lowStockAlert: 15, image: img("photo-1559591935-c6c92c6cd09b"), isActive: true },
  { id: "p11", name: "Surf Excel Quick Wash 1kg", category: "Household", sku: "HSE-001", hsnCode: "3402", unit: "pkt", mrp: 240, price: 220, purchasePrice: 188, taxRate: 18, stock: 28, lowStockAlert: 10, image: img("photo-1610557892470-55d9e80c0bce"), isActive: true },
  { id: "p12", name: "Vim Dishwash Bar 200g", category: "Household", sku: "HSE-002", hsnCode: "3401", unit: "pc", mrp: 22, price: 20, purchasePrice: 15, taxRate: 18, stock: 180, lowStockAlert: 40, image: img("photo-1585421514738-01798e348b17"), isActive: true },
];

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

export type OrderStatus = "Pending" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Cancelled";
export type Order = {
  id: string;
  customer: string;
  phone: string;
  date: string;
  items: number;
  channel: "Walk-in" | "Online" | "Phone";
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  payment: "Cash" | "UPI" | "Card" | "Credit";
  paymentStatus: "Paid" | "Pending" | "Partial";
  time: string;
};

export const ORDERS: Order[] = [
  { id: "SRM-1042", customer: "Priya Verma", phone: "98765 43210", date: "25 Apr 2026", items: 6, channel: "Online", subtotal: 752, tax: 90, total: 842, status: "Delivered", payment: "UPI", paymentStatus: "Paid", time: "2 min ago" },
  { id: "SRM-1041", customer: "Walk-in", phone: "—", date: "25 Apr 2026", items: 3, channel: "Walk-in", subtotal: 138, tax: 18, total: 156, status: "Confirmed", payment: "Cash", paymentStatus: "Paid", time: "12 min ago" },
  { id: "SRM-1040", customer: "Anil Kumar", phone: "98123 45678", date: "25 Apr 2026", items: 11, channel: "Phone", subtotal: 2090, tax: 250, total: 2340, status: "Packed", payment: "UPI", paymentStatus: "Paid", time: "28 min ago" },
  { id: "SRM-1039", customer: "Meena Iyer", phone: "98234 56789", date: "25 Apr 2026", items: 4, channel: "Walk-in", subtotal: 432, tax: 55, total: 487, status: "Delivered", payment: "Card", paymentStatus: "Paid", time: "1 hr ago" },
  { id: "SRM-1038", customer: "Walk-in", phone: "—", date: "25 Apr 2026", items: 2, channel: "Walk-in", subtotal: 76, tax: 8, total: 84, status: "Delivered", payment: "Cash", paymentStatus: "Paid", time: "2 hrs ago" },
  { id: "SRM-1037", customer: "Rohit Mehra", phone: "97654 32198", date: "25 Apr 2026", items: 8, channel: "Phone", subtotal: 1450, tax: 170, total: 1620, status: "Pending", payment: "Credit", paymentStatus: "Pending", time: "3 hrs ago" },
  { id: "SRM-1036", customer: "Lakshmi Nair", phone: "99887 76655", date: "24 Apr 2026", items: 5, channel: "Online", subtotal: 980, tax: 120, total: 1100, status: "Shipped", payment: "UPI", paymentStatus: "Paid", time: "Yesterday" },
  { id: "SRM-1035", customer: "Kiran Patel", phone: "98765 11223", date: "24 Apr 2026", items: 14, channel: "Phone", subtotal: 3120, tax: 380, total: 3500, status: "Delivered", payment: "Credit", paymentStatus: "Partial", time: "Yesterday" },
];

export const KPIS = {
  todaySales: 27340,
  todayOrders: 64,
  pendingDues: 18450,
  lowStockCount: 3,
  monthRevenue: 842500,
  monthExpenses: 312400,
  netProfit: 248600,
};

// === Parties (Customers + Vendors) ===
export type Party = {
  id: string; type: "Customer" | "Vendor"; name: string; phone: string;
  email?: string; gstin?: string; city: string; balance: number; // +ve = receivable, -ve = payable
  lastTxn: string;
};

export const PARTIES: Party[] = [
  { id: "c1", type: "Customer", name: "Priya Verma", phone: "98765 43210", email: "priya@gmail.com", city: "Bengaluru", balance: 0, lastTxn: "Today" },
  { id: "c2", type: "Customer", name: "Rohit Mehra", phone: "97654 32198", city: "Bengaluru", balance: 1620, lastTxn: "3 hrs ago" },
  { id: "c3", type: "Customer", name: "Kiran Patel", phone: "98765 11223", gstin: "29XYZAB5678C1Z2", city: "Mysuru", balance: 7800, lastTxn: "Yesterday" },
  { id: "c4", type: "Customer", name: "Anil Kumar", phone: "98123 45678", city: "Bengaluru", balance: 0, lastTxn: "Today" },
  { id: "c5", type: "Customer", name: "Lakshmi Nair", phone: "99887 76655", city: "Bengaluru", balance: 9030, lastTxn: "Yesterday" },
  { id: "v1", type: "Vendor", name: "Hindustan Distributors", phone: "98000 11111", gstin: "27ABCXY1234D1Z9", city: "Mumbai", balance: -45000, lastTxn: "2 days ago" },
  { id: "v2", type: "Vendor", name: "Karnataka Dairy Co.", phone: "98000 22222", city: "Bengaluru", balance: -12500, lastTxn: "3 days ago" },
  { id: "v3", type: "Vendor", name: "Snacks Wholesale Ltd", phone: "98000 33333", gstin: "29MNOPQ7890E1Z3", city: "Hubli", balance: -8200, lastTxn: "1 week ago" },
];

// === Stock movements ===
export type StockMovement = {
  id: string; date: string; productId: string; product: string;
  type: "Purchase" | "Sale" | "Adjustment" | "Return" | "Damage";
  qty: number; reference: string; notes?: string;
};

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: "m1", date: "25 Apr 2026", productId: "p1", product: "Tata Salt 1kg", type: "Sale", qty: -8, reference: "SRM-1042" },
  { id: "m2", date: "25 Apr 2026", productId: "p4", product: "Amul Butter 500g", type: "Sale", qty: -2, reference: "SRM-1040" },
  { id: "m3", date: "24 Apr 2026", productId: "p2", product: "Aashirvaad Atta 5kg", type: "Purchase", qty: 25, reference: "PUR-205" },
  { id: "m4", date: "24 Apr 2026", productId: "p7", product: "Lays Classic 52g", type: "Damage", qty: -3, reference: "ADJ-12", notes: "Crushed in transit" },
  { id: "m5", date: "23 Apr 2026", productId: "p6", product: "Maggi Noodles 70g", type: "Purchase", qty: 200, reference: "PUR-204" },
  { id: "m6", date: "23 Apr 2026", productId: "p5", product: "Amul Gold Milk 1L", type: "Sale", qty: -18, reference: "SRM-1037" },
  { id: "m7", date: "22 Apr 2026", productId: "p3", product: "India Gate Basmati 1kg", type: "Adjustment", qty: 5, reference: "ADJ-11", notes: "Stock audit correction" },
  { id: "m8", date: "22 Apr 2026", productId: "p8", product: "Coca-Cola 750ml", type: "Return", qty: 4, reference: "RET-09" },
];

// === Purchases ===
export type Purchase = {
  id: string; vendor: string; vendorId: string; date: string;
  items: number; subtotal: number; tax: number; total: number;
  paid: number; status: "Draft" | "Received" | "Partial" | "Paid";
};

export const PURCHASES: Purchase[] = [
  { id: "PUR-205", vendor: "Hindustan Distributors", vendorId: "v1", date: "24 Apr 2026", items: 12, subtotal: 38500, tax: 4620, total: 43120, paid: 20000, status: "Partial" },
  { id: "PUR-204", vendor: "Snacks Wholesale Ltd", vendorId: "v3", date: "23 Apr 2026", items: 8, subtotal: 18200, tax: 3276, total: 21476, paid: 21476, status: "Paid" },
  { id: "PUR-203", vendor: "Karnataka Dairy Co.", vendorId: "v2", date: "22 Apr 2026", items: 5, subtotal: 11200, tax: 1344, total: 12544, paid: 0, status: "Received" },
  { id: "PUR-202", vendor: "Hindustan Distributors", vendorId: "v1", date: "20 Apr 2026", items: 18, subtotal: 52000, tax: 6240, total: 58240, paid: 58240, status: "Paid" },
  { id: "PUR-201", vendor: "Karnataka Dairy Co.", vendorId: "v2", date: "18 Apr 2026", items: 6, subtotal: 9800, tax: 1176, total: 10976, paid: 10976, status: "Paid" },
];

// === Finance / Transactions ===
export type Txn = {
  id: string; date: string; type: "Receipt" | "Payment" | "Expense" | "Income";
  account: "Cash" | "Bank" | "UPI";
  party?: string; category?: string; amount: number; mode: string; notes?: string;
};

export const TRANSACTIONS: Txn[] = [
  { id: "t1", date: "25 Apr 2026", type: "Receipt", account: "UPI", party: "Priya Verma", amount: 842, mode: "UPI", notes: "Order SRM-1042" },
  { id: "t2", date: "25 Apr 2026", type: "Receipt", account: "Cash", party: "Walk-in", amount: 156, mode: "Cash", notes: "Order SRM-1041" },
  { id: "t3", date: "25 Apr 2026", type: "Expense", account: "Cash", category: "Transport", amount: 450, mode: "Cash", notes: "Tempo unloading" },
  { id: "t4", date: "24 Apr 2026", type: "Payment", account: "Bank", party: "Hindustan Distributors", amount: 20000, mode: "Bank Transfer", notes: "PUR-205 partial" },
  { id: "t5", date: "24 Apr 2026", type: "Expense", account: "UPI", category: "Utilities", amount: 1280, mode: "UPI", notes: "Electricity bill" },
  { id: "t6", date: "23 Apr 2026", type: "Expense", account: "Bank", category: "Rent", amount: 35000, mode: "Bank Transfer", notes: "April rent" },
  { id: "t7", date: "23 Apr 2026", type: "Receipt", account: "Bank", party: "Kiran Patel", amount: 5000, mode: "NEFT", notes: "Partial settle SRM-1035" },
  { id: "t8", date: "22 Apr 2026", type: "Expense", account: "Cash", category: "Salaries", amount: 18000, mode: "Cash", notes: "Suresh — April" },
  { id: "t9", date: "21 Apr 2026", type: "Expense", account: "UPI", category: "Marketing", amount: 2500, mode: "UPI", notes: "Pamphlets" },
  { id: "t10", date: "20 Apr 2026", type: "Payment", account: "Bank", party: "Hindustan Distributors", amount: 58240, mode: "Bank Transfer", notes: "PUR-202 settle" },
];

export const ACCOUNTS = [
  { name: "Cash in Hand", balance: 42500, icon: "Banknote" },
  { name: "HDFC Bank ····4521", balance: 285600, icon: "Landmark" },
  { name: "UPI Wallet", balance: 18920, icon: "Smartphone" },
];

export const EXPENSE_BREAKDOWN = [
  { category: "Rent", amount: 35000, color: "hsl(265 60% 45%)" },
  { category: "Salaries", amount: 86000, color: "hsl(43 80% 55%)" },
  { category: "Transport", amount: 14500, color: "hsl(310 55% 50%)" },
  { category: "Utilities", amount: 8400, color: "hsl(195 75% 50%)" },
  { category: "Marketing", amount: 12500, color: "hsl(348 70% 55%)" },
  { category: "Misc", amount: 6200, color: "hsl(158 55% 45%)" },
];

// === Staff ===
export type Staff = {
  id: string; name: string; phone: string; role: string;
  salary: number; joinDate: string; status: "Active" | "On Leave" | "Inactive";
  avatar: string;
};

export const STAFF: Staff[] = [
  { id: "s1", name: "Suresh Yadav", phone: "98456 11122", role: "Cashier", salary: 18000, joinDate: "01 Jan 2024", status: "Active", avatar: "SY" },
  { id: "s2", name: "Pooja Singh", phone: "98456 22233", role: "Store Manager", salary: 28000, joinDate: "15 Mar 2023", status: "Active", avatar: "PS" },
  { id: "s3", name: "Mohan Das", phone: "98456 33344", role: "Helper", salary: 12000, joinDate: "10 Jul 2024", status: "On Leave", avatar: "MD" },
  { id: "s4", name: "Reema Khan", phone: "98456 44455", role: "Inventory Clerk", salary: 16000, joinDate: "05 Sep 2024", status: "Active", avatar: "RK" },
];

// === Invoices ===
export type Invoice = {
  id: string; orderId: string; date: string; party: string;
  amount: number; status: "Generated" | "Sent" | "Paid" | "Overdue";
};

export const INVOICES: Invoice[] = ORDERS.map(o => ({
  id: o.id.replace("SRM-", "INV-"),
  orderId: o.id,
  date: o.date,
  party: o.customer,
  amount: o.total,
  status: o.paymentStatus === "Paid" ? "Paid" : o.paymentStatus === "Partial" ? "Sent" : "Generated",
}));

// === Party ledger entries (sample for first customer) ===
export const sampleLedger = (partyName: string) => [
  { date: "20 Apr 2026", particulars: "Opening balance", debit: 0, credit: 0, balance: 0 },
  { date: "21 Apr 2026", particulars: "Sale SRM-1020", debit: 4500, credit: 0, balance: 4500 },
  { date: "22 Apr 2026", particulars: "Receipt — UPI", debit: 0, credit: 2000, balance: 2500 },
  { date: "24 Apr 2026", particulars: "Sale SRM-1035", debit: 3500, credit: 0, balance: 6000 },
  { date: "25 Apr 2026", particulars: "Receipt — Cash", debit: 0, credit: 1000, balance: 5000 },
];

// Backward-compat alias
export const RECENT_ORDERS = ORDERS.slice(0, 6).map(o => ({
  id: o.id, customer: o.customer, phone: o.phone, items: o.items,
  total: o.total, status: o.status, payment: o.payment, time: o.time,
}));
