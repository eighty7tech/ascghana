import { redirect } from "next/navigation";

/** Legacy route — button styles live at /admin/settings/buttons */
export default function LegacyButtonSettingsRedirect() {
  redirect("/admin/settings/buttons");
}
