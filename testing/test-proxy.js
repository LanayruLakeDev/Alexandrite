// Test script to test our proxy
const API_KEY = 'YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key
const MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'; // Correct model name
const PROXY_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';

console.log('🔍 Testing OUR PROXY...');
console.log(`📡 Proxy URL: ${PROXY_URL}`);
console.log(`🤖 Model: ${MODEL}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);
console.log('─'.repeat(60));

async function testProxy() {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: "Hello from the proxy! Please respond with a short greeting."
      }
    ],
    temperature: 0.6,
    top_p: 0.7,
    max_tokens: 100,
    stream: false
  };

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
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
      console.log('\n🤖 AI Response via Proxy:');
      console.log(data.choices[0].message.content);
    }
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

testProxy();
