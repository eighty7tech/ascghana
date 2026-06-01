// Shared app state - simulates a database/API layer
// In production, replace with actual DB calls via API routes

export type MemberStatus = "Active" | "Inactive" | "Frozen" | "Expired" | "Pending Renewal";
export type TicketStatus = "Pending" | "Approved" | "Declined" | "Deleted";

export interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: "superadmin" | "admin" | "editor" | "moderator";
  lastLogin: string;
  status: "Active" | "Inactive";
}

export const ADMIN_USERS: AdminUser[] = [
  { id:1, username:"eighty7tech", displayName:"Eighty7 Tech", email:"admin@eighty7tech.com", role:"superadmin", lastLogin:"Today", status:"Active" },
  { id:2, username:"kwame.admin", displayName:"Kwame Asante", email:"kwame.admin@arsenalghana.com", role:"admin", lastLogin:"Yesterday", status:"Active" },
  { id:3, username:"ama.editor", displayName:"Ama Boateng", email:"ama@arsenalghana.com", role:"editor", lastLogin:"2 days ago", status:"Active" },
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ["all"],
  admin: ["members","events","tickets","blog","gallery","shop","donations","suggestions"],
  editor: ["blog","gallery"],
  moderator: ["chat","suggestions"],
  viewer: ["view_only"],
};
