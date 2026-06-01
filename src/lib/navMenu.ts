export interface MegaCol {
  title: string;
  links: { label: string; href: string; icon: string; desc?: string }[];
}

export interface NavItem {
  label: string;
  href: string;
  mega?: boolean;
  columns?: MegaCol[];
  dropdown?: { label: string; href: string; icon?: string }[];
}

/** Map admin `menuItems` JSON to navbar `NavItem[]` (supports mega columns). */
export function mapDbMenuItems(dbMenuItems: unknown[]): NavItem[] {
  if (!dbMenuItems?.length) return [];

  const items = dbMenuItems as Record<string, unknown>[];

  return items
    .filter((m) => m.visible !== false && !m.parent_id)
    .map((m) => {
      const label = String(m.label ?? "");
      const href = String(m.href ?? "/");
      const isMega = m.menuType === "mega" || m.mega === true;
      const columns = Array.isArray(m.columns) ? (m.columns as MegaCol[]) : undefined;

      const childRows = Array.isArray(m.children)
        ? (m.children as Record<string, unknown>[])
        : items.filter(
            (c) => c.parent_id === m.id || (m.id && c.parent_id === m.id)
          );

      const dropdown = childRows.map((c) => ({
        label: String(c.label ?? ""),
        href: String(c.href ?? "/"),
        icon: c.icon ? String(c.icon) : undefined,
      }));

      if (isMega && columns?.length) {
        return { label, href, mega: true, columns };
      }
      if (isMega && dropdown.length) {
        return {
          label,
          href,
          mega: true,
          columns: [{ title: label, links: dropdown.map((d) => ({ ...d, icon: d.icon ?? "fa-solid fa-angle-right" })) }],
        };
      }
      if (dropdown.length) {
        return { label, href, dropdown };
      }
      return { label, href };
    });
}
