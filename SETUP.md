# Umrah Messenger - Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (already provisioned on DigitalOcean)
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
RAPIDAPI_KEY=your-rapidapi-key-optional
RAPIDAPI_SMS_ENDPOINT=https://api.rapidapi.com/sms/service-optional
```

**Important**: Generate a secure `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

The `RAPIDAPI_KEY` and `RAPIDAPI_SMS_ENDPOINT` are optional - announcements will still work without SMS.

### 3. Set Up Database

Generate Prisma Client:
```bash
npm run db:generate
```

Push schema to database:
```bash
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Time Setup

1. Register a new account at `/register`
2. Choose your role (Guide or Pilgrim)
3. If Guide: Create a group and share the code
4. If Pilgrim: Enter the group code to join

## Testing

### Create a Guide Account
1. Go to `/register`
2. Select "Guide" role
3. Create an account
4. After login, you'll be redirected to the Guide Dashboard
5. Create a group and note the code

### Create a Pilgrim Account
1. Go to `/register`
2. Select "Pilgrim" role
3. Create an account
4. Enter the group code from your guide
5. Start chatting!

## Image Uploads

Images are stored locally in `/public/uploads/[group_id]/` during development. For production, you'll need to migrate to S3 or Cloudinary.

## SMS Integration (Optional)

To enable SMS notifications for announcements:

1. Sign up for a RapidAPI account
2. Subscribe to an SMS service (e.g., Twilio, MessageBird)
3. Add your RapidAPI key and endpoint to `.env.local`
4. Ensure users have phone numbers in their profiles

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

**Note**: For image uploads in production, you'll need to:
- Set up S3 or Cloudinary
- Update the image upload API route
- Configure environment variables

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database firewall settings
- Ensure SSL connection is configured if required

### NextAuth Errors
- Make sure `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your deployment URL

### Image Upload Fails
- Check that `/public/uploads` directory exists
- Verify file permissions
- Check file size limits (5MB max)

