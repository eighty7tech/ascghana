"use client";
import { useState } from "react";
import { useApp, ContactMessage } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Modal, EmptyState, SearchInput, Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui";
import toast from "react-hot-toast";

export default function AdminMessagesPage() {
  const { contactMessages, updateContactMessage, deleteContactMessage } = useApp();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ContactMessage|null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = contactMessages.filter(m => {
    const s = search.toLowerCase();
    return !s || m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || m.subject.toLowerCase().includes(s);
  });

  const unread = contactMessages.filter(m => !m.read).length;

  const openMsg = (m: ContactMessage) => {
    setView(m);
    if (!m.read) updateContactMessage(m.id, { read:true });
  };

  const markReplied = () => {
    if (!view) return;
    updateContactMessage(view.id, { replied:true });
    toast.success("Message marked as replied");
    setView(null);
  };

  const handleDelete = (id:string) => {
    if (!confirm("Delete this message?")) return;
    deleteContactMessage(id);
    if (view?.id === id) setView(null);
    toast.success("Message deleted");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>CONTACT MESSAGES</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
            {unread} unread · {contactMessages.length} total — from the contact form
          </p>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search messages…"/>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon="fa-solid fa-envelope" title="No messages yet" desc="Contact form submissions will appear here"/>
          ) : (
            <Table>
              <Thead>
                <Th>Sender</Th><Th>Subject</Th><Th>Date</Th><Th>Status</Th><Th>Actions</Th>
              </Thead>
              <Tbody>
                {filtered.map(m => (
                  <Tr key={m.id} onClick={() => openMsg(m)} className="cursor-pointer" style={{ background:!m.read?"rgba(239,1,7,0.03)":"transparent" }}>
                    <Td>
                      <div className="flex items-center gap-2">
                        {!m.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:"var(--color-red)" }}/>}
                        <div>
                          <p className="font-semibold text-white text-sm" style={{ fontFamily:"var(--font-heading)" }}>{m.name}</p>
                          <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>{m.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm">{m.subject}</Td>
                    <Td className="text-xs">{new Date(m.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</Td>
                    <Td>
                      {m.replied ? <Badge variant="success">Replied</Badge>
                        : m.read ? <Badge variant="info">Read</Badge>
                        : <Badge variant="warning">Unread</Badge>}
                    </Td>
                    <Td>
                      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={()=>openMsg(m)} title="View">
                          <i className="fa-solid fa-eye text-xs"/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={()=>handleDelete(m.id)} className="hover:bg-red-500/15 hover:text-red-400" title="Delete">
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

      {/* Message detail modal */}
      <Modal open={!!view} onClose={()=>setView(null)} title="Message" size="md">
        {view && (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{view.name}</p>
                <a href={`mailto:${view.email}`} className="text-sm" style={{ color:"var(--color-red)" }}>{view.email}</a>
              </div>
              <p className="text-xs flex-shrink-0" style={{ color:"rgba(255,255,255,0.4)" }}>
                {new Date(view.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
              </p>
            </div>
            <div className="p-4 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
                Subject: {view.subject}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color:"rgba(255,255,255,0.7)", fontFamily:"var(--font-body)" }}>{view.message}</p>
            </div>
            <div className="flex gap-3 pt-2 flex-wrap">
              <a href={`mailto:${view.email}?subject=Re: ${encodeURIComponent(view.subject)}`}
                className="btn-arsenal px-4 py-2 text-sm inline-flex items-center gap-2" onClick={markReplied}>
                <i className="fa-solid fa-reply"/>Reply via Email
              </a>
              {!view.replied && (
                <Button variant="secondary" onClick={markReplied}>Mark as Replied</Button>
              )}
              <Button variant="danger" onClick={()=>handleDelete(view.id)}>
                <i className="fa-solid fa-trash text-xs"/>Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
