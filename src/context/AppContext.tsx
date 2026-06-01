"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { withDefaultButtonSettings } from "@/lib/buttonDefaults";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketStatus    = "Pending"|"Approved"|"Partially Approved"|"Declined"|"Deleted";
export type MemberStatus    = "Active"|"Inactive"|"Frozen"|"Expired"|"Pending Renewal";
export type TicketCategory  = "Category A"|"Category B"|"Category C";
export type MemberRole      = "member"|"admin"|"superadmin"|"editor"|"moderator"|"membership_officer"|"event_coordinator"|"ticket_manager"|"events_moderator";

export interface TicketRequest {
  id: string; memberId: string; member: string; membershipNumber: string; tier: string;
  match: string; category: TicketCategory; date: string; qty: number; section: string;
  passport: string; status: TicketStatus; submitted: string;
  specialRequest?: string; attendees?: string[];
}

export interface MatchTicket {
  id: string; matchName: string; competition: string; matchDate: string;
  deadline: string; category: "A"|"B"|"C"; ticketsAvailable: number;
  ticketPrice: number; bookingFee: number; paystackChargePct: number;
  status: "Active"|"Sold Out"|"Closed"|"Hidden"; image?: string; notes?: string;
}

export interface Member {
  id: number; membershipNumber: string; firstName: string; lastName: string; name: string;
  email: string; phone: string; whatsapp: string; dateOfBirth: string;
  address: string; postGPS: string; branch: string; tier: string;
  status: MemberStatus; joined: string; renewalDue?: string; photo?: string; role: MemberRole;
  password?: string;
  socialLinks?: { facebook?:string; instagram?:string; twitter?:string; };
  notifications?: { email:boolean; sms:boolean; events:boolean; tickets:boolean; renewals:boolean; };
  socialAccounts?: { facebook?:string; instagram?:string; twitter?:string; youtube?:string; tiktok?:string; linkedin?:string; };
}

export interface Event {
  id: number; title: string; date: string; time: string; venue: string;
  capacity: number; booked: number; status: "Published"|"Draft"|"Cancelled";
  category: string; description?: string; image?: string;
  memberDiscount: boolean; memberDiscountPct: number;
  nonMemberPrice: number; memberPrice?: number;
}

export interface GalleryAlbum {
  id: number; name: string; description: string; category: string;
  coverColor: string; imageCount: number; createdAt: string;
  images?: {id:number; filename:string; url?:string; size?:string; title:string; isWebp:boolean;}[];
}

export interface BlogPost {
  id: number; title: string; slug: string; excerpt: string; content: string;
  category: string; author: string; date: string; status: "Published"|"Draft";
  views: number; featured: boolean; image?: string; fontFamily?: string; fontSize?: string;
}

export interface MembershipTier {
  id: number; name: string; slug: string; color: string; icon: string;
  price: number; renewalPrice: number; benefits: string[]; popular: boolean;
  isFamily?: boolean; familyMembers?: number; description?: string;
}

export interface DonationCause {
  id: number; name: string; description: string; goal: number; raised: number;
  active: boolean; icon: string;
}

export interface ProductVariant {
  id: number; color: string; size: string; stock: number; sku?: string;
}
export interface Product {
  id: number; name: string; category: string; price: number; salePrice?: number;
  stock: number; sizes: string[]; colors?: string[]; badge?: string; inStock: boolean;
  description?: string; color: string; icon: string; memberDiscount?: boolean;
  image?: string; sku?: string; featured?: boolean; variants?: ProductVariant[];
  weight?: string; tags?: string;
}

export interface ExcoMember {
  id: number; name: string; position: string; years: string; bio: string;
  initials: string; color: string; type: "exco"|"serving"; photo?: string;
  facebook?: string; instagram?: string; twitter?: string;
}

export interface BackupRecord {
  id: number; label: string; createdAt: string; size: string; data: string;
}

export interface Sponsor {
  id: number;
  name: string;
  logoUrl: string;
  website: string;
  tier: "title" | "gold" | "silver" | "bronze" | "partner";
  description?: string;
  active: boolean;
  order: number;
}

export interface BirthdayTemplate {
  subject: string; greeting: string; body: string; signoff: string;
  bgColor: string; textColor: string; enabled: boolean;
  headerImage?: string;
}

export interface CommunityPost {
  id: number;
  channelId: string;
  userId: number;
  userName: string;
  userInitials: string;
  userPhoto?: string;
  userTier: string;
  userTierColor: string;
  text: string;
  createdAt: string; // ISO string
  edited?: boolean;
  reactions?: { emoji: string; count: number; }[];
}

export interface CommunityChannel {
  id: string;
  name: string;
  desc: string;
  icon: string;
  createdAt: string;
}

export interface Suggestion {
  id: string; memberId: string; memberName: string; memberNumber: string; tier: string;
  subject: string; message: string;
  status: "New"|"Under Review"|"Implemented"|"Dismissed";
  adminReply?: string; submittedAt: string;
}

export interface AdminAccount {
  id: string; username: string; name: string; email: string;
  password: string; role: "superadmin"|"admin"|"editor"|"moderator"|"ticket_manager";
  isActive: boolean; createdAt: string;
}

export interface ContactMessage {
  id: string; name: string; email: string; subject: string; message: string;
  createdAt: string; read: boolean; replied: boolean;
}

// ─── Site Settings ────────────────────────────────────────────────────────────


export interface BulletinItem {
  id: number;
  type: "announcement"|"job"|"ad"|"news"|"event";
  title: string;
  body: string;
  image?: string;
  linkUrl?: string;
  linkLabel?: string;
  priority: number;        // higher = shown first
  isActive: boolean;
  expiresAt?: string;      // ISO date string
  createdAt: string;
  createdBy?: string;
  emoji?: string;
}

