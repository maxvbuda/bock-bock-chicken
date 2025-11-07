// Quick test script for Stability AI image generation
const fetch = require('node-fetch');

async function testStabilityImage() {
  console.log('🎨 Testing Stability AI image generation...\n');
  
  const prompt = 'A cute cartoon chicken wearing a golden crown in the magical kingdom of Chickenopolis, childrens book illustration style, colorful and whimsical, warm lighting, family friendly';
  
  try {
    const response = await fetch('http://localhost:3000/api/generate-image-stability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'bs_11afe5bbc0142701392a9a5b71c559072923c68fbf2f3000'
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS!\n');
      console.log('Provider:', data.provider);
      console.log('Model:', data.model);
      console.log('Cost:', '$' + data.cost);
      console.log('Image URL length:', data.imageUrl.length, 'characters');
      console.log('\n💰 You just generated an image for $0.002!');
      console.log('📊 1000 images would cost: $2.00');
      console.log('💎 Savings vs DALL-E 3 HD: $78.00 (97.5% off!)');
    } else {
      console.log('❌ Error:', data.error);
      console.log('Message:', data.message);
    }
  } catch (error) {
    console.log('❌ Failed to connect to API');
    console.log('Error:', error.message);
    console.log('\n💡 Make sure the API server is running:');
    console.log('   cd api && npm start');
  }
}

testStabilityImage();
