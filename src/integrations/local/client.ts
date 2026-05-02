import { api, db } from '@/lib/db';

// Supabase-compatible client wrapper for local PostgreSQL
class LocalClient {
  from(table: string) {
    return new TableQuery(table);
  }

  channel(name: string) {
    return new LocalChannel(name);
  }

  removeChannel(_channel: LocalChannel) {
    return "ok";
  }

  async rpc(fn: string, args: any = {}) {
    try {
      if (fn === 'place_storefront_order') {
        const data = await api.placeStorefrontOrder(args._slug, {
          customer_name: args._customer_name,
          customer_phone: args._customer_phone,
          customer_address: args._customer_address,
          items: args._items,
          notes: args._notes,
        });
        return { data, error: null };
      }

      if (fn === 'track_storefront_order') {
        const data = await api.trackStorefrontOrder(args._slug, {
          order_number: args._order_number,
          phone: args._phone,
        });
        return { data, error: null };
      }

      if (fn === 'redeem_invite') {
        const { data: session } = this.auth.getSession();
        const userId = session.session?.user?.id;
        if (!userId) throw new Error('Not signed in');

        const invite = await this.from('tenant_invites')
          .select('*')
          .eq('code', args._code)
          .maybeSingle();
        if (invite.error) throw new Error(invite.error.message);
        if (!invite.data) throw new Error('Invite is invalid or expired');

        await this.from('user_roles').insert({
          user_id: userId,
          tenant_id: invite.data.tenant_id,
          role: invite.data.role,
        });
        await this.from('tenant_invites')
          .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
          .eq('id', invite.data.id);

        return { data: invite.data.tenant_id, error: null };
      }

      throw new Error(`RPC ${fn} is not implemented in local mode`);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  get auth() {
    return {
      getSession: () => {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        if (!token || !userStr) return { data: { session: null } };
        return { 
          data: { 
            session: { 
              user: JSON.parse(userStr),
              access_token: token
            } 
          } 
        };
      },
      getUser: async () => {
        const userStr = localStorage.getItem('auth_user');
        return { data: { user: userStr ? JSON.parse(userStr) : null }, error: null };
      },
      signInWithPassword: async ({ email, password }: any) => {
        // This is handled in Auth.tsx directly
        throw new Error('Use Auth.tsx for authentication');
      },
      signUp: async ({ email, password, options }: any) => {
        // This is handled in Auth.tsx directly
        throw new Error('Use Auth.tsx for authentication');
      },
      signOut: async () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        return { error: null };
      },
      onAuthStateChange: (callback: any) => {
        // Simple implementation - doesn't support real-time changes
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    };
  }
}

class LocalChannel {
  constructor(private name: string) {}

  on(_event: string, _filter: any, _callback: (...args: any[]) => void) {
    return this;
  }

  subscribe() {
    return this;
  }

  unsubscribe() {
    return "ok";
  }
}

class TableQuery {
  private table: string;
  private selectFields = '*';
  private whereConditions: any[] = [];
  private orderByClause: string | null = null;
  private limitValue: number | null = null;
  private singleMode = false;
  private maybeSingleMode = false;
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private mutationData: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = '*') {
    this.selectFields = sanitizeSelect(fields);
    return this;
  }

  eq(column: string, value: any) {
    this.whereConditions.push({ column, value, op: '=' });
    return this;
  }

  neq(column: string, value: any) {
    this.whereConditions.push({ column, value, op: '!=' });
    return this;
  }

  gte(column: string, value: any) {
    this.whereConditions.push({ column, value, op: '>=' });
    return this;
  }

  lte(column: string, value: any) {
    this.whereConditions.push({ column, value, op: '<=' });
    return this;
  }

  gt(column: string, value: any) {
    this.whereConditions.push({ column, value, op: '>' });
    return this;
  }

  lt(column: string, value: any) {
    this.whereConditions.push({ column, value, op: '<' });
    return this;
  }

  order(column: string, options: { ascending: boolean } = { ascending: true }) {
    this.orderByClause = `${column} ${options.ascending ? 'ASC' : 'DESC'}`;
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleMode = true;
    return this;
  }

  async execute() {
    try {
      const { query, params } = this.buildQuery();
      const result = await db.query(query, params);
      
      if (this.singleMode) {
        if (result.rows.length === 0) {
          return { data: null, error: { message: 'No rows returned' } };
        }
        return { data: result.rows[0], error: null };
      }

      if (this.maybeSingleMode) {
        return { data: result.rows[0] || null, error: null };
      }

      return { data: result.rows, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  insert(data: any) {
    this.mode = 'insert';
    this.mutationData = data;
    return this;
  }

  update(data: any) {
    this.mode = 'update';
    this.mutationData = data;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  async count() {
    let query = `SELECT COUNT(*) as count FROM ${this.table}`;
    const params: any[] = [];
    let paramIndex = 1;

    if (this.whereConditions.length > 0) {
      const conditions = this.whereConditions.map(c => {
        params.push(c.value);
        return `${c.column} ${c.op} $${paramIndex++}`;
      });
      query += ' WHERE ' + conditions.join(' AND ');
    }

    try {
      const result = await db.query(query, params);
      return { count: parseInt(result.rows[0].count), error: null };
    } catch (error: any) {
      return { count: 0, error: { message: error.message } };
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private buildQuery() {
    if (this.mode === 'insert') return this.buildInsert();
    if (this.mode === 'update') return this.buildUpdate();
    if (this.mode === 'delete') return this.buildDelete();
    return this.buildSelect();
  }

  private buildSelect() {
    let query = `SELECT ${this.selectFields} FROM ${this.table}`;
    const params: any[] = [];
    query += this.whereClause(params, 1).clause;

    if (this.orderByClause) query += ' ORDER BY ' + this.orderByClause;
    if (this.limitValue) query += ` LIMIT ${this.limitValue}`;

    return { query, params };
  }

  private buildInsert() {
    const rows = Array.isArray(this.mutationData) ? this.mutationData : [this.mutationData];
    const columns = Object.keys(rows[0] ?? {});
    const params: any[] = [];
    const valuesSql = rows.map((row) => {
      const placeholders = columns.map((col) => {
        params.push(row[col]);
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    return {
      query: `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES ${valuesSql.join(', ')} RETURNING *`,
      params,
    };
  }

  private buildUpdate() {
    const columns = Object.keys(this.mutationData ?? {});
    const params = Object.values(this.mutationData ?? {});
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const where = this.whereClause(params, params.length + 1);

    return {
      query: `UPDATE ${this.table} SET ${setClause}${where.clause} RETURNING *`,
      params,
    };
  }

  private buildDelete() {
    const params: any[] = [];
    const where = this.whereClause(params, 1);
    return {
      query: `DELETE FROM ${this.table}${where.clause} RETURNING *`,
      params,
    };
  }

  private whereClause(params: any[], startIndex: number) {
    let paramIndex = startIndex;
    if (this.whereConditions.length === 0) return { clause: '', nextIndex: paramIndex };

    const conditions = this.whereConditions.map((condition) => {
      params.push(condition.value);
      return `${condition.column} ${condition.op} $${paramIndex++}`;
    });

    return { clause: ' WHERE ' + conditions.join(' AND '), nextIndex: paramIndex };
  }
}

const sanitizeSelect = (fields: string) => {
  if (!fields || fields === '*') return '*';
  const topLevel = fields
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field && !field.includes('(') && !field.includes(')'));

  return topLevel.length > 0 ? topLevel.join(', ') : '*';
};

export const localClient = new LocalClient();
