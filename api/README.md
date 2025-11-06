https://maxvbuda.github.io/bock-bock-chicken/bedtime-stories.html# 🌙 Bedtime Story Generator API

A secure REST API for generating personalized bedtime stories using Google's Gemini AI.

## Features

- 🔐 **Secure API Key Authentication** - Protect your API with key-based access
- ⚡ **Rate Limiting** - Prevents abuse (10 requests per minute per key)
- 📖 **AI-Powered Stories** - Uses Gemini 2.0 Flash for high-quality story generation
- 🎯 **Customizable** - Personalize stories with child's name, theme, length, and moral
- 📊 **Usage Statistics** - Track API usage with admin endpoints

## Quick Start

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and add your keys:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
BEDTIME_STORY_API_KEY=bs_your_secure_random_key
MASTER_API_KEY=master_super_secret_key
PORT=3000
```

### 3. Run the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The API will be running at `http://localhost:3000`

## API Endpoints

### Health Check
**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "Bedtime Story API",
  "version": "1.0.0"
}
```

### Generate Story
**POST** `/api/generate-story`

Generate a personalized bedtime story.

**Headers:**
```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "childName": "Emma",
  "theme": "Space Adventure",
  "length": "medium",
  "moral": "Courage and curiosity"
}
```

**Response:**
```json
{
  "success": true,
  "story": "Once upon a time, Emma looked up at the stars...",
  "metadata": {
    "childName": "Emma",
    "theme": "Space Adventure",
    "length": "medium",
    "moral": "Courage and curiosity",
    "generatedAt": "2025-11-04T12:00:00.000Z"
  }
}
```

### Generate New API Key (Admin)
**POST** `/api/generate-key`

Create a new API key for users.

**Headers:**
```
X-Master-Key: your_master_key_here
```

**Response:**
```json
{
  "success": true,
  "apiKey": "bs_a1b2c3d4e5f6...",
  "message": "New API key generated successfully"
}
```

### View Statistics (Admin)
**GET** `/api/stats`

View API usage statistics.

**Headers:**
```
X-Master-Key: your_master_key_here
```

**Response:**
```json
{
  "totalActiveKeys": 3,
  "usage": [
    {
      "apiKey": "bs_a1b2c3d...",
      "requestsInLastMinute": 5,
      "totalRequests": 42
    }
  ]
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "API key is required",
  "message": "Please provide an API key in the X-API-Key header"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

### 429 Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 requests per minute allowed"
}
```

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "message": "childName, theme, length, and moral are required"
}
```

## Usage Example (JavaScript)

```javascript
async function generateBedtimeStory() {
  const response = await fetch('http://localhost:3000/api/generate-story', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'bs_your_api_key_here'
    },
    body: JSON.stringify({
      childName: 'Sophie',
      theme: 'Magical Forest',
      length: 'short',
      moral: 'Kindness to animals'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Story:', data.story);
  } else {
    console.error('Error:', data.error);
  }
}
```

## Security Notes

- ⚠️ **Never commit your `.env` file** - It contains sensitive API keys
- 🔒 **Keep your MASTER_API_KEY secret** - This has admin privileges
- 🌐 **Use HTTPS in production** - Protect API keys in transit
- 💾 **Use a database in production** - The current implementation uses in-memory storage

## Rate Limits

- **10 requests per minute** per API key
- Rate limit window: 60 seconds
- Exceeding the limit returns a 429 status code

## Deployment to Render

### Quick Deploy (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your `bock-bock-chicken` repository
   - Configure:
     - **Root Directory:** `api`
     - **Build Command:** `npm install`
     - **Start Command:** `node bedtime-story-api.js`
   
3. **Add Environment Variables:**
   In Render dashboard, add these environment variables:
   - `GEMINI_API_KEY` = `AIzaSyBUJHf2-U3NQyVWfZEAAmtYvRcTUKI2GbY`
   - `BEDTIME_STORY_API_KEY` = `bs_11afe5bbc0142701392a9a5b71c559072923c68fbf2f3000`
   - `MASTER_API_KEY` = `master_780f1dd43edf00f354c3b8d26c5f1ed36971a74410b40f6c6319558d057d869b`
   - `NODE_ENV` = `production`

4. **Deploy!** 
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Your API will be live at: `https://your-service-name.onrender.com`

### Alternative: Blueprint Deploy

The included `render.yaml` file allows one-click deployment:
1. Go to [render.com/deploy](https://render.com/deploy)
2. Enter your repository URL
3. Add environment variables
4. Click "Apply"

### After Deployment

Your API will be available at:
```
https://bedtime-story-api.onrender.com/api/health
```

Update your frontend to use this URL instead of `localhost:3000`!

**Note:** Free tier spins down after 15 minutes of inactivity. First request after inactivity may take 30-60 seconds.

## License

MIT
