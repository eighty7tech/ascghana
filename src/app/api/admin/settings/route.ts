// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAdminSession, isAdminRole } from '@/lib/sessionAuth';

type Setting = {
  id: number;
  section: string;
  setting_key: string;
  setting_value: string;
};

async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin || !isAdminRole(admin.role)) return null;
  return admin;
}

/**
 * GET - Fetch all settings grouped by section
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const section = new URL(request.url).searchParams.get('section');

    let sql = 'SELECT * FROM admin_settings WHERE 1=1';
    const params: unknown[] = [];

    if (section) {
      sql += ' AND section = ?';
      params.push(section);
    }

    sql += ' ORDER BY section, setting_key';

    const result = await query(sql, params);
    const settings: Setting[] = Array.isArray(result) ? (result as Setting[]) : [];

    const grouped = settings.reduce<Record<string, Setting[]>>((acc, setting) => {
      if (!acc[setting.section]) {
        acc[setting.section] = [];
      }
      acc[setting.section].push(setting);
      return acc;
    }, {});

    return NextResponse.json(grouped);

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update single setting
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      );
    }

    const existing = (await queryOne(
      'SELECT * FROM admin_settings WHERE setting_key = ?',
      [key]
    )) as Setting | null;

    if (!existing) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    await query(
      `UPDATE admin_settings
       SET setting_value = ?, updated_at = NOW(), updated_by = ?
       WHERE setting_key = ?`,
      [String(value), admin.username, key]
    );

    try {
      await query(
        `INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id, changes)
         VALUES (?, ?, 'UPDATE', 'admin_settings', ?, ?)`,
        [
          admin.id,
          admin.role,
          existing.id,
          JSON.stringify({ old: existing.setting_value, new: value })
        ]
      );
    } catch {
      /* audit table may not exist */
    }

    return NextResponse.json({
      success: true,
      message: `Setting '${key}' updated successfully`
    });

  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Bulk update settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = (await request.json()) as {
      key: string;
      value: unknown;
    }[];

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    for (const setting of settings) {
      await query(
        `UPDATE admin_settings
         SET setting_value = ?, updated_at = NOW(), updated_by = ?
         WHERE setting_key = ?`,
        [String(setting.value), admin.username, setting.key]
      );
    }

    try {
      await query(
        `INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, changes)
         VALUES (?, ?, 'BULK_UPDATE', 'admin_settings', ?)`,
        [admin.id, admin.role, JSON.stringify(settings)]
      );
    } catch {
      /* audit table may not exist */
    }

    return NextResponse.json({
      success: true,
      message: `${settings.length} settings updated successfully`
    });

  } catch (error) {
    console.error('Error bulk updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
