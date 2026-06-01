"use client";
import { useState } from "react";
import { useApp, AdminAccount, MemberRole } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Modal, FormGroup, Input, Select, Table, Thead, Th, Tbody, Tr, Td, EmptyState, SearchInput, Alert } from "@/components/ui";
import toast from "react-hot-toast";

const ROLE_COLORS: Record<string,string> = {
  superadmin:"#C6A84B", admin:"#EF0107", editor:"#3B82F6",
  moderator:"#10B981", ticket_manager:"#8B5CF6",
};
const ROLE_LABELS: Record<string,string> = {
  superadmin:"Super Admin", admin:"Admin", editor:"Editor",
  moderator:"Moderator", ticket_manager:"Ticket Manager",
};
const ROLE_DESCS: Record<string,string> = {
  superadmin:"Full system access — all settings and user management",
  admin:"Full content and member management, no user admin access",
  editor:"Blog, gallery, events — no member or financial data",
  moderator:"Community moderation and suggestions management",
  ticket_manager:"Match ticket listings and ticket request management",
};

const MEMBER_ROLES: {value:MemberRole;label:string;color:string;desc:string}[] = [
  { value:"member",             label:"Standard Member",     color:"#6B7280", desc:"Default member access" },
  { value:"events_moderator",   label:"Events Moderator",    color:"#F59E0B", desc:"Help manage events" },
  { value:"membership_officer", label:"Membership Officer",  color:"#8B5CF6", desc:"Handle membership enquiries" },
  { value:"event_coordinator",  label:"Event Coordinator",   color:"#10B981", desc:"Full event management" },
  { value:"ticket_manager",     label:"Ticket Officer",      color:"#C6A84B", desc:"Manage ticket requests" },
  { value:"moderator",          label:"Community Moderator", color:"#3B82F6", desc:"Moderate community chat" },
  { value:"editor",             label:"Content Editor",      color:"#EC4899", desc:"Manage blog and gallery" },
];

const EMPTY_ACCT = { username:"", name:"", email:"", password:"", role:"editor" as AdminAccount["role"], isActive:true };

