# 🔑 API Keys Setup Guide

## Required Environment Variables

Add these to your `.env` file in the `/api` directory:

```bash
# OpenAI (for stories and DALL-E images - PAID)
OPENAI_API_KEY=sk-proj-...

# Hugging Face (for FREE image generation!)
HUGGINGFACE_API_KEY=hf_...

# Stability AI (for cheap image generation - $0.002/image)
STABILITY_API_KEY=sk-...

# Your bedtime story API keys
BEDTIME_STORY_API_KEY=bs_...
MASTER_API_KEY=master_...
```

## How to Get Each API Key (FREE and PAID options)

### 1. Hugging Face (FREE! 🎉)

**Cost**: FREE
**Best for**: Budget projects, testing, learning

1. Go to https://huggingface.co/
2. Click "Sign Up" (free account)
3. Once logged in, go to https://huggingface.co/settings/tokens
4. Click "New token"
5. Name it "Chickenopolis Image Generator"
6. Select "Read" permissions
7. Copy the token (starts with `hf_`)
8. Add to `.env`: `HUGGINGFACE_API_KEY=hf_...`

**Limits**: 
- Free tier: ~1000 requests/day
- May have rate limiting during peak hours
- Slightly slower than paid options

---

### 2. Stability AI (CHEAP! 💎)

**Cost**: ~$0.002 per image (99% cheaper than DALL-E 3!)
**Best for**: Production projects on a budget

1. Go to https://platform.stability.ai/
2. Click "Sign Up"
3. You get $25 FREE credits to start!
4. Go to https://platform.stability.ai/account/keys
5. Click "Create API Key"
6. Copy the key (starts with `sk-`)
7. Add to `.env`: `STABILITY_API_KEY=sk-...`

**Pricing**:
- 10 images = $0.02
- 100 images = $0.20
- 1000 images = $2.00
- $25 free credits = ~12,500 images!

---

### 3. OpenAI (PREMIUM 👑)

**Cost**: $0.04-0.08 per image
**Best for**: Highest quality, professional projects

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Add payment method (requires credit card)
4. Go to https://platform.openai.com/api-keys
5. Click "Create new secret key"
6. Name it "Chickenopolis"
7. Copy the key (starts with `sk-proj-` or `sk-`)
8. Add to `.env`: `OPENAI_API_KEY=sk-...`

**Pricing**:
- DALL-E 2: $0.02/image
- DALL-E 3 Standard: $0.04/image
- DALL-E 3 HD: $0.08/image

**New user bonus**: Usually $5 free credits

---

## Recommendation by Use Case

### 📚 Making a book with 100-1000 stories:

**Option 1 - FREE** (Recommended for testing):
```
Use: Hugging Face SDXL
Cost: $0
Time: Medium (may be slower)
Quality: Good (7/10)
```

**Option 2 - CHEAP** (Recommended for production):
```
Use: Stability AI SDXL
Cost: $0.20 - $2.00
Time: Fast
Quality: Great (8/10)
```

**Option 3 - PREMIUM**:
```
Use: DALL-E 3 Standard
Cost: $4.00 - $40.00
Time: Fast
Quality: Excellent (9/10)
```

---

## Cost Comparison Table

| Stories | Hugging Face | Stability AI | DALL-E 2 | DALL-E 3 Std | DALL-E 3 HD |
|---------|--------------|--------------|----------|--------------|-------------|
| 10      | **FREE**     | $0.02        | $0.20    | $0.40        | $0.80       |
| 50      | **FREE**     | $0.10        | $1.00    | $2.00        | $4.00       |
| 100     | **FREE**     | $0.20        | $2.00    | $4.00        | $8.00       |
| 500     | **FREE**     | $1.00        | $10.00   | $20.00       | $40.00      |
| 1000    | **FREE**     | $2.00        | $20.00   | $40.00       | $80.00      |

---

## Testing Your API Keys

After setting up, test each one:

### Test Hugging Face:
```bash
curl -X POST https://bock-bock-chicken.onrender.com/api/generate-image-huggingface \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_bedtime_story_api_key" \
  -d '{"prompt": "A cute cartoon chicken in Chickenopolis"}'
```

### Test Stability AI:
```bash
curl -X POST https://bock-bock-chicken.onrender.com/api/generate-image-stability \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_bedtime_story_api_key" \
  -d '{"prompt": "A cute cartoon chicken in Chickenopolis"}'
```

### Test OpenAI:
```bash
curl -X POST https://bock-bock-chicken.onrender.com/api/generate-image \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_bedtime_story_api_key" \
  -d '{"prompt": "A cute cartoon chicken in Chickenopolis", "model": "dall-e-3"}'
```

---

## My Recommendation

**Start with Hugging Face (FREE)** to test everything, then:

- If quality is good enough → Keep using it for free!
- If you need better quality → Upgrade to Stability AI ($2 for 1000 images)
- If you need absolute best → Use DALL-E 3 ($40 for 1000 images)

**Pro tip**: You can mix and match! Use Hugging Face for most stories, then regenerate only the important ones with DALL-E 3.

---

## Environment Variables Template

Create `/api/.env` with:

```bash
# Choose ONE or ALL of these image providers:

# FREE option (recommended to start)
HUGGINGFACE_API_KEY=hf_your_key_here

# Cheap option (best value for production)
STABILITY_API_KEY=sk-your_key_here

# Premium option (best quality)
OPENAI_API_KEY=sk-your_key_here

# Required for all options
BEDTIME_STORY_API_KEY=bs_your_key_here
MASTER_API_KEY=master_your_key_here
```

Then restart your API server:
```bash
cd api
npm start
```

---

## Troubleshooting

### "API key not found" error:
- Make sure `.env` file is in the `/api` directory
- Restart the API server after adding keys
- Check for typos in key names

### "Hugging Face rate limit exceeded":
- Free tier has limits during peak hours
- Wait a few minutes and try again
- Upgrade to Stability AI for consistent speed

### "Stability AI insufficient credits":
- Add payment method at platform.stability.ai
- $10 minimum top-up gets you ~5000 images

### "OpenAI billing error":
- Add payment method at platform.openai.com
- New accounts get $5 free credits
- Need to add card even for free credits

---

**You're all set!** Start with the FREE option and see how you like it! 🎉
