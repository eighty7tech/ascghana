"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useApp, MatchTicket } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Modal, Table, Thead, Th, Tbody, Tr, Td, Badge, EmptyState, FormGroup, StatCard } from "@/components/ui";
import toast from "react-hot-toast";

const CAT_COLORS = { A:"#C6A84B", B:"#EF0107", C:"#3B82F6" };
const CAT_NAMES = { A:"Category A", B:"Category B", C:"Category C" };

const EMPTY: Omit<MatchTicket,"id"> = {
  matchName:"", competition:"Premier League", matchDate:"", deadline:"",
  category:"B", ticketsAvailable:0, ticketPrice:0, bookingFee:0,
  paystackChargePct:4, status:"Active", image:"", notes:""
};

export default function AdminMatchTicketsPage() {
  const { matchTickets, setMatchTickets, updateMatchTicket, deleteMatchTicket } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState<Omit<MatchTicket,"id">>({...EMPTY});
  const [selected, setSelected] = useState<string[]>([]);

  const up = (k:string, v:any) => setForm(f=>({...f,[k]:v}));

  const openNew = () => { setForm({...EMPTY}); setEditId(null); setShowModal(true); };
  const openEdit = (t:MatchTicket) => {
    setForm({ matchName:t.matchName, competition:t.competition, matchDate:t.matchDate, deadline:t.deadline, category:t.category, ticketsAvailable:t.ticketsAvailable, ticketPrice:t.ticketPrice, bookingFee:t.bookingFee, paystackChargePct:t.paystackChargePct, status:t.status, image:t.image||"", notes:t.notes||"" });
    setEditId(t.id); setShowModal(true);
  };

  const save = () => {
    if (!form.matchName) { toast.error("Match name required"); return; }
    if (editId) {
      updateMatchTicket(editId, form);
      toast.success("Match ticket updated — shows on member portal");
    } else {
      const id = `MT${Date.now()}`;
      setMatchTickets([{ id, ...form }, ...matchTickets]);
      toast.success("Match ticket added — now visible to members");
    }
    setShowModal(false);
  };

  const handleDelete = (id:string) => {
    if (!confirm("Delete this match ticket? It will be removed from member view immediately.")) return;
    deleteMatchTicket(id);
    toast.success("Match ticket deleted");
  };

  const toggleSelect = (id:string) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
  const deleteSelected = () => {
    if (!selected.length || !confirm(`Delete ${selected.length} tickets?`)) return;
    selected.forEach(id => deleteMatchTicket(id));
    setSelected([]);
    toast.success(`${selected.length} tickets deleted`);
  };

  // Cost preview
  const tPrice = Number(form.ticketPrice)||0;
  const bFee = Number(form.bookingFee)||0;
  const pct = Number(form.paystackChargePct)||4;
  const charge = (tPrice+bFee)*(pct/100);
  const total = tPrice+bFee+charge;

  const counts = {
    active: matchTickets.filter(t=>t.status==="Active").length,
    soldOut: matchTickets.filter(t=>t.status==="Sold Out").length,
    totalTickets: matchTickets.filter(t=>t.status==="Active").reduce((s,t)=>s+t.ticketsAvailable,0),
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>MATCH TICKETS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-body)" }}>
            Admin-managed match listings shown to logged-in members. Deleted tickets are removed permanently.
          </p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button variant="danger" size="sm" onClick={deleteSelected}>
              <i className="fa-solid fa-trash" />Delete {selected.length}
            </Button>
          )}
          <Button size="sm" onClick={openNew}>
            <i className="fa-solid fa-plus" />Add Match
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Listings" value={counts.active} icon="fa-solid fa-ticket" color="#10B981" />
        <StatCard label="Total Tickets Available" value={counts.totalTickets} icon="fa-solid fa-users" color="#C6A84B" />
        <StatCard label="Sold Out" value={counts.soldOut} icon="fa-solid fa-ban" color="#EF4444" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle><i className="fa-solid fa-ticket mr-2" style={{ color:"var(--color-red)" }} />Match Listings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {matchTickets.length === 0 ? (
            <EmptyState icon="fa-solid fa-ticket" title="No match tickets yet" desc="Add matches to make them available for member booking" action={<Button size="sm" onClick={openNew}><i className="fa-solid fa-plus" />Add First Match</Button>} />
          ) : (
            <Table>
              <Thead>
                <Th><input type="checkbox" checked={selected.length===matchTickets.length} onChange={() => setSelected(selected.length===matchTickets.length ? [] : matchTickets.map(t=>t.id))} className="accent-red-600" /></Th>
                <Th>Match</Th><Th>Category</Th><Th>Available</Th><Th>Pricing</Th><Th>Deadline</Th><Th>Status</Th><Th />
              </Thead>
              <Tbody>
                {matchTickets.map(t => {
                  const catColor = CAT_COLORS[t.category];
                  const tP = Number(t.ticketPrice)||0;
                  const bF = Number(t.bookingFee)||0;
                  const tTotal = tP + bF + (tP+bF)*(Number(t.paystackChargePct)||4)/100;
                  return (
                    <Tr key={t.id}>
                      <Td><input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} className="accent-red-600" /></Td>
                      <Td>
                        <p className="font-semibold text-white" style={{ fontFamily:"var(--font-heading)" }}>{t.matchName}</p>
                        <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>{t.competition} {t.matchDate && `· ${t.matchDate}`}</p>
                      </Td>
                      <Td><span className="text-xs font-bold px-2 py-0.5 rounded-sm" style={{ background:`${catColor}20`, color:catColor }}>{CAT_NAMES[t.category]}</span></Td>
                      <Td><span className="font-bold" style={{ color:t.ticketsAvailable===0?"#EF4444":"#10B981" }}>{t.ticketsAvailable}</span></Td>
                      <Td>
                        <p className="text-xs" style={{ color:"rgba(255,255,255,0.7)" }}>GHS {tP} + GHS {bF} fee</p>
                        <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>+{t.paystackChargePct}% = <span style={{ color:"#10B981" }}>GHS {tTotal.toFixed(2)}</span> total</p>
                      </Td>
                      <Td className="text-xs">{t.deadline || "—"}</Td>
                      <Td>
                        <Badge variant={t.status==="Active"?"success":t.status==="Sold Out"?"warning":"default"}>
                          {t.status}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                            <i className="fa-solid fa-pen-to-square text-xs" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}
                            className="hover:bg-red-500/15 hover:text-red-400">
                            <i className="fa-solid fa-trash text-xs" />
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId?"Edit Match Ticket":"Add Match Ticket"} size="lg">
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormGroup label="Match Name *" icon="fa-solid fa-futbol">
                <Input value={form.matchName} onChange={e=>up("matchName",e.target.value)} placeholder="e.g. Arsenal vs Chelsea" />
              </FormGroup>
            </div>
            <FormGroup label="Competition" icon="fa-solid fa-trophy">
              <Input value={form.competition} onChange={e=>up("competition",e.target.value)} />
            </FormGroup>
            <FormGroup label="Category" icon="fa-solid fa-tag">
              <Select value={form.category} onChange={e=>up("category",e.target.value)}>
                <option value="A">Category A — Big fixtures</option>
                <option value="B">Category B — Standard</option>
                <option value="C">Category C — Lower demand</option>
              </Select>
            </FormGroup>
            <FormGroup label="Match Date & Time" icon="fa-solid fa-calendar">
              <Input type="datetime-local" value={form.matchDate} onChange={e=>up("matchDate",e.target.value)} />
            </FormGroup>
            <FormGroup label="Booking Deadline" icon="fa-solid fa-clock">
              <Input type="datetime-local" value={form.deadline} onChange={e=>up("deadline",e.target.value)} />
            </FormGroup>
            <FormGroup label="Tickets Available" icon="fa-solid fa-ticket">
              <Input type="number" min="0" value={form.ticketsAvailable} onChange={e=>up("ticketsAvailable",parseInt(e.target.value)||0)} />
            </FormGroup>
            <FormGroup label="Status" icon="fa-solid fa-circle-check">
              <Select value={form.status} onChange={e=>up("status",e.target.value)}>
                <option value="Active">Active</option>
                <option value="Sold Out">Sold Out</option>
                <option value="Closed">Closed</option>
                <option value="Hidden">Hidden</option>
              </Select>
            </FormGroup>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-sm" style={{ background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>Pricing</p>
            <div className="grid grid-cols-3 gap-3">
              <FormGroup label="Ticket Price (GHS)" icon="fa-solid fa-sterling-sign">
                <Input type="number" min="0" step="0.01" value={form.ticketPrice} onChange={e=>up("ticketPrice",parseFloat(e.target.value)||0)} />
              </FormGroup>
              <FormGroup label="Booking Fee (GHS)" icon="fa-solid fa-plus">
                <Input type="number" min="0" step="0.01" value={form.bookingFee} onChange={e=>up("bookingFee",parseFloat(e.target.value)||0)} />
              </FormGroup>
              <FormGroup label="Paystack Charge %" icon="fa-solid fa-percent">
                <Input type="number" min="0" step="0.01" value={form.paystackChargePct} onChange={e=>up("paystackChargePct",parseFloat(e.target.value)||4)} />
              </FormGroup>
            </div>
            {(tPrice > 0 || bFee > 0) && (
              <div className="mt-3 p-3 rounded-sm text-xs space-y-1" style={{ background:"rgba(239,1,7,0.06)", border:"1px solid rgba(239,1,7,0.15)" }}>
                <div className="flex justify-between"><span style={{ color:"rgba(255,255,255,0.5)" }}>Ticket</span><span className="text-white">GHS {tPrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span style={{ color:"rgba(255,255,255,0.5)" }}>Booking fee</span><span className="text-white">GHS {bFee.toFixed(2)}</span></div>
                <div className="flex justify-between"><span style={{ color:"rgba(255,255,255,0.5)" }}>Paystack ({pct}%)</span><span style={{ color:"#F59E0B" }}>GHS {charge.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold pt-1" style={{ borderTop:"1px solid rgba(239,1,7,0.2)" }}>
                  <span className="text-white">Total per ticket</span><span style={{ color:"#10B981" }}>GHS {total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <FormGroup label="Match Image URL (optional)" icon="fa-solid fa-image">
            <Input value={form.image||""} onChange={e=>up("image",e.target.value)} placeholder="https://..." />
          </FormGroup>
          <FormGroup label="Notes for Members (optional)" icon="fa-solid fa-note-sticky">
            <Input value={form.notes||""} onChange={e=>up("notes",e.target.value)} placeholder="Any special instructions..." />
          </FormGroup>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button onClick={save}><i className="fa-solid fa-check" />{editId?"Save Changes":"Add Match"}</Button>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