export default function RolesPage() {
  const { adminAccounts, setAdminAccounts, updateAdminAccount, deleteAdminAccount, members, updateMember } = useApp();
  const [tab, setTab] = useState<"admins"|"members">("admins");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState<typeof EMPTY_ACCT>({...EMPTY_ACCT});
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleModal, setRoleModal] = useState<any|null>(null);
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>("member");
  const [resetModal, setResetModal] = useState<any|null>(null);
  const [newPass, setNewPass] = useState("");

  const uf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p=>({...p,[k]:e.target.value}));

  const openNew = () => { setForm({...EMPTY_ACCT}); setEditId(null); setShowPass(false); setShowModal(true); };
  const openEdit = (a:AdminAccount) => {
    setForm({ username:a.username, name:a.name, email:a.email, password:"", role:a.role, isActive:a.isActive });
    setEditId(a.id); setShowPass(false); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.name) { toast.error("Username and name required"); return; }
    if (!editId && !form.password) { toast.error("Password required for new accounts"); return; }
    if (form.password && form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    await new Promise(r=>setTimeout(r,400));

    if (editId) {
      const up: Partial<AdminAccount> = { username:form.username, name:form.name, email:form.email, role:form.role, isActive:form.isActive };
      if (form.password) up.password = form.password;
      updateAdminAccount(editId, up);
      toast.success("Admin account updated");
    } else {
      const newAcct: AdminAccount = {
        id: Date.now().toString(), username:form.username, name:form.name,
        email:form.email, password:form.password, role:form.role,
        isActive:form.isActive, createdAt:new Date().toISOString(),
      };
      setAdminAccounts([...adminAccounts, newAcct]);
      toast.success("Admin account created");
    }
    setSaving(false); setShowModal(false);
  };

  const handleDelete = (a:AdminAccount) => {
    if (a.role === "superadmin" && adminAccounts.filter(x=>x.role==="superadmin").length <= 1) {
      toast.error("Cannot delete the only Super Admin"); return;
    }
    if (!confirm(`Delete admin account "${a.name}" (@${a.username})?`)) return;
    deleteAdminAccount(a.id);
    toast.success("Account deleted");
  };

  const handleToggleActive = (a:AdminAccount) => {
    updateAdminAccount(a.id, { isActive:!a.isActive });
    toast.success(a.isActive ? `${a.name} deactivated` : `${a.name} activated`);
  };

  const filteredMembers = members.filter(m => {
    const s = search.toLowerCase();
    return !s || m.firstName.toLowerCase().includes(s) || m.lastName.toLowerCase().includes(s) || m.membershipNumber.includes(s);
  });

  const assignMemberRole = () => {
    if (!roleModal) return;
    updateMember(roleModal.id, { role:newMemberRole });
    toast.success(`${roleModal.firstName} ${roleModal.lastName} — role set to ${MEMBER_ROLES.find(r=>r.value===newMemberRole)?.label}`);
    setRoleModal(null);
  };

  const resetMemberPassword = () => {
    if (!resetModal || !newPass || newPass.length < 6) { toast.error("Minimum 6 characters"); return; }
    updateMember(resetModal.id, { password:newPass });
    toast.success(`Password reset for ${resetModal.firstName} ${resetModal.lastName}`);
    setResetModal(null); setNewPass("");
  };

  const TIER_COLORS: Record<string,string> = { Platinum:"#E8E8E8",Gold:"#C6A84B",Silver:"#A8A9AD",Bronze:"#CD7F32",Abusua:"#2ECC71" };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>ROLES & PERMISSIONS</h1>
        <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Manage admin accounts and assign member roles</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-sm" style={{ background:"rgba(255,255,255,0.04)", width:"fit-content" }}>
        {[["admins","Admin Accounts"],["members","Member Roles"]].map(([val,label])=>(
          <button key={val} onClick={()=>setTab(val as any)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
            style={{ background:tab===val?"var(--color-red)":"transparent", color:tab===val?"white":"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "admins" ? (
        <div className="space-y-4">
          {/* Role definitions */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ROLE_DESCS).map(([slug,desc])=>(
              <div key={slug} className="p-3 rounded-sm" style={{ background:"#16213E", borderLeft:`3px solid ${ROLE_COLORS[slug]||"#888"}` }}>
                <p className="text-sm font-bold" style={{ color:ROLE_COLORS[slug], fontFamily:"var(--font-heading)" }}>{ROLE_LABELS[slug]}</p>
                <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.45)" }}>{desc}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle><i className="fa-solid fa-shield mr-2" style={{ color:"var(--color-red)" }}/>Admin Accounts ({adminAccounts.length})</CardTitle>
                <Button size="sm" onClick={openNew}><i className="fa-solid fa-plus"/>Add Admin</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {adminAccounts.length === 0 ? (
                <EmptyState icon="fa-solid fa-shield" title="No admin accounts" desc="Add an admin account to get started"
                  action={<Button size="sm" onClick={openNew}><i className="fa-solid fa-plus"/>Add First Admin</Button>}/>
              ) : (
                <Table>
                  <Thead><Th>Name</Th><Th>Username</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Actions</Th></Thead>
                  <Tbody>
                    {adminAccounts.map(a=>(
                      <Tr key={a.id}>
                        <Td className="font-semibold text-white">{a.name}</Td>
                        <Td><code className="text-xs px-2 py-0.5 rounded" style={{ background:"rgba(239,1,7,0.1)", color:"var(--color-red)" }}>@{a.username}</code></Td>
                        <Td className="text-xs" style={{ color:"rgba(255,255,255,0.5)" }}>{a.email||"—"}</Td>
                        <Td><span className="text-xs font-bold" style={{ color:ROLE_COLORS[a.role]||"#888" }}>{ROLE_LABELS[a.role]||a.role}</span></Td>
                        <Td>
                          <Badge variant={a.isActive?"success":"default"}>{a.isActive?"Active":"Inactive"}</Badge>
                        </Td>
                        <Td>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={()=>openEdit(a)} title="Edit"><i className="fa-solid fa-pen-to-square text-xs"/></Button>
                            <Button variant="ghost" size="icon" onClick={()=>handleToggleActive(a)} title={a.isActive?"Deactivate":"Activate"}>
                              <i className={`fa-solid ${a.isActive?"fa-toggle-on":"fa-toggle-off"} text-xs`} style={{ color:a.isActive?"#10B981":"#6B7280" }}/>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={()=>handleDelete(a)} className="hover:bg-red-500/15 hover:text-red-400" title="Delete">
                              <i className="fa-solid fa-trash text-xs"/>
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle><i className="fa-solid fa-users mr-2" style={{ color:"var(--color-red)" }}/>Member Roles</CardTitle>
                <SearchInput value={search} onChange={setSearch} placeholder="Search member…"/>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredMembers.length === 0 ? (
                <EmptyState icon="fa-solid fa-users" title="No members found"/>
              ) : (
                <Table>
                  <Thead><Th>Member</Th><Th>Tier</Th><Th>Role</Th><Th>Status</Th><Th>Actions</Th></Thead>
                  <Tbody>
                    {filteredMembers.slice(0,60).map(m=>{
                      const roleInfo = MEMBER_ROLES.find(r=>r.value===m.role)||MEMBER_ROLES[0];
                      return (
                        <Tr key={m.id}>
                          <Td>
                            <p className="font-semibold text-white text-sm">{m.firstName} {m.lastName}</p>
                            <p className="text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>#{m.membershipNumber}</p>
                          </Td>
                          <Td><span className="text-xs font-bold" style={{ color:TIER_COLORS[m.tier]||"#888" }}>{m.tier}</span></Td>
                          <Td><Badge style={{ color:roleInfo.color, background:`${roleInfo.color}15` } as any}>{roleInfo.label}</Badge></Td>
                          <Td><Badge variant={m.status==="Active"?"success":m.status==="Frozen"?"info":"default"}>{m.status}</Badge></Td>
                          <Td>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={()=>{ setRoleModal(m); setNewMemberRole(m.role||"member"); }}>
                                <i className="fa-solid fa-user-shield text-xs"/>Role
                              </Button>
                              <Button variant="ghost" size="sm" onClick={()=>{ setResetModal(m); setNewPass(""); }}>
                                <i className="fa-solid fa-key text-xs"/>Password
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
        </div>
      )}

      {/* Add/Edit Admin Modal */}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editId?"Edit Admin Account":"Add Admin Account"} size="sm">
        <div className="p-5 space-y-3">
          {editId && <Alert variant="info">Leave password blank to keep the current password.</Alert>}
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Full Name *" icon="fa-solid fa-user"><Input value={form.name} onChange={uf("name")} placeholder="Display name"/></FormGroup>
            <FormGroup label="Username *" icon="fa-solid fa-at"><Input value={form.username} onChange={uf("username")} placeholder="username"/></FormGroup>
            <FormGroup label="Email" icon="fa-solid fa-envelope"><Input type="email" value={form.email} onChange={uf("email")} placeholder="email@example.com"/></FormGroup>
            <FormGroup label={editId?"New Password (optional)":"Password *"} icon="fa-solid fa-lock">
              <div className="relative">
                <Input type={showPass?"text":"password"} value={form.password} onChange={uf("password")} placeholder={editId?"Leave blank to keep":"Min 6 characters"}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>
                  <i className={`fa-solid ${showPass?"fa-eye-slash":"fa-eye"}`}/>
                </button>
              </div>
            </FormGroup>
            <FormGroup label="Role" icon="fa-solid fa-shield">
              <Select value={form.role} onChange={uf("role")}>
                {Object.entries(ROLE_LABELS).map(([val,label])=><option key={val} value={val}>{label}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Status" icon="fa-solid fa-circle">
              <Select value={form.isActive?"active":"inactive"} onChange={e=>setForm(p=>({...p,isActive:e.target.value==="active"}))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormGroup>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button onClick={handleSave} disabled={saving}>
            {saving?<><i className="fa-solid fa-spinner fa-spin"/>Saving…</>:<><i className="fa-solid fa-check"/>{editId?"Save Changes":"Create Account"}</>}
          </Button>
          <Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Member Role Modal */}
      <Modal open={!!roleModal} onClose={()=>setRoleModal(null)} title={`Set Role — ${roleModal?.firstName} ${roleModal?.lastName}`} size="sm">
        <div className="p-5 space-y-3">
          {MEMBER_ROLES.map(r=>(
            <button key={r.value} onClick={()=>setNewMemberRole(r.value)}
              className="w-full flex items-center gap-3 p-3 rounded-sm text-left transition-all"
              style={{ background:newMemberRole===r.value?"rgba(239,1,7,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${newMemberRole===r.value?"var(--color-red)":"rgba(255,255,255,0.06)"}` }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:r.color }}/>
              <div>
                <p className="text-sm font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{r.label}</p>
                <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button onClick={assignMemberRole}><i className="fa-solid fa-check"/>Assign Role</Button>
          <Button variant="secondary" onClick={()=>setRoleModal(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal open={!!resetModal} onClose={()=>setResetModal(null)} title={`Reset Password — ${resetModal?.firstName} ${resetModal?.lastName}`} size="sm">
        <div className="p-5 space-y-3">
          <Alert variant="warning">This immediately changes the member's login password.</Alert>
          <FormGroup label="New Password (min 6 chars)" icon="fa-solid fa-key">
            <Input type="text" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Enter new password"/>
          </FormGroup>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="gold" onClick={resetMemberPassword}><i className="fa-solid fa-key"/>Reset Password</Button>
          <Button variant="secondary" onClick={()=>setResetModal(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
