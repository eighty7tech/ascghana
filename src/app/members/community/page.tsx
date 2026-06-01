"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { FrozenBanner, ExpiredBanner } from "@/components/MembershipGate";
import type { CommunityPost } from "@/context/AppContext";

const TIER_COLORS: Record<string,string> = {
  Platinum:"#E8E8E8", Gold:"#C6A84B", Silver:"#A8A9AD", Bronze:"#CD7F32", Abusua:"#2ECC71",
};

export default function CommunityPage() {
  const { user, isLoggedIn, isFrozen, isExpired } = useAuth();
  const { communityPosts, addCommunityPost, deleteCommunityPost, communityChannels } = useApp();
  const router = useRouter();
  const [channel, setChannel] = useState("general");
  const [input, setInput] = useState("");
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!isLoggedIn) router.push("/auth/login"); }, [isLoggedIn, router]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [channel, communityPosts.length]);

  if (!isLoggedIn || !user) return null;

  if (isFrozen) return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-24"><FrozenBanner /></div>
      <Footer />
    </main>
  );

  if (isExpired) return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-24"><ExpiredBanner featureName="Community Forum" /></div>
      <Footer />
    </main>
  );

  const sendMessage = () => {
    if (!input.trim()) return;
    addCommunityPost({
      channelId: channel,
      userId: user.id,
      userName: user.name,
      userInitials: user.firstName[0] + user.lastName[0],
      userPhoto: user.photo,
      userTier: user.tier,
      userTierColor: TIER_COLORS[user.tier] || "#C6A84B",
      text: input.trim(),
    });
    setInput("");
  };

  const handleDelete = (id: number) => {
    deleteCommunityPost(id);
    setConfirmDeleteId(null);
  };

  const tierColor = (tier: string) => TIER_COLORS[tier] || "#C6A84B";
  const currentChannel = communityChannels.find(c => c.id === channel);
  const channelPosts = communityPosts
    .filter(p => p.channelId === channel)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-GB", { day:"numeric", month:"short" });
  };

  const isOwn = (post: CommunityPost) => post.userId === user.id;
  const canDelete = (post: CommunityPost) =>
    post.userId === user.id || ["admin","superadmin","moderator","events_moderator"].includes(user.role);

  return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-20 flex" style={{ height:"calc(100vh - 0px)" }}>

        {/* Mobile sidebar overlay */}
        {mobileShowSidebar && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/70"
            onClick={() => setMobileShowSidebar(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`
            ${mobileShowSidebar ? "flex" : "hidden"} lg:flex flex-col w-60 flex-shrink-0
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          `}
          style={{ background:"var(--bg-secondary)", borderRight:"1px solid var(--border-color)", top: mobileShowSidebar ? 0 : "auto" }}
        >
          <div className="px-4 py-4" style={{ borderBottom:"1px solid var(--border-color)" }}>
            <p className="font-black text-sm text-white mb-0.5" style={{ fontFamily:"var(--font-display)" }}>COMMUNITY</p>
            <p className="text-[10px]" style={{ color:"var(--text-muted)" }}>Members-only · Realtime</p>
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto py-2">
            <p className="px-4 py-1 text-[9px] font-bold uppercase tracking-widest"
              style={{ color:"var(--text-disabled)", fontFamily:"var(--font-heading)" }}>Channels</p>
            {communityChannels.map(ch => {
              const unread = communityPosts.filter(p => p.channelId === ch.id).length;
              return (
                <button key={ch.id} onClick={() => { setChannel(ch.id); setMobileShowSidebar(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all"
                  style={{
                    background: channel===ch.id ? "rgba(239,1,7,0.08)" : "transparent",
                    borderLeft: channel===ch.id ? "2px solid var(--color-red)" : "2px solid transparent",
                    color: channel===ch.id ? "white" : "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                  }}>
                  <span className="flex items-center gap-2.5">
                    <i className={`${ch.icon} text-[11px] flex-shrink-0`}
                      style={{ color: channel===ch.id ? "var(--color-red)" : "var(--text-disabled)" }} />
                    {ch.name}
                  </span>
                  {unread > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background:"rgba(239,1,7,0.15)", color:"var(--color-red)" }}>
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* User footer */}
          <div className="p-3" style={{ borderTop:"1px solid var(--border-color)" }}>
            <div className="flex items-center gap-2">
              {user.photo ? (
                <img src={user.photo} alt={user.firstName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  style={{ border:`1.5px solid ${TIER_COLORS[user.tier] || "#C6A84B"}` }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background:`${tierColor(user.tier)}20`, color:tierColor(user.tier), fontFamily:"var(--font-heading)" }}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color:"var(--text-primary)" }}>{user.firstName}</p>
                <p className="text-[10px] truncate" style={{ color:tierColor(user.tier) }}>{user.tier}</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background:"#22C55E" }} />
            </div>
          </div>
        </aside>

        {/* Main chat */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Channel header */}
          <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ background:"var(--bg-card)", borderBottom:"1px solid var(--border-color)" }}>
            <button onClick={() => setMobileShowSidebar(true)}
              className="lg:hidden transition-colors mr-1"
              style={{ color:"rgba(255,255,255,0.4)" }}>
              <i className="fa-solid fa-bars" />
            </button>
            <i className={`${currentChannel?.icon || "fa-solid fa-hashtag"} text-sm`}
              style={{ color:"var(--color-red)" }} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white truncate"
                style={{ fontFamily:"var(--font-heading)" }}>{currentChannel?.name}</p>
              <p className="text-xs truncate" style={{ color:"var(--text-muted)" }}>
                {currentChannel?.desc} · {channelPosts.length} message{channelPosts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {channelPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px]"
                style={{ color:"var(--text-muted)" }}>
                <div className="w-16 h-16 rounded-sm flex items-center justify-center mb-4"
                  style={{ background:"rgba(239,1,7,0.06)", border:"1px solid rgba(239,1,7,0.12)" }}>
                  <i className="fa-solid fa-comments text-2xl opacity-30" style={{ color:"var(--color-red)" }} />
                </div>
                <p className="font-bold text-sm mb-1" style={{ fontFamily:"var(--font-heading)" }}>
                  No messages yet
                </p>
                <p className="text-xs text-center max-w-xs" style={{ fontFamily:"var(--font-body)" }}>
                  Be the first to post in #{currentChannel?.name}. Start the conversation!
                </p>
              </div>
            ) : (
              channelPosts.map((post, i) => {
                const prevPost = channelPosts[i - 1];
                const groupWithPrev = prevPost && prevPost.userId === post.userId &&
                  (new Date(post.createdAt).getTime() - new Date(prevPost.createdAt).getTime()) < 5 * 60000;
                const own = isOwn(post);
                const tc = post.userTierColor || tierColor(post.userTier);

                return (
                  <div key={post.id}
                    className={`flex items-end gap-2.5 group ${own ? "flex-row-reverse" : ""} ${groupWithPrev ? "mt-0.5" : "mt-4"}`}>
                    {/* Avatar — only on first of group */}
                    {!groupWithPrev ? (
                      post.userPhoto ? (
                        <img src={post.userPhoto} alt={post.userName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-0.5"
                          style={{ border:`1.5px solid ${tc}` }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex-shrink-0 mb-0.5 flex items-center justify-center text-[11px] font-black"
                          style={{ background:`${tc}20`, color:tc, fontFamily:"var(--font-heading)" }}>
                          {post.userInitials}
                        </div>
                      )
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    <div className={`flex flex-col max-w-xs lg:max-w-md ${own ? "items-end" : "items-start"}`}>
                      {!groupWithPrev && (
                        <div className={`flex items-center gap-2 mb-1 ${own ? "flex-row-reverse" : ""}`}>
                          <span className="text-xs font-bold" style={{ color: own ? "var(--color-red)" : tc }}>
                            {own ? "You" : post.userName}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold"
                            style={{ background:`${tc}18`, color:tc, fontFamily:"var(--font-heading)" }}>
                            {post.userTier}
                          </span>
                          <span className="text-[10px]" style={{ color:"var(--text-disabled)" }}>
                            {formatTime(post.createdAt)}
                          </span>
                        </div>
                      )}

                      <div className="relative flex items-end gap-1">
                        <div className="px-3 py-2 text-sm break-words"
                          style={{
                            background: own ? "rgba(239,1,7,0.12)" : "var(--bg-card)",
                            color: "var(--text-primary)",
                            border: `1px solid ${own ? "rgba(239,1,7,0.2)" : "var(--border-color)"}`,
                            borderRadius: own
                              ? (groupWithPrev ? "12px 4px 4px 12px" : "12px 4px 12px 12px")
                              : (groupWithPrev ? "4px 12px 12px 4px" : "4px 12px 12px 12px"),
                          }}>
                          {post.text}
                        </div>

                        {/* Delete button — shows on hover */}
                        {canDelete(post) && (
                          <button
                            onClick={() => setConfirmDeleteId(post.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ background:"rgba(239,1,7,0.12)", color:"rgba(239,1,7,0.6)" }}
                            title="Delete message">
                            <i className="fa-solid fa-trash text-[9px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Delete confirm */}
          {confirmDeleteId !== null && (
            <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between"
              style={{ background:"rgba(239,1,7,0.08)", borderTop:"1px solid rgba(239,1,7,0.2)" }}>
              <p className="text-xs" style={{ color:"var(--text-secondary)", fontFamily:"var(--font-body)" }}>
                Delete this message?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteId(null)}
                  className="text-xs px-3 py-1.5 font-bold"
                  style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirmDeleteId)}
                  className="text-xs px-3 py-1.5 font-bold"
                  style={{ background:"var(--color-red)", color:"#fff", fontFamily:"var(--font-heading)" }}>
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 flex-shrink-0"
            style={{ background:"var(--bg-card)", borderTop:"1px solid var(--border-color)" }}>
            <div className="flex items-center gap-3 px-4 py-2.5"
              style={{ background:"var(--bg-primary)", border:"1px solid var(--border-color)" }}>
              {user.photo ? (
                <img src={user.photo} alt=""
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  style={{ border:`1px solid ${TIER_COLORS[user.tier] || "#C6A84B"}` }} />
              ) : (
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black"
                  style={{ background:`${tierColor(user.tier)}20`, color:tierColor(user.tier) }}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                placeholder={`Message #${currentChannel?.name}…`}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color:"var(--text-primary)", caretColor:"var(--color-red)", fontFamily:"var(--font-body)" }}
              />
              <button onClick={sendMessage} disabled={!input.trim()}
                className="w-8 h-8 flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background:input.trim() ? "var(--color-red)" : "transparent" }}>
                <i className="fa-solid fa-paper-plane text-xs text-white" />
              </button>
            </div>
            <p className="text-[10px] mt-1.5 text-center"
              style={{ color:"var(--text-disabled)", fontFamily:"var(--font-body)" }}>
              Press Enter to send · Be respectful · All messages are saved
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
