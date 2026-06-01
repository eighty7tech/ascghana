import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS shop_orders (
      id            BIGINT AUTO_INCREMENT PRIMARY KEY,
      order_ref     VARCHAR(30)  NOT NULL UNIQUE,
      customer_name VARCHAR(200) NOT NULL,
      customer_email VARCHAR(200) NOT NULL,
      customer_phone VARCHAR(50)  DEFAULT NULL,
      member_id     INT          DEFAULT NULL,
      items_json    LONGTEXT     NOT NULL,
      subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0,
      discount      DECIMAL(10,2) NOT NULL DEFAULT 0,
      shipping      DECIMAL(10,2) NOT NULL DEFAULT 0,
      total         DECIMAL(10,2) NOT NULL DEFAULT 0,
      currency      VARCHAR(10)  NOT NULL DEFAULT 'GHS',
      payment_method VARCHAR(50) NOT NULL DEFAULT 'paystack',
      payment_ref   VARCHAR(200) DEFAULT NULL,
      payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
      fulfillment_status ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
      shipping_address LONGTEXT DEFAULT NULL,
      notes         TEXT         DEFAULT NULL,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ref   (order_ref),
      INDEX idx_email (customer_email),
      INDEX idx_member(member_id),
      INDEX idx_created(created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function makeRef() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth()+1).padStart(2,"0");
  const rand = Math.random().toString(36).substring(2,7).toUpperCase();
  return `ASC${y}${m}-${rand}`;
}

export async function GET(req: NextRequest) {
  await ensureTable();
  const url = new URL(req.url);
  const ref   = url.searchParams.get("ref");
  const email = url.searchParams.get("email");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  try {
    if (ref) {
      const order = await queryOne("SELECT * FROM shop_orders WHERE order_ref = ?", [ref]);
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      const o = order as any;
      return NextResponse.json({ order: { ...o, items: JSON.parse(o.items_json || "[]") } });
    }
    const rows = await query(
      `SELECT id,order_ref,customer_name,customer_email,total,currency,payment_status,fulfillment_status,created_at
       FROM shop_orders ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];
    const [{ cnt }] = await query("SELECT COUNT(*) as cnt FROM shop_orders") as any[];
    return NextResponse.json({ orders: rows, total: cnt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureTable();
  try {
    const body = await req.json();
    const {
      customerName, customerEmail, customerPhone, memberId,
      items, subtotal, discount, shipping, total, currency,
      paymentMethod, shippingAddress, notes,
    } = body;

    if (!customerName || !customerEmail || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderRef = makeRef();
    await query(
      `INSERT INTO shop_orders
       (order_ref,customer_name,customer_email,customer_phone,member_id,
        items_json,subtotal,discount,shipping,total,currency,
        payment_method,shipping_address,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        orderRef, customerName, customerEmail, customerPhone||null, memberId||null,
        JSON.stringify(items),
        subtotal||0, discount||0, shipping||0, total||0, currency||"GHS",
        paymentMethod||"paystack",
        shippingAddress ? JSON.stringify(shippingAddress) : null,
        notes||null,
      ]
    );

    return NextResponse.json({ success: true, orderRef }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await ensureTable();
  try {
    const { orderRef, paymentRef, paymentStatus, fulfillmentStatus } = await req.json();
    if (!orderRef) return NextResponse.json({ error: "orderRef required" }, { status: 400 });

    const sets: string[] = [];
    const vals: any[] = [];
    if (paymentRef)       { sets.push("payment_ref = ?");        vals.push(paymentRef); }
    if (paymentStatus)    { sets.push("payment_status = ?");     vals.push(paymentStatus); }
    if (fulfillmentStatus){ sets.push("fulfillment_status = ?"); vals.push(fulfillmentStatus); }

    if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    vals.push(orderRef);
    await query(`UPDATE shop_orders SET ${sets.join(", ")} WHERE order_ref = ?`, vals);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
