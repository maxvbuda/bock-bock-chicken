# 🖼️ Story Image Injector - User Guide

## What It Does
The **Story Image Injector** takes your HTML story files and automatically adds AI-generated Chickenopolis-themed illustrations after each story using OpenAI's DALL-E 3.

## How to Use

### Step 1: Generate Stories
1. Use `story-book-generator.html` to create your bedtime stories
2. Download the HTML file with all your stories

### Step 2: Open Image Injector
1. Open `story-image-injector.html` in your browser
2. Click "Upload Your Story HTML"
3. Select the HTML file you downloaded from the story generator

### Step 3: Configure Image Settings
Choose your preferences:
- **Model**: DALL-E 3 (best quality) or DALL-E 2 (cheaper)
- **Size**: 
  - 1024x1024 (square)
  - 1024x1792 (portrait/vertical)
  - 1792x1024 (landscape/horizontal)
- **Art Style**:
  - Children's Book Illustration (recommended)
  - Cartoon Style
  - Watercolor Painting
  - Digital Art
  - 3D Rendered
- **Quality**: Standard or HD

### Step 4: Generate Images
1. Review the cost estimate (shown on screen)
2. Click "🎨 Generate Images for All Stories"
3. Wait for processing (progress bar will show)
4. Each story gets a unique AI-generated illustration

### Step 5: Download
1. Once complete, click "📥 Download Illustrated HTML"
2. Your new HTML file will include all images embedded

## Pricing (OpenAI DALL-E 3)
- **Standard Quality**: ~$0.04 per image
- **HD Quality**: ~$0.08 per image

**Examples:**
- 10 stories = $0.40 - $0.80
- 50 stories = $2.00 - $4.00
- 100 stories = $4.00 - $8.00
- 1000 stories = $40.00 - $80.00

## Estimated Time
- **10 stories**: ~1-2 minutes
- **50 stories**: ~5-10 minutes
- **100 stories**: ~10-20 minutes
- **1000 stories**: ~2-3 hours

## How It Works Behind the Scenes

### Story Parsing
The tool automatically detects stories in your HTML by:
1. Looking for elements with class names containing "story"
2. Detecting H2/H3 headers that mark story beginnings
3. Extracting story content and titles

### Image Prompt Generation
For each story, the tool:
1. Reads the story content (first 500 characters)
2. Creates a DALL-E prompt that includes:
   - Your chosen art style
   - Chickenopolis theme requirements
   - Story-specific scene details
   - Family-friendly specifications

### Example Prompt Template:
```
Create a children's book illustration style illustration for this Chickenopolis bedtime story.
Scene: [story excerpt]

The image MUST feature:
- Anthropomorphic chickens as main characters
- The magical kingdom of Chickenopolis with cozy coops and grain fields
- Warm, inviting atmosphere perfect for bedtime stories
- Family-friendly and suitable for children

Style: children's book illustration style, colorful and friendly, vibrant colors, whimsical, charming
```

### Image Injection
After generation, images are:
1. Embedded directly into your HTML
2. Styled with responsive CSS
3. Placed after each story with proper formatting
4. Given alt text for accessibility

## API Requirements

### You Need:
1. **OpenAI API Key** (from platform.openai.com)
2. **Bedtime Story API Key** (configured in your backend)

### Backend Setup:
The API endpoint `/api/generate-image` is already configured in `api/bedtime-story-api.js` and accepts:

```javascript
{
  "prompt": "Your image generation prompt",
  "model": "dall-e-3",        // or "dall-e-2"
  "size": "1024x1024",         // or "1024x1792", "1792x1024"
  "quality": "standard"        // or "hd"
}
```

## Tips for Best Results

### 1. Story Quality
- Stories with more descriptive details produce better images
- Mention specific Chickenopolis locations and characters
- Include visual details (colors, settings, actions)

### 2. Image Style
- **Children's Book** - Best for bedtime stories
- **Watercolor** - Softer, dreamier feel
- **Cartoon** - Bold and playful
- **3D Render** - Modern, polished look

### 3. Image Size
- **Square (1024x1024)** - Best for general illustrations
- **Portrait (1024x1792)** - Good for character focus
- **Landscape (1792x1024)** - Great for scenic views

### 4. Cost Savings
- Use Standard quality for drafts
- Switch to HD for final publication
- Consider DALL-E 2 for budget projects (lower quality but 70% cheaper)

## Troubleshooting

### No Stories Found
- Make sure your HTML has proper story structure
- Stories should have H2 or H3 headers
- Each story should have substantial content (100+ characters)

### Image Generation Fails
- Check your OpenAI API key is valid
- Verify you have credits in your OpenAI account
- Some prompts may be rejected by OpenAI's content policy (rare for children's stories)

### Download Not Working
- Try a different browser (Chrome/Edge recommended)
- Check your popup blocker isn't blocking the download
- Make sure images finished generating (green checkmarks)

### Images Look Wrong
- Try a different art style
- Regenerate specific problematic stories
- Add more visual details to your original story text

## Alternative Image Services (Coming Soon)

We're working on adding support for:
- **Stability AI (Stable Diffusion)** - Much cheaper (~$0.002/image)
- **Replicate** - Multiple models to choose from
- **Midjourney** - High-quality artistic style (when API available)

## File Structure

```
story-image-injector.html        # Main tool (frontend)
api/bedtime-story-api.js         # Backend with /api/generate-image endpoint
```

## Questions?

This tool is designed to work seamlessly with your Chickenopolis story ecosystem:
- Generate stories → `story-book-generator.html`
- Add images → `story-image-injector.html`
- Create 1000-8000 page illustrated books!

---

**Pro Tip**: Generate stories in batches of 10-50, add images, review quality, then continue. This helps you catch any issues early before processing hundreds of stories!
