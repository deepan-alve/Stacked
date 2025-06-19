# Supabase Setup Guide for Stacked

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up/log in
3. Click "New Project"
4. Choose your organization (create one if needed)
5. Fill in project details:
   - **Name**: `stacked-media-tracker`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location
6. Click "Create new project"

## Step 2: Get Your Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://xxxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Update Environment Variables

Update your `.env.local` file with the real values:

```bash
# Replace with your actual Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Replace with your actual Supabase anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents from `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration

This will create all the necessary tables, policies, and functions.

## Step 5: Test the Setup

After updating your environment variables and running the migration:

1. Restart your development server: `npm run dev`
2. Go to `/auth/signup` to create a test account
3. Try adding some media through the Add Media page
4. Check your Supabase dashboard to see the data

## Step 6: Verify Tables Were Created

In your Supabase dashboard, go to **Table Editor** and verify these tables exist:
- `profiles`
- `media_items`
- `user_media`
- `collections`
- `collection_items`
- `tags`
- `user_media_tags`

## Troubleshooting

### If you get authentication errors:
- Make sure your Supabase URL and anon key are correct
- Check that RLS policies are enabled (they should be from the migration)

### If you can't create accounts:
- Verify the email confirmation settings in **Authentication** → **Settings**
- For development, you can disable email confirmation

### If data isn't saving:
- Check the browser console for errors
- Verify the database migration ran successfully
- Check RLS policies in the Table Editor

## Next Steps

Once this is working:
1. Test the authentication flow
2. Test adding media
3. Test the library page showing real data
4. Set up collections functionality
5. Add advanced features like search within your library

## Security Notes

- The anon key is safe to use in client-side code
- RLS policies ensure users can only access their own data
- Never commit your `.env.local` file to version control
