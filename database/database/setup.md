# Arsenal Ghana Database Setup Guide

## Requirements
- MySQL 8.0+ or MariaDB 10.6+
- A cPanel hosting account with phpMyAdmin access

---

## Step 1 — Create the Database

In cPanel → MySQL Databases:
1. Create a new database: `arsenal_ghana_db`
2. Create a new MySQL user with a strong password
3. Add the user to the database with **All Privileges**

---

## Step 2 — Import the Schema

In cPanel → phpMyAdmin:
1. Click on your database (`arsenal_ghana_db`) in the left panel
2. Click the **Import** tab
3. Click **Browse** and select `schema.sql`
4. Scroll down and click **Go**

If you see **"Arsenal Ghana DB schema v3.2.0 installed successfully"** at the bottom, the import worked.

### Common Import Errors

| Error | Fix |
|-------|-----|
| `Table 'xxx' already exists` | Schema uses `CREATE TABLE IF NOT EXISTS` — safe to re-run. If tables already exist from a previous version, run `DROP DATABASE arsenal_ghana_db; CREATE DATABASE arsenal_ghana_db;` first then re-import |
| `Unknown collation: utf8mb4_unicode_ci` | Your MySQL version is too old. Upgrade to MySQL 8.0+ or change `COLLATE utf8mb4_unicode_ci` to `utf8mb4_general_ci` in the first 5 lines of schema.sql |
| `Specified key was too long` | Add `SET GLOBAL innodb_large_prefix=ON;` before the import |
| `FOREIGN KEY constraint fails` | The schema sets `SET FOREIGN_KEY_CHECKS = 0` at the top — make sure that line is included |
| File too large | phpMyAdmin has a default 2MB upload limit. Increase via `php.ini`: `upload_max_filesize = 16M` and `post_max_size = 16M`. Or use MySQL command line: `mysql -u user -p arsenal_ghana_db < schema.sql` |

---

## Step 3 — Configure .env

Copy `.env.example` to `.env.local` and fill in your details:

```env
DATABASE_URL=mysql://USERNAME:PASSWORD@localhost:3306/arsenal_ghana_db
JWT_SECRET=your-very-long-random-secret-string-here
NEXTAUTH_URL=https://yourdomain.com
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
```

---

## Step 4 — Hash the Admin Passwords

The schema inserts placeholder password hashes. Before going live, update them:

```sql
UPDATE admin_users 
SET password_hash = '$2b$12$YOUR_BCRYPT_HASH_HERE'
WHERE username = 'eighty7tech';
```

Use [bcrypt-generator.com](https://bcrypt-generator.com) or run:
```bash
node -e "const b=require('bcrypt'); b.hash('@23HuzDan25',12).then(h=>console.log(h))"
```

---

## Tables Summary

| Table | Purpose |
|-------|---------|
| `roles` | Admin role definitions |
| `admin_users` | Admin login accounts |
| `membership_tiers` | Bronze/Silver/Gold/Platinum/Abusua |
| `members` | All member records |
| `member_notifications` | In-app member notifications |
| `events` | Club events |
| `event_bookings` | Member & guest event bookings |
| `match_tickets` | Emirates match ticket listings |
| `ticket_requests` | Member ticket requests |
| `donation_causes` | Donation fundraising causes |
| `donations` | Individual donation records |
| `products` | Shop products |
| `orders` | Shop orders |
| `order_items` | Order line items |
| `blog_posts` | Blog articles |
| `gallery_albums` | Gallery albums |
| `gallery_images` | Gallery photos |
| `exco_members` | Executive committee |
| `suggestions` | Member suggestions to exco |
| `community_messages` | Community chat messages |
| `contact_messages` | Contact form submissions |
| `site_settings` | All CMS key-value settings |
| `hero_slides` | Homepage hero carousel |
| `hero_stats` | Homepage stat numbers |
| `member_of_week` | Featured member |
| `social_links` | Social media links |
| `footer_columns` | Footer nav column headings |
| `footer_links` | Footer nav links |
| `top_bar_items` | Top navigation bar items |
| `nav_items` | Main navigation with dropdowns |
| `admin_notifications` | Admin dashboard notifications |
| `birthday_template` | Birthday email template |
| `newsletter_subscribers` | Email subscriber list |
| `payment_gateways` | Payment gateway configs |
| `backups` | Backup log |
| `file_uploads` | Uploaded file registry |

---

## Seeded Data

The schema seeds the following default data on import:
- **5 membership tiers**: Bronze, Silver, Gold, Platinum, Abusua
- **3 hero slides**: About, Story, Tickets
- **4 hero stats**: Members, Founded, Official, Regions  
- **4 donation causes**: General, Charity, Youth, Emirates Trip
- **5 social links**: Facebook, Instagram, Twitter/X, YouTube, WhatsApp
- **4 footer columns** with links
- **9 nav items** with 6 dropdown children
- **All site_settings** with sensible defaults
- **6 payment gateways**: Paystack (active), MTN, Hubtel, Flutterwave, Bank, Cash

