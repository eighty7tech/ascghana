// src/app/api/admin/renewal-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAdminSession, isAdminRole } from '@/lib/sessionAuth';

async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin || !isAdminRole(admin.role)) return null;
  return admin;
}

/**
 * GET - Fetch renewal and registration settings
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await queryOne('SELECT * FROM renewal_settings WHERE id = 1');

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error fetching renewal settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT - Update renewal and registration settings
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      isRenewalOpen,
      renewalStart,
      renewalEnd,
      isRegistrationOpen,
      registrationStart,
      registrationEnd,
      standardRenewalFee,
      renewalDurationYears,
      autoToggleRenewal,
      autoToggleRegistration
    } = body;

    if (renewalStart && renewalEnd && new Date(renewalStart) > new Date(renewalEnd)) {
      return NextResponse.json(
        { error: 'Renewal start date must be before end date' },
        { status: 400 }
      );
    }

    if (registrationStart && registrationEnd && new Date(registrationStart) > new Date(registrationEnd)) {
      return NextResponse.json(
        { error: 'Registration start date must be before end date' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE renewal_settings 
      SET 
        is_renewal_open = ?,
        renewal_start = ?,
        renewal_end = ?,
        is_registration_open = ?,
        registration_start = ?,
        registration_end = ?,
        standard_renewal_fee = ?,
        renewal_duration_years = ?,
        auto_toggle_renewal = ?,
        auto_toggle_registration = ?,
        updated_at = NOW(),
        updated_by = ?
      WHERE id = 1
    `;

    await query(updateQuery, [
      isRenewalOpen ? 1 : 0,
      renewalStart,
      renewalEnd,
      isRegistrationOpen ? 1 : 0,
      registrationStart,
      registrationEnd,
      standardRenewalFee || 100,
      renewalDurationYears || 2,
      autoToggleRenewal ? 1 : 0,
      autoToggleRegistration ? 1 : 0,
      admin.username
    ]);

    try {
      await query(
        `INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, changes)
         VALUES (?, ?, 'UPDATE', 'renewal_settings', ?)`,
        [admin.id, admin.role, JSON.stringify(body)]
      );
    } catch {
      /* audit table may not exist */
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating renewal settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
