# 🚀 Deploy to Render - Quick Guide

## Step 1: Push Your Code to GitHub ✅

Your code is already on GitHub! Skip to Step 2.

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with your GitHub account (easiest option)

## Step 3: Deploy Your API

1. **In Render Dashboard:**
   - Click the "New +" button (top right)
   - Select "Web Service"

2. **Connect Repository:**
   - Click "Connect account" if needed
   - Find and select: `bock-bock-chicken`
   - Click "Connect"

3. **Configure Service:**
   - **Name:** `bedtime-story-api` (or anything you like)
   - **Region:** Oregon (US West) - closest to you
   - **Branch:** `main`
   - **Root Directory:** `api` ⚠️ IMPORTANT!
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node bedtime-story-api.js`
   - **Instance Type:** Free

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable" and add these:

   ```
   GEMINI_API_KEY = AIzaSyBUJHf2-U3NQyVWfZEAAmtYvRcTUKI2GbY
   BEDTIME_STORY_API_KEY = bs_11afe5bbc0142701392a9a5b71c559072923c68fbf2f3000
   MASTER_API_KEY = master_780f1dd43edf00f354c3b8d26c5f1ed36971a74410b40f6c6319558d057d869b
   NODE_ENV = production
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 2-3 minutes while Render builds and deploys
   - ✅ Done!

## Step 4: Get Your API URL

After deployment completes, you'll see your live URL at the top:
```
https://bedtime-story-api-xxxx.onrender.com
```

## Step 5: Test Your API

Test it in your browser or with curl:
```bash
curl https://your-url.onrender.com/api/health
```

You should see:
```json
{"status":"healthy","service":"Bedtime Story API","version":"1.0.0"}
```

## Step 6: Update Your Bedtime Stories Page

Replace `http://localhost:3000` with your Render URL in:
- `bedtime-stories.html`
- `api/test.html`

## Important Notes

⚠️ **Free Tier Limitations:**
- Spins down after 15 minutes of inactivity
- First request after inactivity takes 30-60 seconds to wake up
- 750 hours/month free (enough for personal use)

✅ **Advantages:**
- Your API runs 24/7 (when active)
- Works even when your computer is off
- Automatic HTTPS
- Auto-deploys when you push to GitHub

## Troubleshooting

**Build Failed?**
- Check that Root Directory is set to `api`
- Verify all environment variables are added

**Can't connect?**
- Free tier may be sleeping, wait 30-60 seconds
- Check the Render logs for errors

**Need Help?**
- Check Render logs in the dashboard
- Visit [Render docs](https://render.com/docs)

---

🎉 Your API is now live on the internet!
