// Test script following NVIDIA's OpenAI format with streaming
const API_KEY = 'nvapi-YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key
const MODEL = 'deepseek-ai/deepseek-r1-0528'; // Working DeepSeek R1 model

console.log('🔍 Testing NVIDIA NIM API with OpenAI format (streaming)...');
console.log(`📡 URL: https://integrate.api.nvidia.com/v1/chat/completions`);
console.log(`🤖 Model: ${MODEL}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);
console.log('─'.repeat(60));

async function testDeepSeekR1WithStreaming() {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: "What is 15 * 23? Please show your reasoning step by step."
      }
    ],
    temperature: 0.6,
    top_p: 0.7,
    max_tokens: 4096,
    stream: true  // Enable streaming
  };

  try {
    console.log('📤 Sending request payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('─'.repeat(60));

    console.log('📤 Sending request...');
    
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

    console.log('✅ Request successful! Starting to read stream...');

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    console.log('🔄 Starting streaming response...');
    console.log('─'.repeat(60));
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('\n✅ Stream finished');
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() === '[DONE]') {
            console.log('\n🏁 Stream completed');
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
              if (parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                process.stdout.write(content); // Write immediately
                fullResponse += content;
              }
            }
          } catch (e) {
            console.log(`\n[Debug] Could not parse: ${data}`);
          }
        }
      }
    }
    
    console.log('\n─'.repeat(60));
    console.log('📝 Full Response:');
    console.log(fullResponse);
    console.log('─'.repeat(60));
    
    // Check if thinking tokens are present
    if (fullResponse.includes('<thinking>') || fullResponse.includes('<thought>')) {
      console.log('🧠 THINKING TOKENS FOUND!');
    } else {
      console.log('❌ NO THINKING TOKENS FOUND');
    }
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

testDeepSeekR1WithStreaming();
