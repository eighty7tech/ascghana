/** Grouped admin sidebar navigation — single source of truth */

export type AdminNavItem = {
  icon: string;
  label: string;
  href: string;
  badgeKey?: "tickets";
};

export type AdminNavSection = {
  section: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavSection[] = [
  {
    section: "Overview",
    items: [
      { icon: "fa-solid fa-gauge", label: "Dashboard", href: "/admin" },
      { icon: "fa-solid fa-chart-line", label: "Analytics", href: "/admin/analytics" },
      { icon: "fa-solid fa-bell", label: "Announcements", href: "/admin/announcements" },
      { icon: "fa-solid fa-clock-rotate-left", label: "Changelog", href: "/admin/changelog" },
    ],
  },
  {
    section: "Members",
    items: [
      { icon: "fa-solid fa-users", label: "All Members", href: "/admin/members" },
      { icon: "fa-solid fa-user-plus", label: "Add Member", href: "/admin/members/add" },
      { icon: "fa-solid fa-crown", label: "Membership Tiers", href: "/admin/tiers" },
      { icon: "fa-solid fa-user-check", label: "Registration Requests", href: "/admin/registration-requests" },
      { icon: "fa-solid fa-file-circle-check", label: "Membership Requests", href: "/admin/membership-requests" },
      { icon: "fa-solid fa-shield-halved", label: "Roles & Access", href: "/admin/roles" },
      { icon: "fa-solid fa-user-slash", label: "Deletion Requests", href: "/admin/deletion-requests" },
      { icon: "fa-solid fa-vote-yea", label: "Voting & Polls", href: "/admin/voting" },
      { icon: "fa-solid fa-star", label: "Fan of the Month", href: "/admin/fan-of-month" },
    ],
  },
  {
    section: "Matches & Events",
    items: [
      { icon: "fa-solid fa-futbol", label: "Matches & Fixtures", href: "/admin/matches" },
      { icon: "fa-solid fa-bullseye", label: "Score Predictor", href: "/admin/predictions" },
      { icon: "fa-solid fa-tv", label: "Watch Parties", href: "/admin/watch-parties" },
      { icon: "fa-solid fa-calendar-days", label: "Events", href: "/admin/events" },
      { icon: "fa-solid fa-user-check", label: "Event Attendance", href: "/admin/events/attendance" },
      { icon: "fa-solid fa-ticket", label: "Ticket Requests", href: "/admin/tickets", badgeKey: "tickets" },
      { icon: "fa-solid fa-ticket-simple", label: "Match Tickets", href: "/admin/match-tickets" },
      { icon: "fa-solid fa-chart-bar", label: "Season Stats", href: "/admin/season-stats" },
    ],
  },
  {
    section: "Community & Content",
    items: [
      { icon: "fa-solid fa-comments", label: "Fan Wall", href: "/admin/fan-wall" },
      { icon: "fa-solid fa-newspaper", label: "Blog & News", href: "/admin/blog" },
      { icon: "fa-solid fa-images", label: "Gallery", href: "/admin/gallery" },
      { icon: "fa-solid fa-comment-dots", label: "Suggestions", href: "/admin/suggestions" },
      { icon: "fa-solid fa-envelope", label: "Contact Messages", href: "/admin/messages" },
      { icon: "fa-solid fa-envelopes-bulk", label: "Newsletter", href: "/admin/newsletter" },
      { icon: "fa-solid fa-cake-candles", label: "Birthday Emails", href: "/admin/birthday" },
      { icon: "fa-solid fa-folder-open", label: "Club Documents", href: "/admin/documents" },
      { icon: "fa-solid fa-star", label: "Members Update", href: "/admin/members-update" },
      { icon: "fa-solid fa-book-open", label: "Club History", href: "/admin/history" },
    ],
  },
  {
    section: "Commerce",
    items: [
      { icon: "fa-solid fa-bag-shopping", label: "Shop Products", href: "/admin/shop" },
      { icon: "fa-solid fa-store", label: "Shop Settings", href: "/admin/shop-settings" },
      { icon: "fa-solid fa-receipt", label: "Orders", href: "/admin/orders" },
      { icon: "fa-solid fa-gift", label: "Loyalty Rewards", href: "/admin/rewards" },
      { icon: "fa-solid fa-hand-holding-heart", label: "Donations", href: "/admin/donations" },
      { icon: "fa-solid fa-handshake", label: "Sponsors & Partners", href: "/admin/sponsors" },
    ],
  },
  {
    section: "Appearance",
    items: [
      { icon: "fa-solid fa-palette", label: "Theme & Colors", href: "/admin/settings/appearance" },
      { icon: "fa-solid fa-bars", label: "Menu & Navigation", href: "/admin/settings/menu" },
      { icon: "fa-solid fa-heading", label: "Header & Menu", href: "/admin/header" },
      { icon: "fa-solid fa-image", label: "Hero Section", href: "/admin/hero" },
      { icon: "fa-solid fa-bars-staggered", label: "Footer", href: "/admin/footer" },
      { icon: "fa-solid fa-rectangle-ad", label: "Page Headers", href: "/admin/settings/headers" },
      { icon: "fa-solid fa-paintbrush", label: "Logo & Branding", href: "/admin/settings/branding" },
      { icon: "fa-solid fa-text-height", label: "Typography", href: "/admin/settings/fonts" },
      { icon: "fa-solid fa-square-poll-horizontal", label: "Button Styles", href: "/admin/settings/buttons" },
      { icon: "fa-solid fa-icons", label: "Icon Settings", href: "/admin/settings/icons" },
      { icon: "fa-solid fa-user-tie", label: "Exco Members", href: "/admin/exco" },
      { icon: "fa-solid fa-house", label: "Homepage Sections", href: "/admin/settings/homepage" },
    ],
  },
  {
    section: "Security & Activity",
    items: [
      { icon: "fa-solid fa-list-check", label: "Activity Log", href: "/admin/activity" },
      { icon: "fa-solid fa-desktop", label: "Active Sessions", href: "/admin/sessions" },
      { icon: "fa-solid fa-shield-halved", label: "Authentication & 2FA", href: "/admin/settings/authentication" },
      { icon: "fa-solid fa-lock", label: "Admin Login Page", href: "/admin/settings/admin-login" },
      { icon: "fa-solid fa-wrench", label: "Maintenance & Security", href: "/admin/settings/security" },
    ],
  },
  {
    section: "My Account",
    items: [
      { icon: "fa-solid fa-circle-user", label: "Admin Profile", href: "/admin/profile" },
      { icon: "fa-solid fa-users-gear", label: "Admin Users", href: "/admin/settings/admin-users" },
    ],
  },
  {
    section: "System",
    items: [
      { icon: "fa-solid fa-credit-card", label: "Payments", href: "/admin/settings/payments" },
      { icon: "fa-solid fa-envelope-open-text", label: "Email / SMTP", href: "/admin/settings/email" },
      { icon: "fa-solid fa-cloud-arrow-up", label: "Storage & Uploads", href: "/admin/settings/uploads" },
      { icon: "fa-solid fa-globe", label: "Social Media", href: "/admin/settings/social" },
      { icon: "fa-solid fa-key", label: "Social Login (OAuth)", href: "/admin/settings/social-login" },
      { icon: "fa-solid fa-address-book", label: "Contact Page", href: "/admin/settings/contact" },
      { icon: "fa-solid fa-database", label: "Backup & Database", href: "/admin/settings/database" },
      { icon: "fa-solid fa-circle-info", label: "All Settings", href: "/admin/settings" },
    ],
  },
];
