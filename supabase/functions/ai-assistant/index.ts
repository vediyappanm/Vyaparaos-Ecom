// AI Assistant powered by Lovable AI Gateway. Grounds answers on the calling user's tenant data.
import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { messages } = await req.json();
    if (!Array.isArray(messages)) return json({ error: "Bad request" }, 400);

    // Resolve tenant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: roleRow } = await supabase.from("user_roles").select("tenant_id").eq("user_id", user.id).limit(1).maybeSingle();
    const tenantId = roleRow?.tenant_id;
    if (!tenantId) return json({ error: "No tenant" }, 400);

    // Pull lightweight context
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [tenant, products, orders, items, txns, parties, purchases] = await Promise.all([
      supabase.from("tenants").select("name, currency, gstin, city, state").eq("id", tenantId).maybeSingle(),
      supabase.from("products").select("name, sku, stock_qty, low_stock_alert, price").eq("tenant_id", tenantId),
      supabase.from("orders").select("order_number, party_name, total, balance_due, payment_status, status, created_at")
        .eq("tenant_id", tenantId).gte("created_at", monthStart.toISOString()).order("created_at", { ascending: false }).limit(60),
      supabase.from("order_items").select("product_name, qty, total, created_at").eq("tenant_id", tenantId).gte("created_at", monthStart.toISOString()),
      supabase.from("transactions").select("type, amount, category, party_name, txn_date").eq("tenant_id", tenantId).gte("txn_date", monthStart.toISOString().slice(0, 10)).limit(60),
      supabase.from("parties").select("name, type, phone").eq("tenant_id", tenantId).limit(50),
      supabase.from("purchases").select("purchase_number, vendor_name, total, paid_amount, status").eq("tenant_id", tenantId).gte("created_at", monthStart.toISOString()).limit(40),
    ]);

    const todaySales = (orders.data ?? []).filter((o: any) => new Date(o.created_at) >= today).reduce((s: number, o: any) => s + Number(o.total), 0);
    const monthSales = (orders.data ?? []).reduce((s: number, o: any) => s + Number(o.total), 0);
    const pendingDues = (orders.data ?? []).filter((o: any) => o.payment_status !== "paid").reduce((s: number, o: any) => s + Number(o.balance_due), 0);
    const lowStock = (products.data ?? []).filter((p: any) => Number(p.stock_qty) <= Number(p.low_stock_alert));
    const top: Record<string, number> = {};
    for (const it of items.data ?? []) top[it.product_name] = (top[it.product_name] ?? 0) + Number(it.qty);
    const topProducts = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const context = `Business: ${tenant.data?.name ?? "Shop"} (${tenant.data?.city ?? ""}, ${tenant.data?.state ?? ""})
Currency: INR. Today: ${new Date().toLocaleDateString("en-IN")}.
Today's sales: ₹${todaySales.toFixed(0)}. Month-to-date sales: ₹${monthSales.toFixed(0)}.
Outstanding dues: ₹${pendingDues.toFixed(0)} across ${(orders.data ?? []).filter((o: any) => o.payment_status !== "paid").length} unpaid orders.
Low-stock products (${lowStock.length}): ${lowStock.slice(0, 10).map((p: any) => `${p.name} (${p.stock_qty} ${p.low_stock_alert ? `/min ${p.low_stock_alert}` : ""})`).join(", ") || "none"}.
Top sellers this month: ${topProducts.map(([n, q]) => `${n} (${q} units)`).join(", ") || "no sales yet"}.
Recent orders: ${(orders.data ?? []).slice(0, 8).map((o: any) => `${o.order_number} ${o.party_name ?? "Walk-in"} ₹${o.total} ${o.payment_status}`).join("; ")}
Active parties: ${(parties.data ?? []).slice(0, 10).map((p: any) => `${p.name} (${p.type})`).join(", ") || "none"}.
Recent purchases: ${(purchases.data ?? []).slice(0, 5).map((p: any) => `${p.purchase_number} ${p.vendor_name} ₹${p.total} ${p.status}`).join("; ") || "none"}.
Recent transactions: ${(txns.data ?? []).slice(0, 8).map((t: any) => `${t.type} ₹${t.amount} ${t.category ?? t.party_name ?? ""}`).join("; ")}.`;

    const system = `You are VyaparOS AI — a friendly, expert business assistant for Indian shopkeepers and SME owners. Reply in the same language the user wrote (English, Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati). Be concise, specific, and use ₹ for amounts. When asked about stock, dues, customers, or sales — use the live data below. If asked to draft a WhatsApp / reminder message, write it ready-to-send. Never invent numbers; if data is empty, say so.

LIVE BUSINESS DATA:
${context}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI key not configured" }, 500);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limit — try again in a minute." }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add credits in Workspace → Cloud → AI." }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return json({ error: `AI error: ${t.slice(0, 200)}` }, 500);
    }
    const data = await aiRes.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
    return json({ reply });
  } catch (e: any) {
    return json({ error: e?.message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
