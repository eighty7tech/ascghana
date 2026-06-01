/** Per-section button style hook for admin Button Styles → Section Assignments. */
export function btnSection(section: string) {
  return { "data-btn-section": section } as const;
}
