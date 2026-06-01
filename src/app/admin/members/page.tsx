"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, Member, MemberRole, MemberStatus } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Textarea, Select, Modal, SearchInput, Table, Thead, Th, Tbody, Tr, Td, EmptyState, StatCard, Switch, Alert, FormGroup, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";
import { formatMemberSince } from "@/lib/membershipUtils";

const TIERS    = ["All","Platinum","Gold","Silver","Bronze","Abusua"];
const STATUSES = ["All","Active","Inactive","Frozen","Expired","Pending Renewal"];
const BRANCHES = ["Ashanti","Accra","Ladies","Sunyani","Volta","Central","Northern Regions","Eastern","Western","Tema"];
const ROLES: MemberRole[] = ["member","membership_officer","event_coordinator","events_moderator","ticket_manager","moderator","editor","admin","superadmin"];

const TIER_COLORS:   Record<string,string> = { Platinum:"#E8E8E8",Gold:"#C6A84B",Silver:"#A8A9AD",Bronze:"#CD7F32",Abusua:"#2ECC71" };
const STATUS_COLORS: Record<string,string> = { Active:"#22C55E",Inactive:"#888",Frozen:"#3B82F6",Expired:"#EF4444","Pending Renewal":"#F59E0B" };

const PER_PAGE = 10;

