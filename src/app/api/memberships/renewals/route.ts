// src/app/api/memberships/renewals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, getPool } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { logMemberActivity } from '@/lib/activityLog';
import { notifyMember } from '@/lib/memberNotifications';

type Member = {
  id: number;
  membership_number: string;
  tier: string;
  status: string;
  last_renewal_date: string | null;
  renewal_due_date: string | null;
};

type RenewalSettings = {
  is_renewal_open: boolean;
  renewal_start: string;
  renewal_end: string;
  is_registration_open: boolean;
  registration_start: string;
  registration_end: string;
  standard_renewal_fee: number;
  renewal_duration_years: number;
};

type Tier = {
  id: number;
  name: string;
  slug: string;
  price: number;
  renewal_price: number;
};

type RenewalRow = {
  status: string;
  to_tier: string;
  from_tier: string;
};

/**
 * GET - Fetch renewal data
 */
export async function GET(request: NextRequest) {
  try {
    const memberId = request.headers.get('x-member-id');
    const membershipNumber = request.headers.get('x-membership-number');

    if (!memberId || !membershipNumber) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing member identification' },
        { status: 401 }
      );
    }

    const member = (await queryOne(
      `SELECT id, membership_number, tier, status, last_renewal_date, renewal_due_date
       FROM members
       WHERE id = ? AND membership_number = ?`,
      [memberId, membershipNumber]
    )) as Member | null;

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const renewalSettings = (await queryOne(
      `SELECT is_renewal_open, renewal_start, renewal_end,
              is_registration_open, registration_start, registration_end,
              standard_renewal_fee, renewal_duration_years
       FROM renewal_settings`
    )) as RenewalSettings | null;

    const renewalHistory = await query(
      `SELECT * FROM membership_renewals
       WHERE member_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [memberId]
    );

    const tiers = (await query(
      `SELECT id, name, slug, price, renewal_price
       FROM tiers
       WHERE status = "Active"
       ORDER BY price ASC`
    )) as Tier[];

    return NextResponse.json({
      member,
      renewalSettings,
      renewalHistory,
      tiers,
      canRenew: renewalSettings?.is_renewal_open === true,
      canRegister: renewalSettings?.is_registration_open === true
    });

  } catch (error) {
    console.error('Error fetching renewal data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create renewal request
 */
export async function POST(request: NextRequest) {
  try {
    const memberId = request.headers.get('x-member-id');
    const body = await request.json();
    const { renewalType = 'Standard', toTier, paymentMethod } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = (await queryOne(
      'SELECT id, membership_number, tier, status FROM members WHERE id = ?',
      [memberId]
    )) as Member | null;

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const renewalSettings = (await queryOne(
      `SELECT is_renewal_open, standard_renewal_fee, renewal_duration_years
       FROM renewal_settings`
    )) as RenewalSettings | null;

    if (!renewalSettings?.is_renewal_open) {
      return NextResponse.json(
        { error: 'Renewal period is not open' },
        { status: 403 }
      );
    }

    let renewalAmount = renewalSettings.standard_renewal_fee;
    let fromTier = member.tier;
    let finalTier = member.tier;

    if (renewalType !== 'Standard' && toTier) {
      const tier = (await queryOne(
        'SELECT renewal_price FROM tiers WHERE slug = ?',
        [toTier]
      )) as Tier | null;

      if (!tier) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }

      renewalAmount = tier.renewal_price;
      finalTier = toTier;
    }

    const start = new Date();
    const end = new Date();
    end.setFullYear(
      end.getFullYear() + (renewalSettings.renewal_duration_years || 2)
    );

    const conn = await getPool().getConnection();
    let insertId = 0;
    try {
      const [raw] = await conn.execute(
        `INSERT INTO membership_renewals
       (member_id, membership_number, renewal_year, renewal_amount, currency,
        status, renewal_type, from_tier, to_tier, payment_method,
        renewal_start_date, renewal_end_date)
       VALUES (?, ?, ?, ?, 'GHS', 'Processing', ?, ?, ?, ?, ?, ?)`,
        [
          memberId,
          member.membership_number,
          new Date().getFullYear(),
          renewalAmount,
          renewalType,
          fromTier,
          finalTier,
          paymentMethod || 'paystack',
          start,
          end
        ]
      );
      insertId = (raw as ResultSetHeader).insertId;
    } finally {
      conn.release();
    }

    const mid = Number(memberId);
    await logMemberActivity(mid, 'renewal_submitted', `Renewal #${insertId} (${renewalType}, GHS ${renewalAmount})`);
    await notifyMember(mid, 'Renewal submitted', `Your ${renewalType} renewal (GHS ${renewalAmount}) is being processed.`, {
      type: 'info',
      icon: 'fa-solid fa-crown',
      category: 'renewal',
      linkHref: `/checkout?type=renewal&id=${insertId}`,
    });

    return NextResponse.json({
      success: true,
      renewalId: insertId,
      amount: renewalAmount,
      redirectTo: `/checkout?type=renewal&id=${insertId}`
    });

  } catch (error) {
    console.error('Error creating renewal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update renewal status
 */
export async function PUT(request: NextRequest) {
  try {
    const memberId = request.headers.get('x-member-id');
    const body = await request.json();
    const { renewalId, status, transactionRef } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const renewal = (await queryOne(
      'SELECT * FROM membership_renewals WHERE id = ? AND member_id = ?',
      [renewalId, memberId]
    )) as RenewalRow | null;

    if (!renewal) {
      return NextResponse.json({ error: 'Renewal not found' }, { status: 404 });
    }

    await query(
      'UPDATE membership_renewals SET status = ?, transaction_reference = ?, payment_date = NOW() WHERE id = ?',
      [status, transactionRef, renewalId]
    );

    if (status === 'Completed') {
      await query(
        `UPDATE members
         SET status = "Active",
             tier = ?,
             last_renewal_date = NOW(),
             renewal_due_date = DATE_ADD(NOW(), INTERVAL 2 YEAR)
         WHERE id = ?`,
        [renewal.to_tier || renewal.from_tier, memberId]
      );
      const mid = Number(memberId);
      await logMemberActivity(mid, 'renewal_completed', `Renewal #${renewalId} completed`);
      await notifyMember(mid, 'Membership renewed', 'Your membership renewal is complete. Thank you for staying with ASC Ghana!', {
        type: 'success',
        icon: 'fa-solid fa-circle-check',
        category: 'renewal',
        linkHref: '/members/membership',
      });
    } else if (status === 'Failed' || status === 'Cancelled') {
      await logMemberActivity(Number(memberId), 'renewal_status', `Renewal #${renewalId} → ${status}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating renewal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel renewal
 */
export async function DELETE(request: NextRequest) {
  try {
    const memberId = request.headers.get('x-member-id');
    const { searchParams } = new URL(request.url);
    const renewalId = searchParams.get('id');

    if (!memberId || !renewalId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const renewal = (await queryOne(
      'SELECT status FROM membership_renewals WHERE id = ? AND member_id = ?',
      [renewalId, memberId]
    )) as RenewalRow | null;

    if (!renewal) {
      return NextResponse.json({ error: 'Renewal not found' }, { status: 404 });
    }

    if (renewal.status !== 'Processing') {
      return NextResponse.json(
        { error: 'Can only cancel processing renewals' },
        { status: 403 }
      );
    }

    await query('DELETE FROM membership_renewals WHERE id = ?', [renewalId]);

    await logMemberActivity(Number(memberId), 'renewal_cancelled', `Renewal #${renewalId} cancelled`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting renewal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}