import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple API key storage (in production, use a database)
const validApiKeys = new Set([
  process.env.BEDTIME_STORY_API_KEY || 'bs_' + uuidv4().replace(/-/g, '')
]);

// Rate limiting storage (simple in-memory, use Redis in production)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_REQUESTS_PER_WINDOW = 1000;

// Middleware to validate API key
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key is required',
      message: 'Please provide an API key in the X-API-Key header'
    });
  }
  
  if (!validApiKeys.has(apiKey)) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  // Rate limiting
  const now = Date.now();
  const userRequests = rateLimits.get(apiKey) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: `Maximum ${MAX_REQUESTS_PER_WINDOW} requests per second allowed`
    });
  }
  
  recentRequests.push(now);
  rateLimits.set(apiKey, recentRequests);
  
  next();
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Bedtime Story API',
    version: '1.0.0'
  });
});

// Generate story endpoint
app.post('/api/generate-story', validateApiKey, async (req, res) => {
  try {
    const { childName, theme, length, moral } = req.body;
    
    // Validation
    if (!childName || !theme || !length || !moral) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'childName, theme, length, and moral are required'
      });
    }
    
    // Generate story using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `Create a heartwarming bedtime story for a child named ${childName}.

Theme: ${theme}
Story Length: ${length}
Moral/Lesson: ${moral}

Requirements:
- Appropriate for children ages 5-8
- Gentle, calming tone perfect for bedtime
- Include ${childName} as the main character
- Incorporate the theme: ${theme}
- Story should be ${length} in length
- Teach the moral: ${moral}
- End with a peaceful, sleepy conclusion
- Use simple, age-appropriate language
- Include descriptive but soothing imagery

Please write a complete bedtime story that will help a child drift off to sleep peacefully.`;

    const result = await model.generateContent(prompt);
    const story = result.response.text();
    
    res.json({
      success: true,
      story: story,
      metadata: {
        childName,
        theme,
        length,
        moral,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ 
      error: 'Failed to generate story',
      message: error.message
    });
  }
});

// Generate new API key endpoint (protected by master key)
app.post('/api/generate-key', (req, res) => {
  const masterKey = req.headers['x-master-key'];
  
  if (masterKey !== process.env.MASTER_API_KEY) {
    return res.status(403).json({ 
      error: 'Unauthorized',
      message: 'Invalid master key'
    });
  }
  
  const newKey = 'bs_' + uuidv4().replace(/-/g, '');
  validApiKeys.add(newKey);
  
  res.json({
    success: true,
    apiKey: newKey,
    message: 'New API key generated successfully'
  });
});

// List API usage statistics (protected by master key)
app.get('/api/stats', (req, res) => {
  const masterKey = req.headers['x-master-key'];
  
  if (masterKey !== process.env.MASTER_API_KEY) {
    return res.status(403).json({ 
      error: 'Unauthorized',
      message: 'Invalid master key'
    });
  }
  
  const stats = Array.from(rateLimits.entries()).map(([key, requests]) => ({
    apiKey: key.substring(0, 10) + '...',
    requestsInLastMinute: requests.filter(time => Date.now() - time < RATE_LIMIT_WINDOW).length,
    totalRequests: requests.length
  }));
  
  res.json({
    totalActiveKeys: validApiKeys.size,
    usage: stats
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌙 Bedtime Story API running on port ${PORT}`);
  console.log(`📚 API Key configured: ${validApiKeys.values().next().value.substring(0, 10)}...`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  POST /api/generate-story - Generate bedtime story (requires API key)`);
  console.log(`  POST /api/generate-key - Generate new API key (requires master key)`);
  console.log(`  GET  /api/stats - View usage statistics (requires master key)`);
});

export default app;
