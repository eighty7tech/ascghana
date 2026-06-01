# Installation Guide — Arsenal SC Ghana Member Portal v1.0.0

## Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | 18.17+ |
| MySQL / MariaDB | 8.0+ / 10.6+ |
| SMTP Server | Any (Gmail, SendGrid, etc.) |

---

## Fresh Installation

### 1. Clone and install dependencies

```bash
git clone <repo-url> ascghana
cd ascghana
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database — required
DATABASE_URL=mysql://user:password@localhost:3306/asc_ghana

# Auth — required
NEXTAUTH_SECRET=generate-a-random-32-char-string
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email / SMTP — required for 2FA, booking confirmations, newsletter
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@arsenalghana.com

# Payment gateways — optional here, can be set in admin panel
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
FLUTTERWAVE_SECRET_KEY=FLWSECK-...
FLUTTERWAVE_WEBHOOK_HASH=your-secret-hash
```

### 3. Create database and run schema

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE asc_ghana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run master schema (34 tables + triggers + default data)
mysql -u root -p asc_ghana < database/schema.sql
```

### 4. Start development server

```bash
npm run dev
```

Open: `http://localhost:3000` | Admin: `http://localhost:3000/admin/login`

### 5. First admin login

Default credentials (change immediately after login):
- Username: `admin`
- Password: `arsenal2024`

---

## Upgrading from v8.x

```bash
# Pull latest code
git pull

# Install new packages
npm install

# Run safe upgrade script (does not drop any data)
mysql -u root -p asc_ghana < database/upgrade.sql
```

---

## Production Deployment (Vercel)

```bash
# Set all environment variables in Vercel dashboard
# Then deploy:
vercel --prod
```

**Webhook URLs to register with payment providers:**
- Paystack: `https://yoursite.com/api/payment/webhook/paystack`
- Flutterwave: `https://yoursite.com/api/payment/webhook/flutterwave`

---

## Gmail SMTP Setup

1. Enable 2-Step Verification on your Google account
2. Go to Google Account → Security → App passwords
3. Generate an App password for "Mail"
4. Use that 16-character password as `SMTP_PASS`

---

## Post-Install Checklist

- [ ] Change admin password in Admin → Admin Accounts
- [ ] Upload club logo in Admin → Settings → Branding
- [ ] Set contact details in Admin → Settings → Contact Page
- [ ] Configure active payment gateway in Admin → Settings → Payments
- [ ] Add membership tiers and pricing in Admin → Tiers
- [ ] Create first admin announcement
- [ ] Test 2FA email by enabling it in Admin → Settings → Authentication
