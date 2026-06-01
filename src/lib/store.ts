// Simple in-memory store for demo state (replace with DB/API in production)

export type MemberStatus = "Active" | "Inactive" | "Frozen" | "Expired" | "Pending Renewal";
export type MemberTier = "Platinum" | "Gold" | "Silver" | "Bronze" | "Abusua";

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  dateOfBirth?: string;
  address?: string;
  postGPS?: string;
  membershipNumber?: string;
  tier: MemberTier;
  region: string;
  city: string;
  joined: string;
  renewalDue?: string;
  status: MemberStatus;
  role: "member" | "admin" | "superadmin";
  password?: string;
}

export type TicketStatus = "Pending" | "Approved" | "Declined" | "Deleted";

export interface Ticket {
  id: string;
  memberId: string;
  member: string;
  tier: string;
  match: string;
  category: string;
  date: string;
  qty: number;
  section: string;
  passport: string;
  status: TicketStatus;
  submitted: string;
}

export interface GalleryImage {
  id: number;
  title: string;
  category: string;
  date: string;
  url?: string;
  webp?: boolean;
}

export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  booked: number;
  status: "Published" | "Draft" | "Cancelled";
  category: string;
  description?: string;
  image?: string;
}

// Membership season rules:
// Season: July 1 – May 31
// One-time fee, renewal after 2 seasons
// Renewal window: April 1 – May 31
// Failure to renew after 2 seasons = restricted access

export function getMembershipStatus(joinedDate: string): MemberStatus {
  const joined = new Date(joinedDate);
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 6, 1); // July 1
  const seasonEnd = new Date(now.getFullYear() + 1, 4, 31); // May 31 next year
  const renewalStart = new Date(now.getFullYear(), 3, 1); // April 1
  const renewalEnd = new Date(now.getFullYear(), 4, 31); // May 31

  const yearsActive = (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  if (yearsActive >= 2) {
    // Check if in renewal window
    if (now >= renewalStart && now <= renewalEnd) {
      return "Pending Renewal";
    }
    return "Expired";
  }
  return "Active";
}
