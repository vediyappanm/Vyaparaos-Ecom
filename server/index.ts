import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import rateLimit from 'express-rate-limit';

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const app = express();

// Tighten CORS - restrict to specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET;

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later'
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Compatibility query bridge for the local Supabase-style client.
// Keep this local-only by default; production deployments should use REST endpoints.
app.post('/api/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    const sql = String(query || '').trim();
    const allowed = /^(select|insert|update|delete)\b/i.test(sql);
    const unsafe = /;\s*\S|--|\/\*|\b(drop|alter|truncate|grant|revoke|create)\b/i.test(sql);

    if (!allowed || unsafe) {
      return res.status(400).json({ error: 'Query is not allowed by the local bridge' });
    }

    const result = await pool.query(sql, Array.isArray(params) ? params : []);
    res.json({ rows: result.rows, rowCount: result.rowCount });
  } catch (error: any) {
    if (error?.code === '42P01') {
      const sql = String(req.body?.query || '').trim().toLowerCase();
      if (sql.startsWith('select')) {
        return res.json({ rows: [], rowCount: 0, warning: 'relation_missing' });
      }
      return res.json({ rows: [], rowCount: 0, warning: 'relation_missing' });
    }
    res.status(500).json({ error: error.message });
  }
});

// JWT verification middleware
async function verifyToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get user's tenant and role
async function getUserContext(userId: string) {
  const result = await pool.query(
    `SELECT ur.tenant_id, ur.role, t.name as tenant_name 
     FROM user_roles ur 
     JOIN tenants t ON ur.tenant_id = t.id 
     WHERE ur.user_id = $1 
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

function accountTypeForPaymentMode(mode?: string | null) {
  const value = String(mode || '').toLowerCase();
  if (value.includes('upi')) return 'upi';
  if (value.includes('card') || value.includes('bank')) return 'bank';
  return 'cash';
}

// Helper to strip sensitive fields
function sanitizeUser(user: any) {
  const { password_hash, ...sanitized } = user;
  return sanitized;
}

function normalizeBarcode(raw: unknown) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value.length > 0 ? value : null;
}

// Auth endpoints
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    
    // Password validation
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, passwordHash, fullName || null, phone || null]
    );
    
    const user = sanitizeUser(result.rows[0]);
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret);
    
    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/signin', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const sanitizedUser = sanitizeUser(user);
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret);
    
    res.json({ user: sanitizedUser, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    res.json({ valid: true, payload });
  } catch (error) {
    res.json({ valid: false });
  }
});

// ==================== TENANT ENDPOINTS ====================

// Get user's tenant context
app.get('/api/user/context', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context) {
      return res.status(404).json({ error: 'No tenant found for user' });
    }
    res.json(context);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create tenant
app.post('/api/tenants', verifyToken, async (req: any, res) => {
  try {
    const { name, slug, gstin, phone, email, city, state, pincode } = req.body;
    const result = await pool.query(
      `INSERT INTO tenants (name, slug, gstin, phone, email, city, state, pincode) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [name, slug, gstin || null, phone || null, email || null, city || null, state || null, pincode || null]
    );
    
    // Assign owner role
    await pool.query(
      'INSERT INTO user_roles (user_id, tenant_id, role) VALUES ($1, $2, $3)',
      [req.user.userId, result.rows[0].id, 'owner']
    );
    
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant by slug
app.get('/api/tenants/by-slug/:slug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tenants WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant by ID
app.get('/api/tenants/:id', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PRODUCT ENDPOINTS ====================

// Get products for tenant
app.get('/api/tenants/:tenantId/products', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM products WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.params.tenantId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
app.post('/api/tenants/:tenantId/products', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, description, category, sku, barcode, hsn_code, unit, price, mrp, cost_price, tax_rate, stock_qty, low_stock_alert, image_url } = req.body;
    const normalizedBarcode = normalizeBarcode(barcode);
    if (normalizedBarcode) {
      const duplicate = await pool.query(
        'SELECT id FROM products WHERE tenant_id = $1 AND barcode = $2 LIMIT 1',
        [req.params.tenantId, normalizedBarcode]
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ error: 'Barcode already exists for this tenant' });
      }
    }
    const result = await pool.query(
      `INSERT INTO products (tenant_id, name, description, category, sku, barcode, hsn_code, unit, price, mrp, cost_price, tax_rate, stock_qty, low_stock_alert, image_url, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true) 
       RETURNING *`,
      [req.params.tenantId, name, description || null, category || null, sku || null, normalizedBarcode, hsn_code || null, unit || 'piece', price || 0, mrp || 0, cost_price || 0, tax_rate || 0, stock_qty || 0, low_stock_alert || 0, image_url || null]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Barcode already exists for this tenant' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update product
app.put('/api/tenants/:tenantId/products/:productId', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, description, category, sku, barcode, hsn_code, unit, price, mrp, cost_price, tax_rate, stock_qty, low_stock_alert, image_url, is_active } = req.body;
    const normalizedBarcode = barcode === undefined ? undefined : normalizeBarcode(barcode);
    if (normalizedBarcode) {
      const duplicate = await pool.query(
        'SELECT id FROM products WHERE tenant_id = $1 AND barcode = $2 AND id <> $3 LIMIT 1',
        [req.params.tenantId, normalizedBarcode, req.params.productId]
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ error: 'Barcode already exists for this tenant' });
      }
    }
    const result = await pool.query(
      `UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), category = COALESCE($3, category), 
       sku = COALESCE($4, sku), barcode = COALESCE($5, barcode), hsn_code = COALESCE($6, hsn_code), unit = COALESCE($7, unit), 
       price = COALESCE($8, price), mrp = COALESCE($9, mrp), cost_price = COALESCE($10, cost_price), tax_rate = COALESCE($11, tax_rate), 
       stock_qty = COALESCE($12, stock_qty), low_stock_alert = COALESCE($13, low_stock_alert), image_url = COALESCE($14, image_url), 
       is_active = COALESCE($15, is_active) 
       WHERE id = $16 AND tenant_id = $17 RETURNING *`,
      [name, description, category, sku, normalizedBarcode, hsn_code, unit, price, mrp, cost_price, tax_rate, stock_qty, low_stock_alert, image_url, is_active, req.params.productId, req.params.tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.delete('/api/tenants/:tenantId/products/:productId', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query('DELETE FROM products WHERE id = $1 AND tenant_id = $2 RETURNING *', [req.params.productId, req.params.tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ORDER ENDPOINTS ====================

// Get orders for tenant
app.get('/api/tenants/:tenantId/orders', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.params.tenantId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
app.post('/api/tenants/:tenantId/orders', verifyToken, async (req: any, res) => {
  const client = await pool.connect();
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { order_number, party_id, party_name, party_phone, status, channel, subtotal, discount, tax_amount, total, paid_amount, balance_due, payment_status, payment_mode, notes, items } = req.body;
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO orders (tenant_id, order_number, party_id, party_name, party_phone, status, channel, subtotal, discount, tax_amount, total, paid_amount, balance_due, payment_status, payment_mode, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
       RETURNING *`,
      [req.params.tenantId, order_number, party_id || null, party_name || null, party_phone || null, status || 'confirmed', channel || 'pos', subtotal || 0, discount || 0, tax_amount || 0, total || 0, paid_amount || 0, balance_due || 0, payment_status || 'paid', payment_mode || null, notes || null, req.user.userId]
    );
    
    const order = result.rows[0];
    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, tenant_id, product_id, product_name, hsn_code, qty, unit_price, discount, tax_rate, tax_amount, total) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [order.id, req.params.tenantId, item.product_id || null, item.product_name, item.hsn_code || null, item.qty || 1, item.unit_price || 0, item.discount || 0, item.tax_rate || 0, item.tax_amount || 0, item.total || 0]
        );

        if (item.product_id) {
          await client.query(
            'UPDATE products SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2 AND tenant_id = $3',
            [item.qty || 1, item.product_id, req.params.tenantId]
          );
          await client.query(
            `INSERT INTO stock_movements (tenant_id, product_id, product_name, type, qty, reference, notes, created_by)
             VALUES ($1, $2, $3, 'sale', $4, $5, $6, $7)`,
            [req.params.tenantId, item.product_id, item.product_name, -(Number(item.qty) || 1), order.order_number, 'Created from POS sale', req.user.userId]
          );
        }
      }
    }

    if (Number(paid_amount || 0) > 0 && payment_status !== 'unpaid') {
      const accountType = accountTypeForPaymentMode(payment_mode);
      const account = await client.query(
        `SELECT id FROM accounts WHERE tenant_id = $1 AND type = $2 AND is_active = true ORDER BY created_at ASC LIMIT 1`,
        [req.params.tenantId, accountType]
      );
      const accountId = account.rows[0]?.id ?? null;
      if (accountId) {
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [paid_amount || total || 0, accountId]);
      }
      await client.query(
        `INSERT INTO transactions (tenant_id, account_id, type, party_name, amount, mode, notes, reference, created_by)
         VALUES ($1, $2, 'receipt', $3, $4, $5, $6, $7, $8)`,
        [req.params.tenantId, accountId, party_name || 'Walk-in Customer', paid_amount || total || 0, payment_mode || null, 'Created from sale', order.order_number, req.user.userId]
      );
    }

    await client.query('COMMIT');
    
    res.json(order);
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get order items
app.get('/api/tenants/:tenantId/orders/:orderId/items', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT oi.*, p.name as product_name, p.image_url FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1 AND oi.tenant_id = $2',
      [req.params.orderId, req.params.tenantId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PARTY ENDPOINTS ====================

// Get parties for tenant
app.get('/api/tenants/:tenantId/parties', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM parties WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.params.tenantId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create party
app.post('/api/tenants/:tenantId/parties', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { type, name, phone, email, gstin, address, city, state, pincode, opening_balance, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO parties (tenant_id, type, name, phone, email, gstin, address, city, state, pincode, opening_balance, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [req.params.tenantId, type || 'customer', name, phone || null, email || null, gstin || null, address || null, city || null, state || null, pincode || null, opening_balance || 0, notes || null]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update party
app.put('/api/tenants/:tenantId/parties/:partyId', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { type, name, phone, email, gstin, address, city, state, pincode, opening_balance, notes } = req.body;
    const result = await pool.query(
      `UPDATE parties SET type = COALESCE($1, type), name = COALESCE($2, name), phone = COALESCE($3, phone), 
       email = COALESCE($4, email), gstin = COALESCE($5, gstin), address = COALESCE($6, address), city = COALESCE($7, city), 
       state = COALESCE($8, state), pincode = COALESCE($9, pincode), opening_balance = COALESCE($10, opening_balance), 
       notes = COALESCE($11, notes) 
       WHERE id = $12 AND tenant_id = $13 RETURNING *`,
      [type, name, phone, email, gstin, address, city, state, pincode, opening_balance, notes, req.params.partyId, req.params.tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Party not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete party
app.delete('/api/tenants/:tenantId/parties/:partyId', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query('DELETE FROM parties WHERE id = $1 AND tenant_id = $2 RETURNING *', [req.params.partyId, req.params.tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Party not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACCOUNT ENDPOINTS ====================

// Get accounts for tenant
app.get('/api/tenants/:tenantId/accounts', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM accounts WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.params.tenantId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create account
app.post('/api/tenants/:tenantId/accounts', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, type, balance, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO accounts (tenant_id, name, type, balance, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [req.params.tenantId, name, type || 'cash', balance || 0, is_active !== false]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update account
app.put('/api/tenants/:tenantId/accounts/:accountId', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, type, balance, is_active } = req.body;
    const result = await pool.query(
      `UPDATE accounts SET name = COALESCE($1, name), type = COALESCE($2, type), 
       balance = COALESCE($3, balance), is_active = COALESCE($4, is_active) 
       WHERE id = $5 AND tenant_id = $6 RETURNING *`,
      [name, type, balance, is_active, req.params.accountId, req.params.tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
app.delete('/api/tenants/:tenantId/accounts/:accountId', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query('DELETE FROM accounts WHERE id = $1 AND tenant_id = $2 RETURNING *', [req.params.accountId, req.params.tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PUBLIC STOREFRONT ENDPOINTS ====================

app.post('/api/storefront/:slug/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const { customer_name, customer_phone, customer_address, items, notes } = req.body;
    if (!customer_name || !customer_phone) {
      return res.status(400).json({ error: 'Customer name and phone are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const tenantResult = await client.query('SELECT * FROM tenants WHERE slug = $1', [req.params.slug]);
    const tenant = tenantResult.rows[0];
    if (!tenant) return res.status(404).json({ error: 'Store not found' });

    await client.query('BEGIN');

    let subtotal = 0;
    let taxAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND tenant_id = $2 AND is_active = true',
        [item.product_id, tenant.id]
      );
      const product = productResult.rows[0];
      if (!product) throw new Error('One of the products is no longer available');

      const qty = Math.max(1, Number(item.qty) || 1);
      if (Number(product.stock_qty) < qty) {
        throw new Error(`${product.name} has only ${product.stock_qty} available`);
      }

      const lineSub = qty * Number(product.price);
      const lineTax = (lineSub * Number(product.tax_rate || 0)) / 100;
      subtotal += lineSub;
      taxAmount += lineTax;
      orderItems.push({
        product,
        qty,
        taxAmount: lineTax,
        total: lineSub + lineTax,
      });
    }

    const total = subtotal + taxAmount;
    const orderNumber = `WEB-${Date.now()}`;
    const orderResult = await client.query(
      `INSERT INTO orders (tenant_id, order_number, party_name, party_phone, status, channel, subtotal, discount, tax_amount, total, paid_amount, balance_due, payment_status, payment_mode, notes)
       VALUES ($1, $2, $3, $4, 'pending', 'storefront', $5, 0, $6, $7, 0, $7, 'unpaid', 'Online Order', $8)
       RETURNING *`,
      [tenant.id, orderNumber, customer_name, customer_phone, subtotal, taxAmount, total, [customer_address, notes].filter(Boolean).join('\n')]
    );
    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, tenant_id, product_id, product_name, hsn_code, qty, unit_price, discount, tax_rate, tax_amount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10)`,
        [order.id, tenant.id, item.product.id, item.product.name, item.product.hsn_code, item.qty, item.product.price, item.product.tax_rate || 0, item.taxAmount, item.total]
      );
      await client.query(
        'UPDATE products SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2 AND tenant_id = $3',
        [item.qty, item.product.id, tenant.id]
      );
      await client.query(
        `INSERT INTO stock_movements (tenant_id, product_id, product_name, type, qty, reference, notes)
         VALUES ($1, $2, $3, 'storefront_order', $4, $5, 'Created from public storefront')`,
        [tenant.id, item.product.id, item.product.name, -item.qty, order.order_number]
      );
    }

    await client.query('COMMIT');
    res.json({ order_number: order.order_number, total: Number(order.total) });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.post('/api/storefront/:slug/track', async (req, res) => {
  try {
    const { order_number, phone } = req.body;
    const result = await pool.query(
      `SELECT o.*, t.name as tenant_name, t.phone as tenant_phone
       FROM orders o
       JOIN tenants t ON t.id = o.tenant_id
       WHERE t.slug = $1 AND o.order_number = $2 AND regexp_replace(coalesce(o.party_phone, ''), '\\D', '', 'g') = regexp_replace($3, '\\D', '', 'g')
       LIMIT 1`,
      [req.params.slug, order_number, phone]
    );
    const order = result.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = await pool.query(
      'SELECT product_name, qty, unit_price, tax_rate, tax_amount, total FROM order_items WHERE order_id = $1 ORDER BY created_at ASC',
      [order.id]
    );

    res.json({ ...order, items: items.rows });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Barcode already exists for this tenant' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Record barcode scanner telemetry for monitoring and QA
app.post('/api/tenants/:tenantId/scan-events', verifyToken, async (req: any, res) => {
  try {
    const context = await getUserContext(req.user.userId);
    if (!context || context.tenant_id !== req.params.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { code, status, source, device_id, device_label, error_message } = req.body || {};
    const safeStatus = status === 'success' ? 'success' : 'failure';
    const safeSource = source === 'manual' ? 'manual' : 'camera';

    const result = await pool.query(
      `INSERT INTO scan_events (tenant_id, user_id, scanned_code, status, source, device_id, device_label, user_agent, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, tenant_id, status, source, created_at`,
      [
        req.params.tenantId,
        req.user.userId,
        normalizeBarcode(code),
        safeStatus,
        safeSource,
        device_id || null,
        device_label || null,
        req.headers['user-agent'] || null,
        error_message || null,
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error?.code === '42P01') {
      return res.status(202).json({ skipped: true, reason: 'scan_events_table_missing' });
    }
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
