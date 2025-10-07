# Vercel Blob Storage Setup

## Environment Variable Required

You need to add the `BLOB_READ_WRITE_TOKEN` environment variable to your Vercel project.

### Steps:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `alliboard`
3. **Go to Settings** → **Environment Variables**
4. **Add new variable**:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Get this from Vercel Blob dashboard
   - **Environment**: Production, Preview, Development (all)

### Getting the Token:

1. Go to https://vercel.com/dashboard
2. Click on **Storage** in the sidebar
3. Click **Create Database** → **Blob**
4. Create a new Blob store
5. Copy the `BLOB_READ_WRITE_TOKEN` from the store settings

### Alternative (if you don't have Blob access):

You can also run this command to create a Blob store:

```bash
vercel blob create
```

This will automatically add the environment variable to your project.

## What This Enables:

- ✅ **Persistent storage** - Data survives serverless function restarts
- ✅ **Full CRUD operations** - Create, read, update, delete all entities
- ✅ **Scalable** - No size limits, grows with your data
- ✅ **Fast** - Optimized for serverless functions
- ✅ **Reliable** - Built-in redundancy and backup

## Testing:

Once deployed with the environment variable, you can:

1. Add students and aides
2. Refresh the page
3. Data should persist across sessions
4. Create schedule blocks
5. Save and load templates

All data will be stored in Vercel Blob and persist permanently!
