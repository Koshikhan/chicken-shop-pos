# Chicken Shop POS

A browser-based point-of-sale system for a chicken shop, built with Next.js, React, TypeScript, and Tailwind CSS.

The project is currently an MVP. It supports staff login, product and menu management, order creation, payments, receipts, VAT and non-VAT sales, order history, and manager sales reports.

## Current Features

- Staff login with Manager, Supervisor, and Cashier roles
- Product categories and menu management
- Add products to the cart
- Increase, decrease, and remove cart items
- Takeaway, Eat In, and Delivery order types
- Cash and card payment methods
- Cash received and change calculation
- Completed order storage
- Searchable order history
- Printable customer receipts
- VAT and Non-VAT sale selection
- VAT-inclusive net and VAT calculations
- Manager sales reports
- Date, payment method, order type, and tax type report filters
- Printable sales reports
- Browser `localStorage` persistence

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Browser Local Storage
- npm
- Git and GitHub

All required npm packages are listed in `package.json`. Do not install dependencies one by one unless a new package is being added to the project.

## Getting Started

### 1. Install the required software

Install:

- Node.js
- npm
- Git
- Visual Studio Code, or another code editor

Check that Node.js, npm, and Git are available:

```bash
node -v
npm -v
git --version
```

### 2. Clone the project

```bash
git clone https://github.com/Koshikhan/chicken-shop-pos.git
cd chicken-shop-pos
```

### 3. Install the project dependencies

```bash
npm install
```

This reads `package.json` and installs all libraries required by the project.

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If port `3000` is already being used, Next.js may start on another port such as `3001`.

## Important Commands

Start the development server:

```bash
npm run dev
```

Check TypeScript errors:

```bash
npx tsc --noEmit
```

Create a production build:

```bash
npm run build
```

Run the production build:

```bash
npm run start
```

Check the current Git status:

```bash
git status
```

## Project Structure

