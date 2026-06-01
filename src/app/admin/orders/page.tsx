"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Select } from "@/components/ui";
import toast from "react-hot-toast";

const PAY_STATUS: Record<string,string> = { pending:"warning", paid:"success", failed:"danger", refunded:"info" };
const FUL_STATUS: Record<string,string> = { pending:"default", processing:"warning", shipped:"info", delivered:"success", cancelled:"danger" };

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?limit=100");
      const d = await res.json();
      setOrders(d.orders || []);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrder = async (ref: string) => {
    const res = await fetch(`/api/orders?ref=${ref}`);
    const d = await res.json();
    setSelected(d.order || null);
  };

  const updateStatus = async (field: "paymentStatus"|"fulfillmentStatus", value: string) => {
    if (!selected) return;
    setUpdating(true);
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderRef: selected.order_ref,
        [field === "paymentStatus" ? "paymentStatus" : "fulfillmentStatus"]: value,
      }),
    });
    toast.success("Order updated");
    setSelected((p: any) => ({ ...p, [field === "paymentStatus" ? "payment_status" : "fulfillment_status"]: value }));
    load();
    setUpdating(false);
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.order_ref?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q) || o.customer_email?.toLowerCase().includes(q);
    const matchPay = payFilter === "all" || o.payment_status === payFilter;
    return matchSearch && matchPay;
  });

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.payment_status === "paid").length,
    pending: orders.filter(o => o.payment_status === "pending").length,
    revenue: orders.filter(o => o.payment_status === "paid").reduce((s,o) => s + parseFloat(o.total||0), 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="section-red-line" />
          <h1 className="text-3xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>SHOP ORDERS</h1>
          <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>Manage and fulfil customer orders</p>
        </div>
        <Button onClick={load} size="sm" style={{ background:"rgba(255,255,255,0.06)" }}>
          <i className="fa-solid fa-rotate mr-1" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Orders", value:stats.total, icon:"fa-receipt",       color:"#3B82F6" },
          { label:"Paid",         value:stats.paid,  icon:"fa-circle-check",  color:"#10B981" },
          { label:"Pending",      value:stats.pending,icon:"fa-hourglass-half",color:"#F59E0B" },
          { label:"Revenue (GH₵)",value:`${stats.revenue.toLocaleString()}`, icon:"fa-coins", color:"#C6A84B" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-sm" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background:`${s.color}18` }}>
                <i className={`fa-solid ${s.icon} text-base`} style={{ color:s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color:"var(--text-primary)", fontFamily:"var(--font-display)" }}>{s.value}</p>
                <p className="text-xs" style={{ color:"var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search by ref, name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={payFilter} onChange={e=>setPayFilter(e.target.value)} className="w-40">
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center" style={{ color:"var(--text-muted)" }}>
              <i className="fa-solid fa-spinner fa-spin text-2xl mb-2 block" />Loading orders…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color:"var(--text-muted)" }}>
              <i className="fa-solid fa-receipt text-4xl mb-3 block opacity-20" />
              <p className="font-bold" style={{ fontFamily:"var(--font-heading)" }}>No orders yet</p>
              <p className="text-sm mt-1">Orders will appear here once customers purchase from the shop</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background:"rgba(255,255,255,0.02)", borderBottom:"1px solid var(--border-color)" }}>
                    {["Order Ref","Customer","Items","Total","Payment","Fulfillment","Date",""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.order_ref} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color:"var(--color-red)" }}>{o.order_ref}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color:"var(--text-primary)" }}>{o.customer_name}</p>
                        <p className="text-xs" style={{ color:"var(--text-muted)" }}>{o.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-center" style={{ color:"var(--text-secondary)" }}>—</td>
                      <td className="px-4 py-3 font-bold" style={{ color:"var(--text-primary)" }}>GH₵{parseFloat(o.total||0).toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge variant={PAY_STATUS[o.payment_status]||"default" as any}>{o.payment_status}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={FUL_STATUS[o.fulfillment_status]||"default" as any}>{o.fulfillment_status}</Badge></td>
                      <td className="px-4 py-3 text-xs" style={{ color:"var(--text-muted)" }}>
                        {new Date(o.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openOrder(o.order_ref)}
                          className="text-xs px-3 py-1.5 rounded-sm font-bold transition-all hover:opacity-80"
                          style={{ background:"rgba(239,1,7,0.1)", color:"var(--color-red)", border:"1px solid rgba(239,1,7,0.2)", fontFamily:"var(--font-heading)" }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:"1px solid var(--border-color)" }}>
              <div>
                <p className="font-black text-lg" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>Order {selected.order_ref}</p>
                <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
                  {new Date(selected.created_at).toLocaleString("en-GB")}
                </p>
              </div>
              <button onClick={()=>setSelected(null)} className="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color:"rgba(255,255,255,0.4)" }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Customer</p>
                <p className="font-bold" style={{ color:"var(--text-primary)" }}>{selected.customer_name}</p>
                <p className="text-sm" style={{ color:"var(--text-secondary)" }}>{selected.customer_email}</p>
                <p className="text-sm" style={{ color:"var(--text-secondary)" }}>{selected.customer_phone}</p>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Items</p>
                <div className="space-y-2">
                  {(selected.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-2" style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color:"var(--text-secondary)" }}>{item.name}{item.size ? ` (${item.size})` : ""} × {item.qty}</span>
                      <span className="font-bold" style={{ color:"var(--text-primary)" }}>GH₵{(item.price*item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 font-black">
                  <span style={{ color:"var(--text-primary)" }}>Total</span>
                  <span style={{ color:"var(--text-primary)" }}>GH₵{parseFloat(selected.total||0).toLocaleString()}</span>
                </div>
              </div>

              {/* Status controls */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Payment Status</label>
                  <Select value={selected.payment_status} onChange={e=>updateStatus("paymentStatus",e.target.value)} disabled={updating}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Fulfillment Status</label>
                  <Select value={selected.fulfillment_status} onChange={e=>updateStatus("fulfillmentStatus",e.target.value)} disabled={updating}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>

              {selected.payment_ref && (
                <p className="text-xs" style={{ color:"var(--text-muted)" }}>Payment Ref: <span style={{ color:"var(--text-secondary)" }}>{selected.payment_ref}</span></p>
              )}
              {selected.notes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Customer Notes</p>
                  <p className="text-sm" style={{ color:"var(--text-secondary)" }}>{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
