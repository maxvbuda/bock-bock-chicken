import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
    const { prompt } = req.body;
    
    // Validation
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'prompt is required'
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '🐔 You are a creative bedtime story writer for children aged 5-8. YOUR ONLY JOB: Write stories about CHICKENS in CHICKENOPOLIS! Every story MUST be set in the magical chicken kingdom of Chickenopolis where EVERYONE is a chicken - roosters, hens, and chicks. NO HUMANS! NO OTHER ANIMALS! Only chickens! You LOVE including chicken names (Sir Cluckington, Lady Featherbottom, etc), chicken sounds (cluck, bock bock), chicken behaviors (pecking, scratching, flapping wings), and Chickenopolis landmarks (Great Coop, Feather Plaza, Egg Market). If a story is not OBVIOUSLY about chickens, you have FAILED! Make every story dripping with chicken-themed details! 🐔'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const story = data.choices[0].message.content;
    
    res.json({
      success: true,
      story: story
    });
    
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ 
      error: 'Failed to generate story',
      message: error.message
    });
  }
});

// Generate image endpoint (DALL-E 3)
app.post('/api/generate-image', validateApiKey, async (req, res) => {
  try {
    const { prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard' } = req.body;
    
    // Validation
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'prompt is required'
      });
    }

    // Validate model
    const validModels = ['dall-e-3', 'dall-e-2'];
    if (!validModels.includes(model)) {
      return res.status(400).json({ 
        error: 'Invalid model',
        message: `Model must be one of: ${validModels.join(', ')}`
      });
    }

    // Validate size based on model
    let validSizes = ['1024x1024'];
    if (model === 'dall-e-3') {
      validSizes = ['1024x1024', '1024x1792', '1792x1024'];
    } else if (model === 'dall-e-2') {
      validSizes = ['256x256', '512x512', '1024x1024'];
    }
    
    if (!validSizes.includes(size)) {
      return res.status(400).json({ 
        error: 'Invalid size',
        message: `Size must be one of: ${validSizes.join(', ')} for ${model}`
      });
    }

    // Build request body
    const requestBody = {
      model: model,
      prompt: prompt,
      n: 1,
      size: size
    };

    // Quality only supported for DALL-E 3
    if (model === 'dall-e-3' && ['standard', 'hd'].includes(quality)) {
      requestBody.quality = quality;
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      model: model,
      size: size,
      quality: quality
    });
    
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

// Generate image endpoint (Hugging Face - FREE!)
app.post('/api/generate-image-huggingface', validateApiKey, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'prompt is required'
      });
    }

    // Use Hugging Face Inference API with Stable Diffusion XL
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
    const model = 'stabilityai/stable-diffusion-xl-base-1.0';
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${errorText}`);
    }

    // Response is binary image data
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      model: 'stable-diffusion-xl',
      provider: 'huggingface',
      cost: 0
    });
    
  } catch (error) {
    console.error('Error generating image with Hugging Face:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

// Generate image endpoint (Stability AI - Very Cheap!)
app.post('/api/generate-image-stability', validateApiKey, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'prompt is required'
      });
    }

    const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
    
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STABILITY_API_KEY}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Stability AI error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const base64Image = data.artifacts[0].base64;
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      model: 'stable-diffusion-xl-1024-v1-0',
      provider: 'stability-ai',
      cost: 0.002
    });
    
  } catch (error) {
    console.error('Error generating image with Stability AI:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

// Generate image with Pollinations.ai (FREE - no API key needed!)
app.post('/api/generate-image-pollinations', validateApiKey, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        message: 'Please provide a prompt for image generation'
      });
    }
    
    // Pollinations.ai is completely free and doesn't require an API key
    // Just encode the prompt and make a GET request to get the image
    const encodedPrompt = encodeURIComponent(prompt);
    // Add nologo=true parameter to remove watermark
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
    
    // Fetch the image
    const response = await fetch(pollinationsUrl);
    
    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.statusText}`);
    }
    
    // Get image as buffer
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      model: 'pollinations-ai',
      provider: 'pollinations',
      cost: 0 // FREE!
    });
    
  } catch (error) {
    console.error('Error generating image with Pollinations.ai:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
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
  console.log(`  POST /api/generate-image - Generate image with DALL-E (requires API key)`);
  console.log(`  POST /api/generate-image-huggingface - Generate image FREE with HF (requires API key)`);
  console.log(`  POST /api/generate-image-stability - Generate image cheap with Stability AI (requires API key)`);
  console.log(`  POST /api/generate-image-pollinations - Generate image FREE with Pollinations.ai (requires API key)`);
  console.log(`  POST /api/generate-key - Generate new API key (requires master key)`);
  console.log(`  GET  /api/stats - View usage statistics (requires master key)`);
});

export default app;