```text
chicken-shop-pos/
├── public/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── MenuManagementModal.tsx
│   │   ├── OrderHistoryModal.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── SalesReportModal.tsx
│   │   └── StaffLoginModal.tsx
│   │
│   └── lib/
│       ├── menuStorage.ts
│       ├── orderStorage.ts
│       ├── salesReport.ts
│       ├── staffStorage.ts
│       └── tax.ts
│
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Main Files

### `src/app/page.tsx`

The main POS screen. It controls:

- Staff session
- Product display
- Cart
- Order type
- VAT or Non-VAT selection
- Payment flow
- Completed order creation
- Opening the management modals

### `src/components/PaymentModal.tsx`

Handles:

- Cash and card selection
- Cash input
- Quick cash amount buttons
- Change calculation
- VAT details during payment
- Successful payment confirmation

### `src/components/OrderHistoryModal.tsx`

Handles:

- Completed order display
- Order search
- VAT and Non-VAT details
- Receipt printing

### `src/components/SalesReportModal.tsx`

Handles:

- Daily, weekly, monthly, and custom reports
- Payment filters
- Order type filters
- VAT and Non-VAT filters
- Gross sales
- Net sales
- VAT collected
- Product performance
- Printable reports

### `src/lib/orderStorage.ts`

Defines the saved order structure and stores completed orders in browser `localStorage`.

### `src/lib/tax.ts`

Calculates VAT and Non-VAT totals.

Current application behaviour:

- VAT sales treat displayed prices as VAT-inclusive
- VAT rate is currently set to 20%
- Non-VAT sales record no VAT
- A £12 VAT-inclusive sale is stored as £10 net and £2 VAT

This describes the current application logic and is not accounting or tax advice.

## Local Storage

The current MVP stores data in the browser using `localStorage`.

This includes:

- Products and menu changes
- Completed orders
- Staff session information

Important limitations:

- Data is stored separately in each browser
- Data is not shared between computers
- Clearing browser data can remove POS data
- Incognito or private browsing may not preserve data
- There is currently no central database
- There is currently no cloud backup

Do not use real business data in production until database storage, authentication, permissions, backups, and security have been added.

## Staff Access

The current development version uses locally defined staff accounts and PINs.

The staff configuration is located in:

```text
src/lib/staffStorage.ts
```

Do not publish real employee PINs or use development PINs in a production system.

## Collaboration Workflow

Do not make all changes directly on the `main` branch.

### Before starting work

```bash
git checkout main
git pull origin main
```

### Create a feature branch

Use a clear branch name:

```bash
git checkout -b feature/refunds
```

Other examples:

```text
feature/customer-display
feature/database
feature/discounts
fix/payment-calculation
fix/receipt-layout
```

### Save your changes

```bash
git add .
git commit -m "Add refund order support"
```

### Push the branch

```bash
git push -u origin feature/refunds
```

Then create a Pull Request on GitHub and ask another team member to review it before merging.

## Team Rules

- Pull the latest `main` branch before starting
- Create one branch per feature or bug fix
- Keep commits small and clearly named
- Run `npx tsc --noEmit` before pushing
- Run `npm run build` before merging major changes
- Do not commit `node_modules`
- Do not commit the `.next` folder
- Do not upload secrets, passwords, production PINs, or API keys
- Avoid editing the same large file at the same time
- Use Pull Requests instead of pushing directly to `main`
- Test VAT and Non-VAT orders after payment-related changes
- Test old saved orders after storage structure changes

## After Pulling Changes

When another developer adds or updates packages, run:

```bash
git pull origin main
npm install
```

Then check the project:

```bash
npx tsc --noEmit
npm run dev
```

## Adding a New Library

Only install a package when it is actually needed.

Example:

```bash
npm install package-name
```

For a development-only library:

```bash
npm install --save-dev package-name
```

Commit both files after installing a package:

```text
package.json
package-lock.json
```

## Troubleshooting

### Port 3000 is already in use

Find the process:

```bash
lsof -i :3000
```

Stop it:

```bash
kill PROCESS_ID
```

Or allow Next.js to start on another available port.

### The app is showing an old version

Stop the server and remove the Next.js build cache:

```bash
rm -rf .next
npm run dev
```

Then hard-refresh the browser.

On macOS:

```text
Command + Shift + R
```

### TypeScript errors

Run:

```bash
npx tsc --noEmit
```

Read the first error first. Later errors may be caused by the first one.

### Dependencies are missing

Run:

```bash
npm install
```

### Local data has disappeared

The current version uses browser `localStorage`. Data may disappear when:

- Browser storage is cleared
- A different browser is used
- A different computer is used
- Private browsing is used

## Current Development Status

Completed:

- Core cashier POS
- Menu management
- Staff roles
- Cash and card payments
- Order history
- Receipt printing
- VAT and Non-VAT sales
- VAT reporting
- Custom sales reports

Planned next:

- Voided orders
- Full and partial refunds
- Refund and void reasons
- Manager approval for sensitive actions
- Audit history
- Database storage
- Secure authentication
- Multi-device synchronisation
- Inventory and stock tracking
- Discounts and promotions
- Customer-facing order display
- Kitchen order screen
- Receipt printer integration
- User and permission management
- Deployment and backups

## Before Production Use

The project is not yet production-ready.

Before using it in a real shop, the team should add:

- A secure database
- Server-side authentication
- Encrypted staff credentials
- Role-based permissions
- Audit logs
- Backups
- Error monitoring
- Automated tests
- Stock management
- Proper refund controls
- Tax and accounting review
- Secure deployment
- Privacy and data retention policies

## Contribution Checklist

Before opening a Pull Request:

```text
[ ] The feature works in the browser
[ ] VAT orders were tested
[ ] Non-VAT orders were tested
[ ] Cash payments were tested
[ ] Card payments were tested
[ ] npx tsc --noEmit passes
[ ] npm run build passes
[ ] No secrets or real PINs were committed
[ ] package-lock.json was committed when dependencies changed
[ ] The Pull Request explains what changed
```

## Repository

```text
https://github.com/Koshikhan/chicken-shop-pos
```