export interface MemberSpotlight {
  id: number;
  memberId?: number;
  name: string;
  photo?: string;
  tier: string;
  branch: string;
  quote: string;
  achievement?: string;    // e.g. "Most events attended"
  type: "week"|"month"|"quarter";
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

export interface ClubStat {
  id: number;
  label: string;
  value: string;
  icon: string;
  color: string;
  isVisible: boolean;
  order: number;
}


export interface VotingPoll {
  id: number;
  title: string;
  description: string;
  type: "motm"|"motw"|"motq"|"best_player"|"custom";
  options: VotingOption[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  allowNonMembers: boolean;
  showResults: boolean;
  resultType: "public"|"admin_only";
  createdAt: string;
  createdBy?: string;
}

export interface VotingOption {
  id: number;
  pollId: number;
  memberId?: number;
  name: string;
  photo?: string;
  tier?: string;
  branch?: string;
  description?: string;
  votes: number;
}

export interface VoteCast {
  id: number;
  pollId: number;
  optionId: number;
  voterId?: number;       // member id
  voterIp?: string;
  castedAt: string;
}

export interface ShopCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ShopSettings {
  allowGuestCheckout: boolean;
  memberDiscountPct: number;
  currency: string;
  currencySymbol: string;
  shippingEnabled: boolean;
  shippingFlatRate: number;
  shippingFreeThreshold: number;
  shippingNote: string;
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string;
  inventoryTracking: boolean;
  lowStockThreshold: number;
  showOutOfStock: boolean;
  allowBackorders: boolean;
  checkoutNote: string;
  returnPolicy: string;
  categories: ShopCategory[];
  paymentGateways: string[];    // enabled gateway ids
  heroTitle: string;
  heroSubtitle: string;
  heroBg: string;
  featuredSection: boolean;
  reviewsEnabled: boolean;
}

export interface SiteSettings {
  logoUrl: string; siteName: string; tagline: string; accentColor: string; goldColor: string;
  topBarBg: string; navBg: string;
  topBarItems: { id:number; label:string; href:string; icon:string; }[];
  heroSlides: { id:number; title:string; subtitle:string; description:string; cta:string; ctaLink:string; bg:string; imageUrl?:string; }[];
  heroStats: { label:string; value:string; }[];
  memberOfWeek?: { memberId:number; name:string; photo?:string; quote:string; tier:string; branch:string; };
  footerTagline: string; footerMotto: string; footerCopyright: string;
  footerLogoUrl: string;
  socialPosition: "first"|"middle"|"last";
  footerColumns: { id:number; title:string; links:{ label:string; href:string; }[]; }[];
  socialLinks: { platform:string; url:string; icon:string; color:string; iconBgColor:string; }[];
  adminNotifications: { id:number; title:string; message:string; type:string; read:boolean; createdAt:string; }[];
  bulletinItems: BulletinItem[];
  memberSpotlights: MemberSpotlight[];
  clubStats: ClubStat[];
  address: string; phone: string; email: string;
  displayFont: string; headingFont: string; bodyFont: string;
  baseFontSize: number; headingScale: number;
  developerWebsite: string;
  loginBgImage: string; loginBgOverlay: number;
  historyContent: string; historyTitle: string;
  newsletterProvider: string; newsletterApiKey: string;
  newsletterFromEmail: string; newsletterFromName: string;
  googleClientId: string; facebookAppId: string;
  paystackPublicKey: string; paystackSecretKey: string; paystackPassCharges: boolean;
  activeGateway: string;
  hubtelClientId: string; hubtelClientSecret: string; hubtelSenderName: string;
  birthdayEmail: BirthdayTemplate;
  // Extended
  clubRegNumber: string; clubFounded: string; clubApprovedYear: string; clubAbout: string;
  // Admin panel appearance
  adminPanelBg: string; adminPanelText: string; adminSidebarBg: string; adminHeaderBg: string; adminAccent: string;
  // Admin accounts (stored locally)
  adminAccounts: AdminAccount[];
  newsTickerItems: string[];
  memberDiscountPct: string;
  donationCategories: string;
  galleryAlbums?: GalleryAlbum[];
  // Currency & Tickets
  ticketCurrencyMode: "GHS"|"GBP"|"both"; gbpToGhsRate: number;
  momoNumber: string; momoName: string;
  bankName: string; bankAccount: string; bankBranch: string; bankAccountName: string;
  cashInstructions: string;
  // Footer typography
  footerHeadingFont: string; footerHeadingSize: string; footerHeadingColor: string;
  footerBodyFont: string; footerBodySize: string; footerBodyColor: string; footerBgColor: string;
  // Light theme custom colors
  lightBgPrimary: string; lightBgCard: string; lightTextPrimary: string; lightTextMuted: string;
  lightAccentColor: string; lightNavBg: string;
  // Dark theme & menu appearance (ThemeSync)
  darkBgPrimary: string; darkBgCard: string; darkTextPrimary: string; darkTextMuted: string;
  darkNavBg: string; darkAccentColor: string;
  menuNavBg: string; menuNavText: string; menuNavHoverBg: string;
  menuDropdownBg: string; menuDropdownText: string; menuDropdownHoverBg: string;
  cardLightBg: string; cardLightText: string; cardLightBorder: string;
  cardDarkBg: string; cardDarkText: string; cardDarkBorder: string;
  // Auth / 2FA
  twoFaEnabled: boolean; authMethod: "email"|"sms"|"none";
  memberTwoFaEnabled: boolean; memberTwoFaMethod: "email"|"sms";
  googleEnabled: boolean; facebookEnabled: boolean;
  sessionHours: number; memberSessionDays: number;
  maxLoginAttempts: number; lockoutMinutes: number;
  requirePasswordChange: boolean; passwordMinLength: number;
  // Admin Login Page appearance
  loginLogoSize: number; loginShowLogo: boolean; loginShowSiteName: boolean;
  loginBgType: "color"|"gradient"|"image";
  loginBgColor: string; loginBgGradient: string;
  loginCardBg: string; loginCardBorder: string;
  loginShowPattern: boolean; loginPatternOpacity: number;
  loginWelcomeTitle: string; loginWelcomeSubtitle: string;
  loginAllowRememberMe: boolean;
  // Font weights
  bodyFontWeight: string; headingFontWeight: string; navFontWeight: string;
  // Shop & Blog
  shopBgColor: string;
  sponsors: Sponsor[];
  sponsorsPageTitle: string;
  sponsorsPageSubtitle: string;
  // Homepage section visibility & settings
  showClubStatsSection: boolean;
  showBulletinSection: boolean;
  showMatchCountdownSection: boolean;
  showMemberSpotlightSection: boolean;
  showCommunityPollSection: boolean;
  showSponsorsOnHome: boolean;
  // Next match data
  nextMatch: {
    homeTeam: string; awayTeam: string; competition: string;
    date: string; time: string; venue: string;
    homeTeamLogo?: string; awayTeamLogo?: string;
    ticketLink?: string; watchPartyVenue?: string; watchPartyTime?: string;
    isActive: boolean;
  } | null;
  shopSettings: ShopSettings;
  shopCategories: ShopCategory[];
  votingPolls: VotingPoll[];
  // Contact page settings
  contactEmail: string; contactPhone: string; contactWhatsApp: string;
  contactAddress: string; contactMapEmbed: string; contactOfficeHours: string;
  contactPageTitle: string; contactPageSubtitle: string;
  contactEnableMap: boolean; contactEnablePhone: boolean; contactEnableWhatsApp: boolean;
  // Top header / nav font settings
  topBarFontFamily: string; topBarFontSize: string; topBarFontWeight: string;
  navFontFamily: string; navFontSize: string;
  // Page header defaults (per-page overrides stored in pageHeaders)
  pageHeaderBg: string; pageHeaderOverlay: number; pageHeaderStyle: "color"|"image"|"gradient";
  pageHeaderGradient: string; pageHeaderTextColor: string;
  // Section ordering & visibility (all homepage sections)
  homeSectionOrder: string[];
  // Arsenal fixtures section
  arsenalFixtures: {
    id: number; homeTeam: string; awayTeam: string; competition: string;
    homeTeamLogo: string; awayTeamLogo: string;
    date: string; time: string; venue: string;
    status: "upcoming"|"live"|"result"; homeScore?: number; awayScore?: number;
    isActive: boolean; sortOrder: number;
  }[];
  showArsenalFixturesSection: boolean;
  // Maintenance mode
  maintenanceMode: boolean; maintenanceMessage: string; maintenanceAllowAdmin: boolean;
  // Site security
  enableCSRF: boolean; enableRateLimit: boolean; rateLimitRequests: number;
  rateLimitWindowMs: number; enableIPBan: boolean; bannedIPs: string[];
  // Event bookings reference (stored in DB, this is a flag)
  eventBookingsEnabled: boolean;
  // v1.5.0 — Upload provider
  uploadProvider: string; uploadMaxSizeMb: number; uploadAllowedTypes: string[];
  uploadConvertWebp: boolean; uploadMaxDimension: number; uploadJpegQuality: number;
  cloudinaryCloudName: string; cloudinaryApiKey: string; cloudinaryApiSecret: string;
  cloudinaryUploadPreset: string; cloudinaryFolder: string;
  s3Bucket: string; s3Region: string; s3AccessKey: string; s3SecretKey: string; cdnUrl: string;
  imgbbApiKey: string;
  // v1.5.0 — Button styles, menu items, section backgrounds
  buttonStyles: any[];
  activeButtonId: string;              // v1.7.0 — global default button
  sectionButtonIds: Record<string,string>; // v1.7.0 — per-section button override
  menuItems: any[];
  topBarItems: any[];
  sectionBgs: Record<string, string>;
  // v1.7.0 — Icon settings
  iconSettings: { size: number; color: string; style: string; };
  // v1.5.0 — Contact page settings
  contactEmail: string; contactPhone: string; contactWhatsApp: string;
  contactAddress: string; contactOfficeHours: string; contactMapEmbed: string;
  contactPageTitle: string; contactPageSubtitle: string;
  contactEnableMap: boolean; contactEnablePhone: boolean; contactEnableWhatsApp: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CHANNELS: CommunityChannel[] = [
  { id:"general",  name:"general",       desc:"Club-wide chat for all members",   icon:"fa-solid fa-hashtag",       createdAt: new Date().toISOString() },
  { id:"matchday", name:"match-day",      desc:"Live match reactions and scores",  icon:"fa-solid fa-futbol",        createdAt: new Date().toISOString() },
  { id:"tickets",  name:"tickets-talk",   desc:"Ticket tips and requests",         icon:"fa-solid fa-ticket",        createdAt: new Date().toISOString() },
  { id:"events",   name:"events",         desc:"Events discussion and planning",   icon:"fa-solid fa-calendar",      createdAt: new Date().toISOString() },
  { id:"announce", name:"announcements",  desc:"Official club announcements only", icon:"fa-solid fa-bullhorn",      createdAt: new Date().toISOString() },
];

const defaultBirthdayTemplate: BirthdayTemplate = {
  enabled: true,
  subject: "Happy Birthday from Arsenal Supporters Club Ghana! 🎂⚽",
  greeting: "Happy Birthday, [MEMBER_NAME]!",
  body: `On behalf of everyone at Arsenal Supporters Club Ghana, we wish you a very Happy Birthday!\n\nAs a proud Ghana Gooner, you are an important part of our family. We hope this birthday brings you as much joy as Arsenal brings to us every matchday.\n\nVictoria Concordia Crescit! 🔴⚪`,
  signoff: "With Gooner Love,\nArsenal Supporters Club Ghana",
  bgColor: "#EF0107", textColor: "#FFFFFF",
};

const defaultSettings: SiteSettings = {
  logoUrl: "", siteName: "", tagline: "",
  accentColor: "#E30613", goldColor: "#947A58",
  topBarBg: "#AF1311", navBg: "#E30613",
  topBarItems: [
    { id:1, label:"Victoria Concordia Crescit", href:"", icon:"fa-solid fa-shield" },
    { id:2, label:"Arsenal Official Hub", href:"https://supportersclubs.arsenal.com", icon:"fa-solid fa-up-right-from-square" },
    { id:3, label:"Member Login", href:"/auth/login", icon:"fa-solid fa-right-to-bracket" },
    { id:4, label:"Shop", href:"/shop", icon:"fa-solid fa-bag-shopping" },
  ],
  heroSlides: [
    { id:1, title:"WE ARE THE GHANA GOONERS", subtitle:"Official Arsenal Supporters Club Ghana", description:"Formed in 2003. Officially approved by Arsenal FC in 2008. Officially registered in Ghana. Join 2,400+ passionate Gunners across all regions.", cta:"Join The Family", ctaLink:"/membership/register", bg:"from-red-900 via-[#1A0A0A] to-red-950" },
    { id:2, title:"VICTORIA CONCORDIA CRESCIT", subtitle:"Victory Through Harmony — Ghana Chapter", description:"Together as one community, we celebrate Arsenal's victories and stand strong in challenging times.", cta:"Our Story", ctaLink:"/about", bg:"from-[#1A0A0A] via-red-900 to-[#0F0D13]" },
    { id:3, title:"MATCH DAY TICKETS", subtitle:"Watch Arsenal at The Emirates Stadium", description:"Exclusive member access to request Arsenal home match tickets. Category A, B & C available for Ghana Gooners.", cta:"Request Tickets", ctaLink:"/members/tickets", bg:"from-red-950 via-[#1A0A0A] to-red-900" },
  ],
  heroStats: [
    { label:"Members", value:"2,400+" }, { label:"Founded", value:"2003" },
    { label:"Official", value:"2008" }, { label:"Regions", value:"10" },
  ],
  memberOfWeek: undefined,
  footerTagline: "Official Arsenal Supporters Club Ghana — The Ghana Gooners. Bringing the passion of North London to West Africa since 2003.",
  footerMotto: "Victoria Concordia Crescit", footerCopyright: "© 2025 Arsenal Supporters Club Ghana. All rights reserved.",
  footerLogoUrl: "", socialPosition: "last",
  footerColumns: [
    { id:1, title:"Club", links:[{label:"About Us",href:"/about"},{label:"Exco",href:"/about/exco"},{label:"History",href:"/history"},{label:"Contact",href:"/contact"}] },
    { id:2, title:"Membership", links:[{label:"Join Us",href:"/membership/register"},{label:"Tiers",href:"/membership/register"},{label:"Renew",href:"/members/membership"},{label:"Member Login",href:"/auth/login"}] },
    { id:3, title:"Events", links:[{label:"All Events",href:"/events"},{label:"Book Tickets",href:"/members/tickets"},{label:"Gallery",href:"/gallery"},{label:"Blog",href:"/blog"}] },
    { id:4, title:"Support", links:[{label:"Donate",href:"/members/donate"},{label:"Shop",href:"/shop"},{label:"Community",href:"/members/community"},{label:"FAQ",href:"/contact"}] },
  ],
  socialLinks: [
    { platform:"Facebook", url:"https://facebook.com/arsenalghana", icon:"fa-brands fa-facebook-f", color:"#1877F2", iconBgColor:"" },
    { platform:"Instagram", url:"https://instagram.com/arsenalghana", icon:"fa-brands fa-instagram", color:"#E1306C", iconBgColor:"" },
    { platform:"Twitter/X", url:"https://twitter.com/arsenalghana", icon:"fa-brands fa-x-twitter", color:"#1DA1F2", iconBgColor:"" },
    { platform:"YouTube", url:"https://youtube.com/@arsenalghana", icon:"fa-brands fa-youtube", color:"#FF0000", iconBgColor:"" },
    { platform:"WhatsApp", url:"https://wa.me/233000000000", icon:"fa-brands fa-whatsapp", color:"#25D366", iconBgColor:"" },
  ],
  address: "P.O. Box AN 12345, Accra, Ghana", phone: "+233 20 000 0000", email: "info@arsenalghana.com",
  displayFont: "Oswald", headingFont: "Barlow Condensed", bodyFont: "Barlow",
  baseFontSize: 15, headingScale: 1.25,
  loginBgImage: "", loginBgOverlay: 0.6,
  historyContent: "", historyTitle: "OUR HISTORY",
  newsletterProvider: "smtp", newsletterApiKey: "", newsletterFromEmail: "", newsletterFromName: "Arsenal Ghana",
  developerWebsite: "https://eighty7tech.com",
  googleClientId: "", facebookAppId: "",
  paystackPublicKey: "", paystackSecretKey: "", paystackPassCharges: true, activeGateway: "paystack",
  hubtelClientId: "", hubtelClientSecret: "", hubtelSenderName: "ArsenalGH",
  adminNotifications: [],
  votingPolls: [],
  // Contact page
  contactEmail: "", contactPhone: "", contactWhatsApp: "", contactAddress: "",
  contactMapEmbed: "", contactOfficeHours: "Mon–Fri 9AM–5PM",
  contactPageTitle: "GET IN TOUCH", contactPageSubtitle: "We\'d love to hear from you",
  contactEnableMap: true, contactEnablePhone: true, contactEnableWhatsApp: true,
  // Top bar & nav fonts
  topBarFontFamily: "", topBarFontSize: "12px", topBarFontWeight: "600",
  navFontFamily: "", navFontSize: "13px",
  // Page headers
  pageHeaderBg: "#0C0B12", pageHeaderOverlay: 0.7, pageHeaderStyle: "gradient" as const,
  pageHeaderGradient: "linear-gradient(135deg,#1A0505 0%,#0C0B12 100%)",
  pageHeaderTextColor: "#FFFFFF",
  // Section ordering
  homeSectionOrder: ["ticker","stats","countdown","fixtures","events","bulletin","members-update","spotlight","poll","tiers","blog","gallery","social","sponsors"],
  // Arsenal fixtures
  arsenalFixtures: [],
  showArsenalFixturesSection: true,
  // Maintenance
  maintenanceMode: false, maintenanceMessage: "We are currently upgrading our systems. We\'ll be back shortly.",
  maintenanceAllowAdmin: true,
  // Security
  enableCSRF: true, enableRateLimit: true, rateLimitRequests: 100,
  rateLimitWindowMs: 60000, enableIPBan: false, bannedIPs: [],
  // Event bookings
  eventBookingsEnabled: true,
  // v1.5.0 — Upload provider
  uploadProvider: "local", uploadMaxSizeMb: 5, uploadAllowedTypes: ["image/jpeg","image/png","image/webp"],
  uploadConvertWebp: true, uploadMaxDimension: 2000, uploadJpegQuality: 85,
  cloudinaryCloudName: "", cloudinaryApiKey: "", cloudinaryApiSecret: "",
  cloudinaryUploadPreset: "", cloudinaryFolder: "ascghana",
  s3Bucket: "", s3Region: "us-east-1", s3AccessKey: "", s3SecretKey: "", cdnUrl: "",
  imgbbApiKey: "",
  // v1.5.0 — Button styles / menu / section backgrounds
  buttonStyles: [], activeButtonId: "", sectionButtonIds: {}, menuItems: [], topBarItems: [],
  sectionBgs: { hero:"", stats:"", countdown:"", bulletin:"", spotlight:"", poll:"", sponsors:"", fixtures:"" },
  // v1.7.0 — Icon settings
  iconSettings: { size: 18, color: "#EF0107", style: "solid" },
  // v1.5.0 — Contact page
  contactEmail: "", contactPhone: "", contactWhatsApp: "", contactAddress: "",
  contactOfficeHours: "Mon–Fri, 9AM–5PM GMT", contactMapEmbed: "",
  contactPageTitle: "GET IN TOUCH", contactPageSubtitle: "We\'d love to hear from you",
  contactEnableMap: true, contactEnablePhone: true, contactEnableWhatsApp: true,
  shopCategories: [
    { id:1, name:"Jerseys",      slug:"jerseys",     sortOrder:1, isActive:true },
    { id:2, name:"Training",     slug:"training",    sortOrder:2, isActive:true },
    { id:3, name:"Accessories",  slug:"accessories", sortOrder:3, isActive:true },
    { id:4, name:"Kids",         slug:"kids",        sortOrder:4, isActive:true },
    { id:5, name:"Collectibles", slug:"collectibles",sortOrder:5, isActive:true },
    { id:6, name:"Casual",       slug:"casual",      sortOrder:6, isActive:true },
  ],
  shopSettings: {
    allowGuestCheckout: true, memberDiscountPct: 10,
    currency: "GHS", currencySymbol: "GH₵",
    shippingEnabled: true, shippingFlatRate: 30, shippingFreeThreshold: 500,
    shippingNote: "Orders above GH₵500 qualify for free delivery in Accra.",
    taxEnabled: false, taxRate: 0, taxLabel: "VAT",
    inventoryTracking: true, lowStockThreshold: 5,
    showOutOfStock: true, allowBackorders: false,
    checkoutNote: "Orders are processed within 2-3 business days.",
    returnPolicy: "Items can be returned within 7 days of receipt in original condition.",
    categories: [], paymentGateways: ["paystack","mtn","bank"],
    heroTitle: "OFFICIAL MERCHANDISE", heroSubtitle: "Gear up for Arsenal Ghana",
    heroBg: "from-red-900 via-[#1A0A0A] to-red-950",
    featuredSection: true, reviewsEnabled: false,
  },
  bulletinItems: [],
  memberSpotlights: [],
  clubStats: [
    { id:1, label:"Active Members", value:"dynamic", icon:"fa-solid fa-users", color:"#EF0107", isVisible:true, order:1 },
    { id:2, label:"Year Founded", value:"2003", icon:"fa-solid fa-calendar-star", color:"#C6A84B", isVisible:true, order:2 },
    { id:3, label:"Arsenal Approved", value:"2008", icon:"fa-solid fa-shield-halved", color:"#3B82F6", isVisible:true, order:3 },
    { id:4, label:"Regions Covered", value:"10", icon:"fa-solid fa-map-location-dot", color:"#10B981", isVisible:true, order:4 },
    { id:5, label:"Events Hosted", value:"200+", icon:"fa-solid fa-calendar-days", color:"#F59E0B", isVisible:false, order:5 },
    { id:6, label:"Watch Parties", value:"50+", icon:"fa-solid fa-tv", color:"#8B5CF6", isVisible:false, order:6 },
  ],
  birthdayEmail: defaultBirthdayTemplate,
  clubRegNumber: "84594504054", clubFounded: "2003", clubApprovedYear: "2008",
  adminPanelBg: "#07060F", adminPanelText: "#FFFFFF", adminSidebarBg: "#0A0812",
  adminHeaderBg: "#0D0B18", adminAccent: "#EF0107",
  adminAccounts: [
    { id:"1", username:"eighty7tech", name:"Super Admin", email:"admin@arsenalghana.com", password:"@23HuzDan25", role:"superadmin" as const, isActive:true, createdAt:new Date().toISOString() },
    { id:"2", username:"admin", name:"Admin", email:"admin2@arsenalghana.com", password:"admin123", role:"admin" as const, isActive:true, createdAt:new Date().toISOString() },
  ],
  clubAbout: "Arsenal Supporters Club Ghana is the official Arsenal supporters club in Ghana. Formed in 2003 and officially approved by Arsenal in 2008. We are an officially registered organization in Ghana with registration number #84594504054.",
  newsTickerItems: [
    "🔴 Arsenal vs Chelsea – Watch Party at Silver Star Tower, Saturday 5:30pm",
    "🏆 ASC Ghana Annual Awards Night – Nominations now open",
    "🎟️ Emirates Stadium tickets for 25/26 season – Members apply with membership number",
    "📢 Renewal window opens April 1 – Renew before May 31 to keep your benefits",
    "⚽ Victoria Concordia Crescit — Arsenal Supporters Club Ghana",
  ],
  memberDiscountPct: "10",
  donationCategories: "General,Infrastructure,Events,Charity,Arsenal Trip",
  galleryAlbums: [],
  ticketCurrencyMode: "both", gbpToGhsRate: 650,
  footerHeadingFont: "Chapman", footerHeadingSize: "14", footerHeadingColor: "#FFFFFF",
  footerBodyFont: "Barlow", footerBodySize: "13", footerBodyColor: "rgba(255,255,255,0.55)", footerBgColor: "#0A0812",
  lightBgPrimary: "#F6F6F6", lightBgCard: "#FFFFFF", lightTextPrimary: "#000000", lightTextMuted: "#72767E",
  lightAccentColor: "#E30613", lightNavBg: "#E30613",
  darkBgPrimary: "#0C0B12", darkBgCard: "#1C1829", darkTextPrimary: "#F8FAFC", darkTextMuted: "#8B93A3",
  darkNavBg: "#151925", darkAccentColor: "#E30613",
  menuNavBg: "#E30613", menuNavText: "#FFFFFF", menuNavHoverBg: "rgba(255,255,255,0.12)",
  menuDropdownBg: "#FFFFFF", menuDropdownText: "#000000", menuDropdownHoverBg: "#F6F6F6",
  cardLightBg: "#FFFFFF", cardLightText: "#000000", cardLightBorder: "#E1E1E1",
  cardDarkBg: "#1C1829", cardDarkText: "#F8FAFC", cardDarkBorder: "rgba(255,255,255,0.08)",
  twoFaEnabled: false, authMethod: "none" as const,
  memberTwoFaEnabled: false, memberTwoFaMethod: "email" as const,
  googleEnabled: false, facebookEnabled: false,
  sessionHours: 12, memberSessionDays: 30,
  maxLoginAttempts: 5, lockoutMinutes: 30,
  requirePasswordChange: false, passwordMinLength: 8,
  // Admin Login Page defaults
  loginLogoSize: 64, loginShowLogo: true, loginShowSiteName: true,
  loginBgType: "color" as const, loginBgColor: "#07060F",
  loginBgGradient: "linear-gradient(135deg, #07060F 0%, #1A0A0A 100%)",
  loginCardBg: "rgba(12,10,20,0.9)", loginCardBorder: "rgba(198,168,75,0.2)",
  loginShowPattern: true, loginPatternOpacity: 0.04,
  loginWelcomeTitle: "ADMIN PANEL", loginWelcomeSubtitle: "Arsenal Supporters Club Ghana",
  loginAllowRememberMe: true,
  bodyFontWeight: "400", headingFontWeight: "700", navFontWeight: "700",
  shopBgColor: "",
  sponsors: [],
  sponsorsPageTitle: "Our Partners & Sponsors",
  sponsorsPageSubtitle: "Proud partners who make Arsenal Supporters Club Ghana possible",
  showSponsorsOnHome: true,
  showClubStatsSection: true,
  showBulletinSection: true,
  showMatchCountdownSection: true,
  showMemberSpotlightSection: true,
  showCommunityPollSection: true,
  nextMatch: {
    homeTeam: "Arsenal", awayTeam: "Opponent TBC", competition: "Premier League",
    date: "", time: "17:30", venue: "Emirates Stadium, London",
    homeTeamLogo: "", awayTeamLogo: "", ticketLink: "/members/tickets",
    watchPartyVenue: "", watchPartyTime: "", isActive: false,
  },
  momoNumber: "", momoName: "",
  bankName: "", bankAccount: "", bankBranch: "", bankAccountName: "",
  cashInstructions: "",
};

function mergeSiteSettings(partial?: Partial<SiteSettings>): SiteSettings {
  return withDefaultButtonSettings({ ...defaultSettings, ...partial }) as SiteSettings;
}

const defaultTiers: MembershipTier[] = [
  { id:1, name:"Bronze", slug:"bronze", color:"#CD7F32", icon:"fa-solid fa-medal", price:150, renewalPrice:100, popular:false, benefits:["Member ID card","Club newsletter","Watch party invitations","Voting rights at AGM","Basic community access"] },
  { id:2, name:"Silver", slug:"silver", color:"#A8A9AD", icon:"fa-solid fa-shield", price:300, renewalPrice:200, popular:false, benefits:["All Bronze benefits","Ticket request eligibility","Event priority booking","Silver member badge","Community forum"] },
  { id:3, name:"Gold", slug:"gold", color:"#C6A84B", icon:"fa-solid fa-star", price:500, renewalPrice:350, popular:true, benefits:["All Silver benefits","10% event & shop discount","Gold jersey discount","VIP social access","Priority ticket allocation"] },
  { id:4, name:"Platinum", slug:"platinum", color:"#E8E8E8", icon:"fa-solid fa-trophy", price:1000, renewalPrice:700, popular:false, benefits:["All Gold benefits","VIP seating","Exclusive Platinum jersey","Dedicated member liaison","Club sponsor recognition"] },
  { id:5, name:"Abusua", slug:"abusua", color:"#2ECC71", icon:"fa-solid fa-people-roof", price:800, renewalPrice:500, popular:false, isFamily:true, familyMembers:5, description:"Family package: 2 adults + up to 3 children", benefits:["Family membership (up to 5)","All Gold benefits for family","Family jersey set","Priority watch party seating"] },
];

const defaultMembers: Member[] = [];

const defaultTickets: TicketRequest[] = [];

const defaultMatchTickets: MatchTicket[] = [];

const defaultEvents: Event[] = [];

const defaultPosts: BlogPost[] = [];

const defaultDonations: DonationCause[] = [];

const defaultProducts: Product[] = [];

const defaultExco: ExcoMember[] = [];

const defaultSuggestions: Suggestion[] = [];

// ─── Context interface ─────────────────────────────────────────────────────────

interface AppContextType {
  settings: SiteSettings;
  updateSettings: (partial: Partial<SiteSettings>) => void;
  resetSettings: () => void;
  tickets: TicketRequest[]; setTickets:(t:TicketRequest[])=>void;
  updateTicket:(id:string,up:Partial<TicketRequest>)=>void; deleteTicket:(id:string)=>void;
  matchTickets: MatchTicket[]; setMatchTickets:(t:MatchTicket[])=>void;
  updateMatchTicket:(id:string,up:Partial<MatchTicket>)=>void; deleteMatchTicket:(id:string)=>void;
  members: Member[]; setMembers:(m:Member[])=>void;
  updateMember:(id:number,up:Partial<Member>)=>void; deleteMember:(id:number)=>void; deleteAllMembers:()=>void;
  events: Event[]; setEvents:(e:Event[])=>void;
  updateEvent:(id:number,up:Partial<Event>)=>void; deleteEvent:(id:number)=>void;
  posts: BlogPost[]; setPosts:(p:BlogPost[])=>void;
  updatePost:(id:number,up:Partial<BlogPost>)=>void; deletePost:(id:number)=>void;
  tiers: MembershipTier[]; setTiers:(t:MembershipTier[])=>void;
  updateTier:(id:number,up:Partial<MembershipTier>)=>void; deleteTier:(id:number)=>void;
  donations: DonationCause[]; setDonations:(d:DonationCause[])=>void;
  updateDonation:(id:number,up:Partial<DonationCause>)=>void; deleteDonation:(id:number)=>void;
  products: Product[]; setProducts:(p:Product[])=>void;
  updateProduct:(id:number,up:Partial<Product>)=>void; deleteProduct:(id:number)=>void;
  exco: ExcoMember[]; setExco:(e:ExcoMember[])=>void;
  updateExco:(id:number,up:Partial<ExcoMember>)=>void; deleteExco:(id:number)=>void;
  suggestions: Suggestion[]; setSuggestions:(s:Suggestion[])=>void;
  updateSuggestion:(id:string,up:Partial<Suggestion>)=>void; deleteSuggestion:(id:string)=>void;
  addSuggestion:(s:Omit<Suggestion,"id"|"submittedAt"|"status">)=>void;
  contactMessages: ContactMessage[]; addContactMessage:(m:Omit<ContactMessage,"id"|"createdAt"|"read"|"replied">)=>void; updateContactMessage:(id:string,up:Partial<ContactMessage>)=>void; deleteContactMessage:(id:string)=>void;
  adminAccounts: AdminAccount[]; setAdminAccounts:(a:AdminAccount[])=>void; updateAdminAccount:(id:string,up:Partial<AdminAccount>)=>void; deleteAdminAccount:(id:string)=>void;
  backups: BackupRecord[]; createBackup:(label?:string)=>void; restoreBackup:(id:number)=>void; deleteBackup:(id:number)=>void;
  addAdminNotification:(title:string, message:string, type?:"info"|"success"|"warning"|"danger")=>void;
  markNotificationRead:(id:number)=>void;
  clearAllNotifications:()=>void;
  communityPosts: CommunityPost[]; addCommunityPost:(p:Omit<CommunityPost,"id"|"createdAt">)=>void; deleteCommunityPost:(id:number)=>void;
  communityChannels: CommunityChannel[]; setCommunityChannels:(c:CommunityChannel[])=>void;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Storage helpers ──────────────────────────────────────────────────────────

function load<T>(key: string, def: T): T {
  return def;
}
function save(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  // Write to localStorage immediately as a fallback (so refresh always has something)
  try {
    localStorage.setItem(`asc_${key}`, JSON.stringify(val));
  } catch {}
  // Then persist to DB
  fetch("/api/app-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value: val }),
  }).catch(() => {});
}

function loadFallback(key: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`asc_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState]       = useState<SiteSettings>(() => mergeSiteSettings());
  const [tickets,  setTicketsState]         = useState<TicketRequest[]>(defaultTickets);
  const [matchTickets, setMatchTicketsState]= useState<MatchTicket[]>(defaultMatchTickets);
  const [members,  setMembersState]         = useState<Member[]>(defaultMembers);
  const [events,   setEventsState]          = useState<Event[]>(defaultEvents);
  const [posts,    setPostsState]           = useState<BlogPost[]>(defaultPosts);
  const [tiers,    setTiersState]           = useState<MembershipTier[]>(defaultTiers);
  const [donations,setDonationsState]       = useState<DonationCause[]>(defaultDonations);
  const [products, setProductsState]        = useState<Product[]>(defaultProducts);
  const [exco,     setExcoState]            = useState<ExcoMember[]>(defaultExco);
  const [suggestions,setSuggestionsState]   = useState<Suggestion[]>(defaultSuggestions);
  const [contactMsgs,setContactMsgsState]   = useState<ContactMessage[]>([]);
  const [adminAcctsState,setAdminAcctsState] = useState<AdminAccount[]>([]);
  const [backups,  setBackupsState]         = useState<BackupRecord[]>([]);
  useEffect(() => {
    let cancelled = false;

    const applySettings = (raw: Partial<SiteSettings>) => {
      if (cancelled || !raw || typeof raw !== "object") return;
      const merged = mergeSiteSettings(raw);
      setSettingsState(merged);
      try { localStorage.setItem("asc_settings", JSON.stringify(merged)); } catch {}
    };

    // Load dedicated settings endpoint first (authoritative for currency/payments)
    fetch("/api/settings", { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(dbSettings => {
        if (dbSettings && typeof dbSettings === "object" && Object.keys(dbSettings).length > 0) {
          applySettings(dbSettings as Partial<SiteSettings>);
        } else {
          const lsSettings = loadFallback("settings");
          if (lsSettings && typeof lsSettings === "object") {
            applySettings(lsSettings as Partial<SiteSettings>);
          }
        }
      })
      .catch(() => {
        const lsSettings = loadFallback("settings");
        if (lsSettings && typeof lsSettings === "object") {
          applySettings(lsSettings as Partial<SiteSettings>);
        }
      });

    fetch("/api/app-state", { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(payload => {
        if (cancelled || !payload?.state) return;
        const state = payload.state as Record<string, unknown>;

        if (state.settings) {
          applySettings(state.settings as Partial<SiteSettings>);
        }
        if (Array.isArray(state.tickets)) setTicketsState(state.tickets as TicketRequest[]);
        if (Array.isArray(state.matchTickets)) setMatchTicketsState(state.matchTickets as MatchTicket[]);
        if (Array.isArray(state.members)) setMembersState(state.members as Member[]);
        if (Array.isArray(state.events)) setEventsState(state.events as Event[]);
        if (Array.isArray(state.posts)) setPostsState(state.posts as BlogPost[]);
        if (Array.isArray(state.tiers)) setTiersState(state.tiers as MembershipTier[]);
        if (Array.isArray(state.donations)) setDonationsState(state.donations as DonationCause[]);
        if (Array.isArray(state.products)) setProductsState(state.products as Product[]);
        if (Array.isArray(state.exco)) setExcoState(state.exco as ExcoMember[]);
        if (Array.isArray(state.suggestions)) setSuggestionsState(state.suggestions as Suggestion[]);
        if (Array.isArray(state.contactMessages)) setContactMsgsState(state.contactMessages as ContactMessage[]);
        if (Array.isArray(state.adminAccounts)) setAdminAcctsState(state.adminAccounts as AdminAccount[]);
        if (Array.isArray(state.backups)) setBackupsState(state.backups as BackupRecord[]);
        if (Array.isArray(state.communityPosts)) setCommunityPostsState(state.communityPosts as CommunityPost[]);
        if (Array.isArray(state.communityChannels) && state.communityChannels.length > 0) {
          setCommunityChannelsState(state.communityChannels as CommunityChannel[]);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const updateSettings = useCallback((p: Partial<SiteSettings>) => {
    setSettingsState(prev => {
      const n = mergeSiteSettings({ ...prev, ...p });
      save("settings", n);
      return n;
    });
  }, []);
  const resetSettings = useCallback(() => {
    setSettingsState(defaultSettings); save("settings", defaultSettings);
  }, []);

  const mk = <T extends {id:string|number}>(
    setter: (fn:(p:T[])=>T[])=>void, storeKey: string
  ) => ({
    set: (arr: T[]) => { setter(()=>arr); save(storeKey,arr); },
    upd: (id: T["id"], up: Partial<T>) =>
      setter(prev => { const n=prev.map(x=>x.id===id?{...x,...up}:x); save(storeKey,n); return n; }),
    del: (id: T["id"]) =>
      setter(prev => { const n=prev.filter(x=>x.id!==id); save(storeKey,n); return n; }),
  });

  const tkt = mk<TicketRequest>(setTicketsState, "tickets");
  const mtt = mk<MatchTicket>(setMatchTicketsState, "matchTickets");
  const mbr = mk<Member>(setMembersState, "members");
  const evt = mk<Event>(setEventsState, "events");
  const pst = mk<BlogPost>(setPostsState, "posts");
  const tir = mk<MembershipTier>(setTiersState, "tiers");
  const don = mk<DonationCause>(setDonationsState, "donations");
  const prd = mk<Product>(setProductsState, "products");
  const exc = mk<ExcoMember>(setExcoState, "exco");
  const sug = mk<Suggestion>(setSuggestionsState, "suggestions");

  const deleteAllMembers = useCallback(() => { setMembersState([]); save("members",[]); }, []);

  const setAdminAccounts = (arr: AdminAccount[]) => { setAdminAcctsState(arr); save("adminAccounts",arr); };
  const updateAdminAccount = (id:string, up:Partial<AdminAccount>) => {
    setAdminAcctsState(prev => { const n=prev.map(a=>a.id===id?{...a,...up}:a); save("adminAccounts",n); return n; });
  };
  const deleteAdminAccount = (id:string) => {
    setAdminAcctsState(prev => { const n=prev.filter(a=>a.id!==id); save("adminAccounts",n); return n; });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addContactMessage = useCallback((m: Omit<ContactMessage,"id"|"createdAt"|"read"|"replied">) => {
    const newMsg: ContactMessage = { ...m, id:`CM${Date.now()}`, createdAt:new Date().toISOString(), read:false, replied:false };
    setContactMsgsState(prev => { const n=[newMsg,...prev]; save("contactMessages",n); return n; });
  }, []);
  const updateContactMessage = useCallback((id:string, up:Partial<ContactMessage>) => {
    setContactMsgsState(prev => { const n=prev.map(m=>m.id===id?{...m,...up}:m); save("contactMessages",n); return n; });
  }, []);
  const deleteContactMessage = useCallback((id:string) => {
    setContactMsgsState(prev => { const n=prev.filter(m=>m.id!==id); save("contactMessages",n); return n; });
  }, []);

  const addSuggestion = useCallback((s: Omit<Suggestion,"id"|"submittedAt"|"status">) => {
    const newSug: Suggestion = { ...s, id:`S${Date.now()}`, status:"New", submittedAt:new Date().toISOString() };
    setSuggestionsState(prev => { const n=[newSug,...prev]; save("suggestions",n); return n; });
  }, []);

  const createBackup = useCallback((label = `Backup ${new Date().toLocaleString()}`) => {
    const snapshot = { settings, tickets, matchTickets, members, events, posts, tiers, donations, products, exco, suggestions, contactMessages:contactMsgs };
    const str = JSON.stringify(snapshot);
    const size = `${(new Blob([str]).size / 1024).toFixed(1)} KB`;
    const rec: BackupRecord = { id:Date.now(), label, createdAt:new Date().toISOString(), size, data:str };
    setBackupsState(prev => { const n=[rec,...prev].slice(0,10); save("backups",n); return n; });
  }, [settings, tickets, matchTickets, members, events, posts, tiers, donations, products, exco, suggestions]);

  const restoreBackup = useCallback((id: number) => {
    const rec = backups.find(b=>b.id===id); if (!rec) return;
    try {
      const snap = JSON.parse(rec.data);
      if (snap.settings) { setSettingsState(snap.settings); save("settings",snap.settings); }
      if (snap.tickets) { setTicketsState(snap.tickets); save("tickets",snap.tickets); }
      if (snap.matchTickets) { setMatchTicketsState(snap.matchTickets); save("matchTickets",snap.matchTickets); }
      if (snap.members) { setMembersState(snap.members); save("members",snap.members); }
      if (snap.events) { setEventsState(snap.events); save("events",snap.events); }
      if (snap.posts) { setPostsState(snap.posts); save("posts",snap.posts); }
      if (snap.tiers) { setTiersState(snap.tiers); save("tiers",snap.tiers); }
      if (snap.donations) { setDonationsState(snap.donations); save("donations",snap.donations); }
      if (snap.products) { setProductsState(snap.products); save("products",snap.products); }
      if (snap.exco) { setExcoState(snap.exco); save("exco",snap.exco); }
      if (snap.suggestions) { setSuggestionsState(snap.suggestions); save("suggestions",snap.suggestions); }
    } catch {}
  }, [backups]);

  const deleteBackup = useCallback((id: number) => {
    setBackupsState(prev => { const n=prev.filter(b=>b.id!==id); save("backups",n); return n; });
  }, []);

  // ── Community Posts & Channels ────────────────────────────────────────────
  const [communityPosts, setCommunityPostsState]     = useState<CommunityPost[]>([]);
  const [communityChannels, setCommunityChannelsState] = useState<CommunityChannel[]>(DEFAULT_CHANNELS);

  useEffect(() => {
    fetch("/api/community", { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(payload => {
        if (Array.isArray(payload?.posts)) setCommunityPostsState(payload.posts as CommunityPost[]);
        if (Array.isArray(payload?.channels) && payload.channels.length > 0) setCommunityChannelsState(payload.channels as CommunityChannel[]);
      })
      .catch(() => {});
  }, []);

  const addCommunityPost = useCallback((p: Omit<CommunityPost,"id"|"createdAt">) => {
    setCommunityPostsState(prev => {
      const newPost: CommunityPost = { ...p, id: Date.now(), createdAt: new Date().toISOString() };
      const updated = [...prev, newPost];
      fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      }).catch(() => {});
      return updated;
    });
  }, []);

  const deleteCommunityPost = useCallback((id: number) => {
    setCommunityPostsState(prev => {
      const n = prev.filter(p => p.id !== id);
      fetch(`/api/community?id=${id}`, { method: "DELETE" }).catch(() => {});
      return n;
    });
  }, []);

  const setCommunityChannels = useCallback((c: CommunityChannel[]) => {
    setCommunityChannelsState(c); save("communityChannels", c);
  }, []);

  // ── Admin Notifications (real, event-driven) ─────────────────────────────
  const addAdminNotification = useCallback((
    title: string,
    message: string,
    type: "info"|"success"|"warning"|"danger" = "info"
  ) => {
    // Persist to DB via dedicated notifications table
    fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, type }),
    }).catch(() => {});
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, []);

  const clearAllNotifications = useCallback(() => {
    fetch("/api/admin/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    }).catch(() => {});
  }, []);

  return (
    <AppContext.Provider value={{
      settings, updateSettings, resetSettings,
      tickets, setTickets:tkt.set, updateTicket:tkt.upd, deleteTicket:tkt.del,
      matchTickets, setMatchTickets:mtt.set, updateMatchTicket:mtt.upd, deleteMatchTicket:mtt.del,
      members, setMembers:mbr.set, updateMember:mbr.upd, deleteMember:mbr.del, deleteAllMembers,
      events, setEvents:evt.set, updateEvent:evt.upd, deleteEvent:evt.del,
      posts, setPosts:pst.set, updatePost:pst.upd, deletePost:pst.del,
      tiers, setTiers:tir.set, updateTier:tir.upd, deleteTier:tir.del,
      donations, setDonations:don.set, updateDonation:don.upd, deleteDonation:don.del,
      products, setProducts:prd.set, updateProduct:prd.upd, deleteProduct:prd.del,
      exco, setExco:exc.set, updateExco:exc.upd, deleteExco:exc.del,
      suggestions, setSuggestions:sug.set, updateSuggestion:sug.upd, deleteSuggestion:sug.del, addSuggestion,
      contactMessages:contactMsgs, addContactMessage, updateContactMessage, deleteContactMessage,
      adminAccounts:adminAcctsState, setAdminAccounts, updateAdminAccount, deleteAdminAccount,
      backups, createBackup, restoreBackup, deleteBackup,
      addAdminNotification, markNotificationRead, clearAllNotifications,
      communityPosts, addCommunityPost, deleteCommunityPost,
      communityChannels, setCommunityChannels,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { useResolvedButton, useResolvedButton as useButtonStyle } from "@/hooks/useResolvedButton";
