"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Switch } from "@/components/ui";
import FaIconPicker from "@/components/admin/FaIconPicker";
import toast from "react-hot-toast";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";

type MegaLink = { id: string; label: string; href: string; icon: string; desc?: string };
type MegaColumn = { title: string; links: MegaLink[] };
type MenuType = "link" | "dropdown" | "mega";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  target: "_self" | "_blank";
  visible: boolean;
  menuType?: MenuType;
  mega?: boolean;
  columns?: MegaColumn[];
  children?: { id: string; label: string; href: string; icon: string; desc?: string }[];
}

const defaultMenuItems: MenuItem[] = [
  { id: "home", label: "Home", href: "/", icon: "fa-solid fa-house", target: "_self", visible: true, menuType: "link" },
  {
    id: "club",
    label: "Club",
    href: "#",
    icon: "fa-solid fa-shield-halved",
    target: "_self",
    visible: true,
    menuType: "mega",
    mega: true,
    columns: [
      {
        title: "About ASC Ghana",
        links: [
          { id: "about", label: "About Us", href: "/about", icon: "fa-solid fa-shield-halved", desc: "Our story & values" },
          { id: "stats", label: "Season Stats", href: "/season-stats", icon: "fa-solid fa-chart-bar", desc: "Season performance" },
          { id: "docs", label: "Club Documents", href: "/documents", icon: "fa-solid fa-folder-open", desc: "Resources" },
          { id: "exco", label: "Exco Members", href: "/about/exco", icon: "fa-solid fa-users", desc: "Leadership" },
        ],
      },
      {
        title: "Get Involved",
        links: [
          { id: "join", label: "Join Membership", href: "/membership/register", icon: "fa-solid fa-id-card", desc: "Become a member" },
          { id: "forum", label: "Community Forum", href: "/members/community", icon: "fa-solid fa-comments", desc: "Members chat" },
          { id: "shop", label: "Shop", href: "/shop", icon: "fa-solid fa-bag-shopping", desc: "Merchandise" },
        ],
      },
    ],
  },
  {
    id: "matches",
    label: "Matches",
    href: "#",
    icon: "fa-solid fa-futbol",
    target: "_self",
    visible: true,
    menuType: "dropdown",
    children: [
      { id: "tix", label: "Match Tickets", href: "/members/tickets", icon: "fa-solid fa-ticket" },
      { id: "events", label: "Watch Parties", href: "/events", icon: "fa-solid fa-tv" },
    ],
  },
  { id: "events", label: "Events", href: "/events", icon: "fa-solid fa-calendar-days", target: "_self", visible: true, menuType: "link" },
  { id: "blog", label: "Blog", href: "/blog", icon: "fa-solid fa-newspaper", target: "_self", visible: true, menuType: "link" },
  { id: "shop", label: "Shop", href: "/shop", icon: "fa-solid fa-bag-shopping", target: "_self", visible: true, menuType: "link" },
  { id: "contact", label: "Contact", href: "/contact", icon: "fa-solid fa-envelope", target: "_self", visible: true, menuType: "link" },
];

function normalizeMenuItem(raw: MenuItem): MenuItem {
  const menuType: MenuType =
    raw.menuType || (raw.mega || raw.columns?.length ? "mega" : raw.children?.length ? "dropdown" : "link");
  return {
    ...raw,
    menuType,
    mega: menuType === "mega",
    columns: menuType === "mega" ? raw.columns || [] : undefined,
    children: menuType === "dropdown" ? raw.children || [] : undefined,
  };
}

