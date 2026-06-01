"use server";

import crypto from "crypto";
import { query, queryOne } from "@/lib/db";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import type { Member } from "@/context/AppContext";

export type ApplicationStatus = "awaiting_payment" | "pending_review" | "approved" | "rejected";
export type PaymentStatus = "unpaid" | "paid" | "failed";

export type RegistrationApplication = {
  id: number;
  application_ref: string;
  tier: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_gateway: string | null;
  payment_ref: string | null;
  application_status: ApplicationStatus;
  form_data: any;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  member_id: number | null;
  created_at: string;
};

let tableReady = false;

export async function ensureRegistrationTable() {
  if (tableReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS registration_applications (
      id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
      application_ref     VARCHAR(64)  NOT NULL UNIQUE,
      tier                  VARCHAR(40)  NOT NULL,
      amount                DECIMAL(12,2) NOT NULL DEFAULT 0,
      currency              VARCHAR(3)   NOT NULL DEFAULT 'GHS',
      payment_status        ENUM('unpaid','paid','failed') NOT NULL DEFAULT 'unpaid',
      payment_gateway       VARCHAR(40)  DEFAULT NULL,
      payment_ref           VARCHAR(120) DEFAULT NULL,
      application_status    ENUM('awaiting_payment','pending_review','approved','rejected') NOT NULL DEFAULT 'awaiting_payment',
      form_data             JSON         NOT NULL,
      email                 VARCHAR(200) NOT NULL,
      first_name            VARCHAR(100) NOT NULL,
      last_name             VARCHAR(100) NOT NULL,
      phone                 VARCHAR(30)  DEFAULT NULL,
      reviewed_by           VARCHAR(100) DEFAULT NULL,
      reviewed_at           DATETIME     DEFAULT NULL,
      member_id             BIGINT       DEFAULT NULL,
      created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_payment_ref (payment_ref),
      INDEX idx_app_status (application_status),
      INDEX idx_pay_status (payment_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  tableReady = true;
}

export async function newApplicationRef() {
  return `REG-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createRegistrationApplication(input: {
  tier: string;
  amount: number;
  currency?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  formData: Record<string, unknown>;
  paymentGateway?: string;
  paymentRef?: string;
  /** manual payments with ref go straight to pending_review */
  manualPayment?: boolean;
}) {
  await ensureRegistrationTable();
  const applicationRef = newApplicationRef();
  const paid = !!input.manualPayment && !!input.paymentRef;

  await query(
    `INSERT INTO registration_applications
      (application_ref, tier, amount, currency, payment_status, payment_gateway, payment_ref,
       application_status, form_data, email, first_name, last_name, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      applicationRef,
      input.tier,
      input.amount,
      input.currency || "GHS",
      paid ? "paid" : "unpaid",
      input.paymentGateway || null,
      input.paymentRef || null,
      paid ? "pending_review" : "awaiting_payment",
      JSON.stringify(input.formData ?? {}),
      input.email,
      input.firstName,
      input.lastName,
      input.phone || null,
    ]
  );

  const row = await queryOne<{ id: number }>(
    "SELECT id FROM registration_applications WHERE application_ref = ? LIMIT 1",
    [applicationRef]
  );

  return { id: row?.id ?? 0, applicationRef };
}

export async function getApplicationByRef(ref: string) {
  await ensureRegistrationTable();
  return queryOne<RegistrationApplication>(
    "SELECT * FROM registration_applications WHERE application_ref = ? OR payment_ref = ? LIMIT 1",
    [ref, ref]
  );
}

export async function getApplicationById(id: number) {
  await ensureRegistrationTable();
  return queryOne<RegistrationApplication>("SELECT * FROM registration_applications WHERE id = ? LIMIT 1", [id]);
}

export async function listRegistrationApplications(status?: ApplicationStatus) {
  await ensureRegistrationTable();
  if (status) {
    return query<RegistrationApplication>(
      "SELECT * FROM registration_applications WHERE application_status = ? ORDER BY created_at DESC LIMIT 500",
      [status]
    );
  }
  return query<RegistrationApplication>("SELECT * FROM registration_applications ORDER BY created_at DESC LIMIT 500", []);
}

export async function markRegistrationPaid(ref: string, gateway: string, amount?: number) {
  await ensureRegistrationTable();
  const app = await getApplicationByRef(ref);
  if (!app) return null;
  if (app.application_status === "approved") return app;

  await query(
    `UPDATE registration_applications
     SET payment_status = 'paid', payment_gateway = COALESCE(payment_gateway, ?),
         payment_ref = COALESCE(payment_ref, ?), application_status = 'pending_review',
         amount = COALESCE(?, amount), updated_at = NOW()
     WHERE id = ? AND payment_status != 'paid'`,
    [gateway, ref, amount ?? app.amount, app.id]
  );

  return getApplicationById(app.id);
}

export async function approveRegistrationApplication(
  id: number,
  reviewedBy: string
): Promise<{ ok: boolean; member?: Member; error?: string }> {
  await ensureRegistrationTable();
  const app = await getApplicationById(id);
  if (!app) return { ok: false, error: "Application not found" };
  if (app.application_status === "approved") return { ok: false, error: "Already approved" };
  if (app.payment_status !== "paid" && app.application_status !== "pending_review") {
    return { ok: false, error: "Payment must be verified before approval" };
  }

  const members = await getStateValue<Member[]>("members", []);
  const form = typeof app.form_data === "string" ? JSON.parse(app.form_data) : app.form_data;

  const maxNum = Math.max(0, ...members.map((m) => parseInt(String(m.membershipNumber), 10) || 0));
  const membershipNumber = String(maxNum + 1).padStart(5, "0");
  const maxId = members.length ? Math.max(...members.map((m) => (typeof m.id === "number" ? m.id : 0))) : 0;

  const newMember: Member = {
    id: maxId + 1,
    membershipNumber,
    firstName: app.first_name,
    lastName: app.last_name,
    name: `${app.first_name} ${app.last_name}`,
    email: app.email,
    phone: app.phone || String(form.phone || ""),
    whatsapp: String(form.whatsapp || form.phone || app.phone || ""),
    dateOfBirth: String(form.dateOfBirth || ""),
    address: String(form.address || ""),
    postGPS: String(form.postGPS || ""),
    branch: String(form.branch || "Accra"),
    tier: app.tier,
    status: "Active",
    joined: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    role: "member",
    password: "",
    ...(form as object),
  } as Member;

  await setStateValue("members", [...members, newMember]);

  await query(
    `UPDATE registration_applications
     SET application_status = 'approved', payment_status = 'paid', member_id = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [newMember.id, reviewedBy, id]
  );

  return { ok: true, member: newMember };
}

export async function rejectRegistrationApplication(id: number, reviewedBy: string) {
  await ensureRegistrationTable();
  await query(
    `UPDATE registration_applications
     SET application_status = 'rejected', reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [reviewedBy, id]
  );
}

