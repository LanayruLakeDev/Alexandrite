// Test script to connect directly to NVIDIA NIM API
const API_KEY = 'nvapi-YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key
const MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'; // Correct model name from the list

console.log('🔍 Testing NVIDIA NIM API directly...');
console.log(`📡 URL: https://integrate.api.nvidia.com/v1/chat/completions`);
console.log(`🤖 Model: ${MODEL}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);
console.log('─'.repeat(60));

async function testNVIDIADirect() {
  // Check if API key is set
  if (API_KEY === 'nvapi-YOUR-API-KEY-HERE') {
    console.log('❌ Please set your NVIDIA API key in this file first!');
    console.log('📝 Edit line 2 and replace "nvapi-YOUR-API-KEY-HERE" with your actual key');
    return;
  }
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: "Hello! Please respond with a short greeting."
      }
    ],
    temperature: 0.6,
    top_p: 0.7,
    max_tokens: 100,
    stream: false
  };

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\n🤖 AI Response:');
      console.log(data.choices[0].message.content);
    }
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

testNvidiaDirectly();