export default function MenuSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as { menuItems?: MenuItem[] };
  const [items, setItems] = useState<MenuItem[]>(
    (s.menuItems?.length ? s.menuItems : defaultMenuItems).map(normalizeMenuItem)
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [topBarItems, setTopBarItems] = useState(settings.topBarItems?.map((i) => ({ ...i })) || []);

  const update = (id: string, field: string, val: unknown) =>
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next = { ...it, [field]: val } as MenuItem;
        if (field === "menuType") {
          const t = val as MenuType;
          next.menuType = t;
          next.mega = t === "mega";
          if (t === "mega" && !next.columns?.length) {
            next.columns = [{ title: "Section", links: [] }];
          }
          if (t === "dropdown" && !next.children?.length) next.children = [];
          if (t === "link") {
            delete next.columns;
            delete next.children;
          }
        }
        return normalizeMenuItem(next);
      })
    );

  const updateChild = (parentId: string, childId: string, field: string, val: string) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === parentId
          ? { ...it, children: it.children?.map((c) => (c.id === childId ? { ...c, [field]: val } : c)) }
          : it
      )
    );

  const updateMegaLink = (itemId: string, colIdx: number, linkId: string, field: string, val: string) =>
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId || !it.columns) return it;
        const columns = it.columns.map((col, i) =>
          i !== colIdx
            ? col
            : {
                ...col,
                links: col.links.map((l) => (l.id === linkId ? { ...l, [field]: val } : l)),
              }
        );
        return { ...it, columns };
      })
    );

  const addItem = () => {
    const id = Date.now().toString();
    setItems((prev) => [
      ...prev,
      { id, label: "New Link", href: "/", icon: "fa-solid fa-link", target: "_self", visible: true, menuType: "link" },
    ]);
  };

  const addChild = (parentId: string) => {
    const id = Date.now().toString();
    setItems((prev) =>
      prev.map((it) =>
        it.id === parentId
          ? { ...it, children: [...(it.children || []), { id, label: "Sub Link", href: "/", icon: "fa-solid fa-angle-right" }] }
          : it
      )
    );
  };

  const addMegaColumn = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, columns: [...(it.columns || []), { title: "New Column", links: [] }] }
          : it
      )
    );
  };

  const addMegaLink = (itemId: string, colIdx: number) => {
    const id = Date.now().toString();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId || !it.columns) return it;
        const columns = it.columns.map((col, i) =>
          i !== colIdx
            ? col
            : { ...col, links: [...col.links, { id, label: "Link", href: "/", icon: "fa-solid fa-link", desc: "" }] }
        );
        return { ...it, columns };
      })
    );
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const removeChild = (parentId: string, childId: string) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === parentId ? { ...it, children: it.children?.filter((c) => c.id !== childId) } : it
      )
    );
  const removeMegaLink = (itemId: string, colIdx: number, linkId: string) =>
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId || !it.columns) return it;
        const columns = it.columns.map((col, i) =>
          i !== colIdx ? col : { ...col, links: col.links.filter((l) => l.id !== linkId) }
        );
        return { ...it, columns };
      })
    );

  const addTopBarItem = () =>
    setTopBarItems((p) => [...p, { id: Date.now(), label: "New", href: "/", icon: "fa-solid fa-link" }]);
  const removeTopBarItem = (i: number) => setTopBarItems((p) => p.filter((_, j) => j !== i));
  const updateTopBar = (i: number, k: string, v: string) =>
    setTopBarItems((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const save = async () => {
    setSaving(true);
    const payload = items.map(normalizeMenuItem);
    await updateSettings({ menuItems: payload, topBarItems } as Partial<typeof settings>);
    setSaving(false);
    toast.success("Menu settings saved!");
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
            MENU & NAVIGATION
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Links, dropdowns, mega-menu columns & top bar · Colors in{" "}
            <a href="/admin/settings/appearance" className="underline" style={{ color: "var(--color-gold)" }}>
              Theme & Appearance
            </a>
            {" "}· Fonts in{" "}
            <a href="/admin/settings/fonts" className="underline" style={{ color: "var(--color-gold)" }}>
              Typography
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-sm font-bold transition-all"
            style={{
              background: "rgba(198,168,75,0.1)",
              border: "1px solid rgba(198,168,75,0.3)",
              color: "var(--color-gold)",
              fontFamily: "var(--font-heading)",
            }}
          >
            <Plus size={12} />
            Add Nav Item
          </button>
          <button onClick={save} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2 text-sm">
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-xs" />
                Saving…
              </>
            ) : (
              <>
                <i className="fa-solid fa-save text-xs" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-5 rounded-sm space-y-2" style={{ background: "#16213E", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          <i className="fa-solid fa-bars mr-2" style={{ color: "var(--color-red)" }} />
          Main Navigation
        </h2>
        {items.map((item) => (
          <div key={item.id} className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 p-3 flex-wrap" style={{ background: "rgba(255,255,255,0.02)" }}>
              <GripVertical size={14} className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
              <Switch checked={item.visible} onChange={(v) => update(item.id, "visible", v)} />
              <input
                value={item.label}
                onChange={(e) => update(item.id, "label", e.target.value)}
                className="input-arsenal w-28 text-xs"
                placeholder="Label"
              />
              <input
                value={item.href}
                onChange={(e) => update(item.id, "href", e.target.value)}
                className="input-arsenal flex-1 min-w-[120px] text-xs"
                placeholder="/path"
              />
              <FaIconPicker value={item.icon} onChange={(v) => update(item.id, "icon", v)} compact />
              <select
                value={item.menuType || "link"}
                onChange={(e) => update(item.id, "menuType", e.target.value)}
                className="input-arsenal w-28 text-xs"
                title="Menu type"
              >
                <option value="link">Link</option>
                <option value="dropdown">Dropdown</option>
                <option value="mega">Mega Menu</option>
              </select>
              <select
                value={item.target}
                onChange={(e) => update(item.id, "target", e.target.value)}
                className="input-arsenal w-24 text-xs"
              >
                <option value="_self">Self</option>
                <option value="_blank">New Tab</option>
              </select>
              {item.menuType === "dropdown" && (
                <button
                  onClick={() => addChild(item.id)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  title="Add dropdown item"
                  style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <ChevronDown size={11} />
                </button>
              )}
              {item.menuType === "mega" && (
                <button
                  onClick={() => addMegaColumn(item.id)}
                  className="text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title="Add mega column"
                  style={{ color: "var(--color-gold)", border: "1px solid rgba(198,168,75,0.25)" }}
                >
                  <LayoutGrid size={11} />
                </button>
              )}
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{
                  color:
                    (item.children?.length || 0) + (item.columns?.reduce((a, c) => a + c.links.length, 0) || 0)
                      ? "var(--color-gold)"
                      : "rgba(255,255,255,0.2)",
                }}
              >
                {(item.children?.length || 0) +
                  (item.columns?.reduce((a, c) => a + c.links.length, 0) || 0)}
              </button>
              <button onClick={() => removeItem(item.id)} className="text-red-400/40 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>

            {expanded === item.id && item.menuType === "dropdown" && item.children && item.children.length > 0 && (
              <div className="pl-8 pr-3 pb-3 pt-1 space-y-1.5" style={{ background: "rgba(0,0,0,0.2)" }}>
                <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-heading)" }}>
                  <ChevronRight size={9} className="inline mr-1" />
                  Dropdown Items
                </p>
                {item.children.map((child) => (
                  <div key={child.id} className="flex items-center gap-2 flex-wrap">
                    <input
                      value={child.label}
                      onChange={(e) => updateChild(item.id, child.id, "label", e.target.value)}
                      className="input-arsenal w-28 text-xs"
                      placeholder="Label"
                    />
                    <input
                      value={child.href}
                      onChange={(e) => updateChild(item.id, child.id, "href", e.target.value)}
                      className="input-arsenal flex-1 min-w-[120px] text-xs"
                      placeholder="/path"
                    />
                    <FaIconPicker value={child.icon} onChange={(v) => updateChild(item.id, child.id, "icon", v)} compact />
                    <button
                      onClick={() => removeChild(item.id, child.id)}
                      className="text-red-400/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addChild(item.id)} className="flex items-center gap-1 text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <Plus size={10} />
                  Add sub-item
                </button>
              </div>
            )}

            {expanded === item.id && item.menuType === "mega" && item.columns && (
              <div className="pl-6 pr-3 pb-3 pt-1 space-y-4" style={{ background: "rgba(0,0,0,0.25)" }}>
                <p className="text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-heading)" }}>
                  <LayoutGrid size={9} className="inline mr-1" />
                  Mega Menu Columns (uses site menu CSS variables)
                </p>
                {item.columns.map((col, colIdx) => (
                  <div key={colIdx} className="p-3 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    <input
                      value={col.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setItems((prev) =>
                          prev.map((it) => {
                            if (it.id !== item.id || !it.columns) return it;
                            const columns = it.columns.map((c, i) => (i === colIdx ? { ...c, title } : c));
                            return { ...it, columns };
                          })
                        );
                      }}
                      className="input-arsenal w-full text-xs mb-2 font-bold"
                      placeholder="Column title"
                    />
                    {col.links.map((link) => (
                      <div key={link.id} className="flex items-center gap-2 flex-wrap mb-1.5">
                        <input
                          value={link.label}
                          onChange={(e) => updateMegaLink(item.id, colIdx, link.id, "label", e.target.value)}
                          className="input-arsenal w-24 text-xs"
                          placeholder="Label"
                        />
                        <input
                          value={link.href}
                          onChange={(e) => updateMegaLink(item.id, colIdx, link.id, "href", e.target.value)}
                          className="input-arsenal flex-1 min-w-[100px] text-xs"
                          placeholder="/path"
                        />
                        <input
                          value={link.desc || ""}
                          onChange={(e) => updateMegaLink(item.id, colIdx, link.id, "desc", e.target.value)}
                          className="input-arsenal w-32 text-xs hidden sm:block"
                          placeholder="Description"
                        />
                        <FaIconPicker value={link.icon} onChange={(v) => updateMegaLink(item.id, colIdx, link.id, "icon", v)} compact />
                        <button
                          onClick={() => removeMegaLink(item.id, colIdx, link.id)}
                          className="text-red-400/40 hover:text-red-400"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addMegaLink(item.id, colIdx)}
                      className="flex items-center gap-1 text-xs mt-1"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      <Plus size={10} />
                      Add link
                    </button>
                  </div>
                ))}
                <button onClick={() => addMegaColumn(item.id)} className="text-xs font-bold" style={{ color: "var(--color-gold)" }}>
                  + Add column
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-5 rounded-sm space-y-3" style={{ background: "#16213E", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-heading)" }}>
            <i className="fa-solid fa-grip-lines mr-2" style={{ color: "var(--color-red)" }} />
            Top Bar Quick Links
          </h2>
          <button
            onClick={addTopBarItem}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-bold"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-heading)" }}
          >
            <Plus size={10} />
            Add
          </button>
        </div>
        {topBarItems.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2 flex-wrap">
            <input
              value={item.label}
              onChange={(e) => updateTopBar(i, "label", e.target.value)}
              className="input-arsenal w-28 text-sm"
              placeholder="Label"
            />
            <input
              value={item.href}
              onChange={(e) => updateTopBar(i, "href", e.target.value)}
              className="input-arsenal flex-1 min-w-[140px] text-sm"
              placeholder="/path or URL"
            />
            <FaIconPicker value={item.icon} onChange={(v) => updateTopBar(i, "icon", v)} compact />
            <button onClick={() => removeTopBarItem(i)} className="text-red-400/40 hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        <i className="fa-solid fa-circle-info mr-1" />
        Mega menus use <code className="text-[var(--color-red)]">--menu-dropdown-*</code> and{" "}
        <code className="text-[var(--color-red)]">--menu-mega-*</code> tokens from Theme & Appearance. Button styles apply via{" "}
        <a href="/admin/settings/buttons" className="underline" style={{ color: "var(--color-gold)" }}>
          Button Styles
        </a>
        .
      </p>
    </div>
  );
}