export default function AdminMembersPage() {
  const { members, deleteMember, updateMember, setMembers, deleteAllMembers, settings, updateSettings, addAdminNotification } = useApp();

  const [search,       setSearch]       = useState("");
  const [tierFilter,   setTierFilter]   = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy,       setSortBy]       = useState<"name"|"tier"|"joined"|"status">("name");
  const [sortDir,      setSortDir]      = useState<"asc"|"desc">("asc");
  const [page,         setPage]         = useState(1);
  const [motwModal, setMotwModal] = useState<Member|null>(null);
  const [motwQuote, setMotwQuote] = useState('');
  const currentMotw = settings?.memberOfWeek;
  const [selected,     setSelected]     = useState<number[]>([]);
  const [editId,       setEditId]       = useState<number|null>(null);
  const [editForm,     setEditForm]     = useState<Partial<Member>>({});
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number|null>(null);
  const [roleModal,    setRoleModal]    = useState<Member|null>(null);
  const [newRole,      setNewRole]      = useState<MemberRole>("member");
  const [resetModal,   setResetModal]   = useState<Member|null>(null);
  const [newPassword,  setNewPassword]  = useState("");

  // ── Filtering + sorting ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return members
      .filter(m => {
        const matchSearch = !s || m.firstName.toLowerCase().includes(s) || m.lastName.toLowerCase().includes(s) ||
          m.email.toLowerCase().includes(s) || m.membershipNumber.includes(s) || m.branch.toLowerCase().includes(s);
        const matchTier   = tierFilter   === "All" || m.tier   === tierFilter;
        const matchStatus = statusFilter === "All" || m.status === statusFilter;
        return matchSearch && matchTier && matchStatus;
      })
      .sort((a, b) => {
        let va: string, vb: string;
        if (sortBy==="name")   { va=a.firstName; vb=b.firstName; }
        else if (sortBy==="tier")   { va=a.tier; vb=b.tier; }
        else if (sortBy==="joined") { va=a.joined; vb=b.joined; }
        else { va=a.status; vb=b.status; }
        return sortDir==="asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [members, search, tierFilter, statusFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  // ── Selection ────────────────────────────────────────────────────────────────
  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
  const selectAllPage = () => setSelected(selected.length===paginated.length ? [] : paginated.map(m=>m.id));

  // ── Sort toggle ──────────────────────────────────────────────────────────────
  const toggleSort = (col: typeof sortBy) => {
    if (sortBy===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <i className={`fa-solid fa-sort${sortBy===col?(sortDir==="asc"?"-up":"-down"):"s"} ml-1 text-[9px]`} />
  );

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleFreeze = (m: Member) => {
    const newStatus: MemberStatus = m.status==="Frozen" ? "Active" : "Frozen";
    updateMember(m.id, { status:newStatus });
    const frozenMsg = m.status==="Frozen" ? `${m.firstName} ${m.lastName}'s account has been unfrozen` : `${m.firstName} ${m.lastName}'s account has been frozen`;
    toast.success(m.status==="Frozen" ? `${m.firstName} unfrozen` : `${m.firstName}'s account frozen`);
    addAdminNotification(m.status==="Frozen" ? "Account Unfrozen" : "Account Frozen", frozenMsg, m.status==="Frozen" ? "success" : "warning");
  };

  const handleDelete = (id: number) => {
    deleteMember(id);
    setSelected(s=>s.filter(x=>x!==id));
    setShowDeleteConfirm(null);
    toast.success("Member permanently deleted");
    addAdminNotification("Member Deleted", `A member has been permanently removed from the system.`, "danger");
  };

  const handleBulkDelete = () => {
    selected.forEach(id => deleteMember(id));
    toast.success(`${selected.length} member(s) deleted`);
    addAdminNotification("Bulk Delete", `${selected.length} member(s) have been deleted.`, "danger");
    setSelected([]);
  };

  const handleDeleteAll = () => {
    deleteAllMembers();
    setSelected([]); setConfirmDeleteAll(false);
    toast.success("All members deleted");
  };

  const setAsMOTW = (m: Member) => {
    setMotwQuote((m as any).bio || "");
    setMotwModal(m);
  };
  const confirmMOTW = () => {
    if (!motwModal) return;
    updateSettings({ memberOfWeek: {
      memberId: motwModal.id,
      name: `${motwModal.firstName} ${motwModal.lastName}`,
      photo: motwModal.photo,
      quote: motwQuote || 'Proud Ghana Gooner!',
      tier: motwModal.tier,
      branch: motwModal.branch || 'Accra',
    }});
    toast.success(`${motwModal.firstName} set as Member of the Week!`);
    addAdminNotification("Member of the Week", `${motwModal.firstName} ${motwModal.lastName} has been selected as Member of the Week.`, "success");
    setMotwModal(null);
  };

  const handleResetPassword = () => {
    if (!resetModal || !newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    updateMember(resetModal.id, { password:newPassword });
    toast.success(`Password reset for ${resetModal.firstName} ${resetModal.lastName}`);
    addAdminNotification("Password Reset", `Password was reset for ${resetModal.firstName} ${resetModal.lastName} (#${resetModal.membershipNumber}).`, "info");
    setResetModal(null); setNewPassword("");
  };

  const openEdit = (m: Member) => { setEditId(m.id); setEditForm({ ...m }); };
  const saveEdit = () => {
    if (!editId) return;
    updateMember(editId, editForm);
    setEditId(null); setEditForm({});
    toast.success("Member updated");
    addAdminNotification("Member Updated", `Member profile has been updated by an admin.`, "info");
  };

  const assignRole = () => {
    if (!roleModal) return;
    updateMember(roleModal.id, { role:newRole });
    setRoleModal(null);
    toast.success(`Role assigned: ${newRole.replace(/_/g," ")}`);
    addAdminNotification("Role Changed", `A member's role has been changed to ${newRole.replace(/_/g," ")}.`, "info");
  };

  const exportCSV = () => {
    const rows = [
      ["#","Name","Email","Phone","Tier","Branch","Status","Role","Joined"],
      ...members.map(m=>[m.membershipNumber,`${m.firstName} ${m.lastName}`,m.email,m.phone,m.tier,m.branch,m.status,m.role,m.joined]),
    ].map(r=>r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows],{type:"text/csv"}));
    a.download = "asc-ghana-members.csv";
    a.click();
    toast.success("Members exported");
  };

  const stats = {
    total: members.length,
    active: members.filter(m=>m.status==="Active").length,
    frozen: members.filter(m=>m.status==="Frozen").length,
    expired: members.filter(m=>m.status==="Expired").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>MEMBERS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>{members.length} registered Ghana Gooners</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={exportCSV}><i className="fa-solid fa-file-export" />Export CSV</Button>
          <label className="cursor-pointer">
            <span className="btn-arsenal text-xs px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer"><i className="fa-solid fa-file-import" />Import CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={()=>toast.success("CSV import initiated — connect API to process")} />
          </label>
          <Link href="/admin/members/add"><Button size="sm"><i className="fa-solid fa-user-plus" />Add Member</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Members" value={stats.total}   icon="fa-solid fa-users"         color="#EF0107" />
        <StatCard label="Active"        value={stats.active}  icon="fa-solid fa-circle-check"  color="#22C55E" change={`${Math.round(stats.active/Math.max(stats.total,1)*100)}% of total`} up />
        <StatCard label="Frozen"        value={stats.frozen}  icon="fa-solid fa-snowflake"     color="#3B82F6" />
        <StatCard label="Expired"       value={stats.expired} icon="fa-solid fa-clock-rotate-left" color="#EF4444" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search name, email, # or branch..." />
            <Select value={tierFilter}   onChange={e=>{setTierFilter(e.target.value);setPage(1);}} className="w-36">
              {TIERS.map(t=><option key={t} style={{background:"#0D0B18"}}>{t==="All"?"All Tiers":t}</option>)}
            </Select>
            <Select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}} className="w-44">
              {STATUSES.map(s=><option key={s} style={{background:"#0D0B18"}}>{s==="All"?"All Statuses":s}</option>)}
            </Select>
            {/* Bulk actions */}
            {selected.length > 0 && (
              <div className="flex gap-2 ml-auto flex-wrap">
                <Badge variant="info">{selected.length} selected</Badge>
                <Button variant="secondary" size="sm" onClick={()=>{ selected.forEach(id=>{ const m=members.find(x=>x.id===id); if(m) updateMember(id,{status:m.status==="Frozen"?"Active":"Frozen"}); }); setSelected([]); toast.success("Status toggled"); }}>
                  <i className="fa-solid fa-snowflake" />Toggle Freeze
                </Button>
                <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                  <i className="fa-solid fa-trash" />Delete ({selected.length})
                </Button>
              </div>
            )}
            <Button variant="danger" size="sm" className="ml-auto" onClick={()=>setConfirmDeleteAll(true)}>
              <i className="fa-solid fa-trash-can" />Delete All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <Thead>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={selected.length===paginated.length&&paginated.length>0} onChange={selectAllPage} style={{accentColor:"var(--color-red)"}} />
              </th>
              <Th className="cursor-pointer hover:text-white" onClick={()=>toggleSort("name")}># / Name <SortIcon col="name" /></Th>
              <Th className="cursor-pointer hover:text-white" onClick={()=>toggleSort("tier")}>Tier <SortIcon col="tier" /></Th>
              <Th>Branch</Th>
              <Th className="cursor-pointer hover:text-white" onClick={()=>toggleSort("status")}>Status <SortIcon col="status" /></Th>
              <Th>Role</Th>
              <Th className="cursor-pointer hover:text-white" onClick={()=>toggleSort("joined")}>Member Since <SortIcon col="joined" /></Th>
              <Th>Actions</Th>
            </Thead>
            <Tbody>
              {paginated.map(m => (
                <Tr key={m.id}>
                  <Td>
                    <input type="checkbox" checked={selected.includes(m.id)} onChange={()=>toggleSelect(m.id)} style={{accentColor:"var(--color-red)"}} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                        style={{ background:`${TIER_COLORS[m.tier]||"#C6A84B"}20`,color:TIER_COLORS[m.tier]||"#C6A84B",fontFamily:"var(--font-heading)" }}>
                        {m.photo ? <img src={m.photo} className="w-full h-full object-cover" alt="" /> : `${m.firstName[0]}${m.lastName[0]}`}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{m.firstName} {m.lastName}</p>
                        <p className="text-xs" style={{color:"rgba(255,255,255,0.35)"}}>#{m.membershipNumber} · {m.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge style={{background:`${TIER_COLORS[m.tier]}20`,color:TIER_COLORS[m.tier]}}>{m.tier}</Badge>
                  </Td>
                  <Td className="text-white/50">{m.branch}</Td>
                  <Td>
                    <span className="flex items-center gap-1.5 text-xs" style={{color:STATUS_COLORS[m.status],fontFamily:"var(--font-heading)"}}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{background:STATUS_COLORS[m.status]}} />{m.status}
                    </span>
                  </Td>
                  <Td>
                    <button onClick={()=>{setRoleModal(m);setNewRole(m.role);}}
                      className="text-xs px-2 py-0.5 rounded-sm hover:bg-white/10 transition-colors capitalize"
                      style={{border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.55)",fontFamily:"var(--font-heading)"}}>
                      {m.role.replace(/_/g," ")}
                    </button>
                  </Td>
                  <Td className="text-white/40 text-xs whitespace-nowrap">
                    {(() => { const ms = formatMemberSince(m.joined); return ms.yearsDisplay; })()}
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={()=>openEdit(m)} title="Edit"><i className="fa-solid fa-pen text-xs" /></Button>
                      <Button variant="ghost" size="icon" onClick={()=>handleFreeze(m)} title={m.status==="Frozen"?"Unfreeze":"Freeze"}
                        style={{color:m.status==="Frozen"?"#3B82F6":"rgba(255,255,255,0.4)"}}>
                        <i className="fa-solid fa-snowflake text-xs" />
                      </Button>
                      <Button variant="danger" size="icon" onClick={()=>setShowDeleteConfirm(m.id)} title="Delete">
                        <i className="fa-solid fa-trash text-xs" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {paginated.length===0 && <EmptyState icon="fa-solid fa-users-slash" title="No members found" desc="Try adjusting your search or filters" />}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{color:"rgba(255,255,255,0.35)"}}>
            Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" disabled={page===1} onClick={()=>setPage(p=>p-1)}><i className="fa-solid fa-chevron-left text-xs" /></Button>
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+1).map(n=>(
              <Button key={n} variant={n===page?"primary":"ghost"} size="icon" onClick={()=>setPage(n)}
                style={{width:32,height:32,fontSize:12}}>{n}</Button>
            ))}
            <Button variant="ghost" size="icon" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><i className="fa-solid fa-chevron-right text-xs" /></Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={!!editId} onClose={()=>{setEditId(null);setEditForm({});}} title="Edit Member">
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-3">
            {(["firstName","lastName","email","phone","whatsapp"] as const).map(k=>(
              <div key={k}>
                <label className="text-xs uppercase tracking-wider mb-1 block" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>{k.replace(/([A-Z])/g," $1").trim()}</label>
                <Input value={(editForm as any)[k]||""} onChange={e=>setEditForm(p=>({...p,[k]:e.target.value}))} />
              </div>
            ))}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Tier</label>
              <Select value={editForm.tier||""} onChange={e=>setEditForm(p=>({...p,tier:e.target.value}))}>
                {["Bronze","Silver","Gold","Platinum","Abusua"].map(t=><option key={t} style={{background:"#0D0B18"}}>{t}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Status</label>
              <Select value={editForm.status||""} onChange={e=>setEditForm(p=>({...p,status:e.target.value as MemberStatus}))}>
                {["Active","Inactive","Frozen","Expired","Pending Renewal"].map(s=><option key={s} style={{background:"#0D0B18"}}>{s}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Branch</label>
              <Select value={editForm.branch||""} onChange={e=>setEditForm(p=>({...p,branch:e.target.value}))}>
                {BRANCHES.map(b=><option key={b} style={{background:"#0D0B18"}}>{b}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Membership Number</label>
              <div className="flex gap-2">
                <Input value={(editForm as any).membershipNumber||""} onChange={e=>setEditForm(p=>({...p,membershipNumber:e.target.value}))} placeholder="00001" className="flex-1" />
                <button type="button"
                  onClick={()=>{
                    const maxNum = Math.max(0,...members.filter(m=>m.id!==editId).map(m=>parseInt((m.membershipNumber||"").replace(/[^0-9]/g,""))||0));
                    const next = String(maxNum + 1).padStart(5,"0");
                    setEditForm(p=>({...p,membershipNumber:next}));
                    toast.success("Generated: " + next);
                  }}
                  className="px-3 py-1.5 rounded-sm text-xs font-bold flex-shrink-0"
                  style={{background:"rgba(198,168,75,0.15)",border:"1px solid rgba(198,168,75,0.3)",color:"var(--color-gold)",fontFamily:"var(--font-heading)"}}>
                  <i className="fa-solid fa-wand-magic-sparkles mr-1" />Generate
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Password (set/reset)</label>
              <Input type="text" value={(editForm as any).password||""} onChange={e=>setEditForm(p=>({...p,password:e.target.value}))} placeholder="Set login password for member" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Date of Birth</label>
              <Input type="date" value={(editForm as any).dateOfBirth||""} onChange={e=>setEditForm(p=>({...p,dateOfBirth:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1 block" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>
                Member Since (Year)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={2000}
                  max={new Date().getFullYear()}
                  value={(editForm as any).joined||""}
                  onChange={e=>{
                    const v = e.target.value.replace(/\D/g,"").slice(0,4);
                    setEditForm(p=>({...p,joined:v}));
                  }}
                  placeholder={String(new Date().getFullYear())}
                />
                {(editForm as any).joined && String((editForm as any).joined).length===4 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold pointer-events-none" style={{color:"var(--color-gold)",fontFamily:"var(--font-heading)"}}>
                    {formatMemberSince((editForm as any).joined).yearsCount} yr{formatMemberSince((editForm as any).joined).yearsCount!==1?"s":""}
                  </span>
                )}
              </div>
              <p className="text-[10px] mt-1" style={{color:"rgba(255,255,255,0.3)"}}>4-digit year only (e.g. 2014). Years as a member calculated automatically.</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <Button variant="secondary" onClick={()=>setEditId(null)}>Cancel</Button>
          <Button onClick={saveEdit}><i className="fa-solid fa-save mr-1.5" />Save Changes</Button>
        </div>
      </Modal>

      {/* Role Modal */}
      <Modal open={!!roleModal} onClose={()=>setRoleModal(null)} title={`Assign Role — ${roleModal?.firstName} ${roleModal?.lastName}`} size="sm">
        <div className="p-5 space-y-3">
          <p className="text-xs" style={{color:"rgba(255,255,255,0.5)"}}>Select the role for this member. Roles control what features they can manage in the admin panel.</p>
          <div className="space-y-2">
            {ROLES.map(r=>(
              <button key={r} onClick={()=>setNewRole(r)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-left transition-all"
                style={{background:newRole===r?"rgba(239,1,7,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${newRole===r?"var(--color-red)":"rgba(255,255,255,0.06)"}`}}>
                <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{border:`2px solid ${newRole===r?"var(--color-red)":"rgba(255,255,255,0.2)"}`}}>
                  {newRole===r&&<span className="w-2 h-2 rounded-full" style={{background:"var(--color-red)"}} />}
                </span>
                <span className="text-sm capitalize text-white" style={{fontFamily:"var(--font-heading)"}}>{r.replace(/_/g," ")}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <Button variant="secondary" onClick={()=>setRoleModal(null)}>Cancel</Button>
          <Button onClick={assignRole}><i className="fa-solid fa-user-shield mr-1.5" />Assign Role</Button>
        </div>
      </Modal>

      {/* Single delete confirm */}
      <Modal open={!!showDeleteConfirm} onClose={()=>setShowDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <div className="p-5">
          <Alert variant="error" title="Permanent Action">This will permanently delete the member and all their data. This cannot be undone.</Alert>
        </div>
        <div className="px-5 py-4 flex gap-3 justify-end" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <Button variant="secondary" onClick={()=>setShowDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={()=>handleDelete(showDeleteConfirm!)}><i className="fa-solid fa-trash mr-1.5" />Delete Permanently</Button>
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal open={!!resetModal} onClose={()=>setResetModal(null)} title={`Reset Password — ${resetModal?.firstName} ${resetModal?.lastName}`} size="sm">
        <div className="p-5 space-y-3">
          <div className="p-3 rounded-sm" style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)"}}>
            <p className="text-xs" style={{color:"#F59E0B"}}>⚠️ This will set a new login password for this member immediately.</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>New Password (min 6 chars)</label>
            <Input type="text" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Enter new password" />
          </div>
        </div>
        <div className="px-5 py-4 flex gap-3" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <Button onClick={handleResetPassword} variant="gold"><i className="fa-solid fa-key mr-1.5"/>Reset Password</Button>
          <Button variant="secondary" onClick={()=>setResetModal(null)}>Cancel</Button>
        </div>
      </Modal>


      {/* MOTW Modal */}
      <Modal open={!!motwModal} onClose={()=>setMotwModal(null)} title="Set Member of the Week" size="sm">
        {motwModal && (
          <>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-sm" style={{background:"rgba(198,168,75,0.08)",border:"1px solid rgba(198,168,75,0.2)"}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm" style={{background:"rgba(239,1,7,0.15)",color:"var(--color-red)",fontFamily:"var(--font-heading)"}}>
                  {motwModal.firstName[0]}{motwModal.lastName[0]}
                </div>
                <div>
                  <p className="font-bold text-white text-sm" style={{fontFamily:"var(--font-heading)"}}>{motwModal.firstName} {motwModal.lastName}</p>
                  <p className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>{motwModal.tier} · {motwModal.branch}</p>
                </div>
                <i className="fa-solid fa-star ml-auto text-xl" style={{color:"#F59E0B"}} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Quote / Feature Text</label>
                <RichTextField value={motwQuote} onChange={setMotwQuote} minHeight={120} placeholder="e.g. 'Arsenal Ghana is not just a club — it's family!'" />
              </div>
              <p className="text-xs" style={{color:"rgba(255,255,255,0.35)",fontFamily:"var(--font-body)"}}>This member will appear in the Members spotlight section on the homepage.</p>
            </div>
            <div className="px-5 py-4 flex gap-3" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <Button onClick={confirmMOTW} variant="gold"><i className="fa-solid fa-star mr-1.5" />Set as Member of the Week</Button>
              <Button variant="secondary" onClick={()=>setMotwModal(null)}>Cancel</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete all confirm */}
      <Modal open={confirmDeleteAll} onClose={()=>setConfirmDeleteAll(false)} title="Delete ALL Members" size="sm">
        <div className="p-5 space-y-3">
          <Alert variant="error" title="EXTREME CAUTION">You are about to delete ALL {members.length} members. This is completely irreversible. Consider exporting first.</Alert>
          <p className="text-sm text-center font-bold" style={{color:"#EF4444"}}>Type DELETE to confirm:</p>
          <Input placeholder="Type DELETE to confirm" onChange={e=>{ if(e.target.value==="DELETE"){ setTimeout(()=>handleDeleteAll(),300); }}} />
        </div>
        <div className="px-5 py-4 flex gap-3" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <Button variant="secondary" className="flex-1" onClick={()=>setConfirmDeleteAll(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
