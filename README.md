# Umrah Navigation Messenger MVP

A lightweight, web-based messenger for Umrah groups. Guides create groups, pilgrims join via code, and everyone communicates through text + image messages.

## Tech Stack

- Next.js 14+ (App Router)
- PostgreSQL (DigitalOcean)
- NextAuth.js v5
- Prisma ORM
- Tailwind CSS
- TanStack Query
- RapidAPI SMS

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables in `.env.local`.

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random string for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 for dev)
- `RAPIDAPI_KEY` - RapidAPI key for SMS service (optional)
- `RAPIDAPI_SMS_ENDPOINT` - SMS service endpoint URL (optional)

## Database

This project uses Prisma for database management. To view/edit data:

```bash
npm run db:studio
```

