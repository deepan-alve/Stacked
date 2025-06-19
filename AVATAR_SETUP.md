# Avatar Upload Setup Guide

## Issue: "Bucket not found" Error

The avatar upload feature requires a storage bucket named `avatars` in your Supabase project. Since automatic bucket creation from the client-side fails due to JWT authentication limitations, you need to create it manually.

## Step-by-Step Setup

### 1. Access Your Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and sign in
2. Navigate to your **Stacked** project dashboard

### 2. Create the Storage Bucket
1. In the left sidebar, click **Storage**
2. Click the **New bucket** button
3. Configure the bucket:
   - **Name**: `avatars` (exactly as shown, lowercase)
   - **Public bucket**: ✅ **ON** (this allows public access to avatar images)
   - Click **Create bucket**

### 3. Configure Bucket Policies (Recommended)
1. Still in **Storage**, click on the **Policies** tab
2. You'll see policies for the `avatars` bucket
3. Add these policies for better security:

#### Allow Public Read Access:
```sql
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

#### Allow Authenticated Users to Upload:
```sql
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Allow Users to Update Their Own Avatars:
```sql
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Allow Users to Delete Their Own Avatars:
```sql
CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4. Test the Upload
1. Run your app: `npm run dev`
2. Go to **Settings** → **Profile** tab
3. Click the camera icon next to your avatar
4. Select an image file (PNG, JPEG, GIF, WebP under 5MB)
5. The upload should now work!

## File Structure
Once set up, avatars will be stored like this:
```
avatars/
├── user1-id/
│   └── avatar.jpg
├── user2-id/
│   └── avatar.png
└── user3-id/
    └── avatar.webp
```

## Troubleshooting

### Still getting "Bucket not found"?
- Double-check the bucket name is exactly `avatars` (no capitals, no spaces)
- Verify you're in the correct Supabase project
- Make sure the bucket was created successfully (you should see it in the Storage tab)

### Getting "Permission denied"?
- Ensure the bucket is set to **Public**
- Check that the RLS policies are created
- Make sure you're signed in to the app

### Upload fails silently?
- Check browser console for error messages
- Verify file is under 5MB and is a supported image format
- Test with a different image file

## Why Manual Setup?
The JWT token from client-side code doesn't have administrative privileges to create storage buckets. This is a security feature - bucket creation should be done by project administrators through the dashboard.
