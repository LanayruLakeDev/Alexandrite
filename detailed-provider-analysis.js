// DETAILED test to show EXACTLY how we know it used Chutes
const VERCEL_API_KEY = 'REPLACE_WITH_YOUR_ACTUAL_VERCEL_KEY'; // ⚠️ REMOVED FOR SECURITY
const DEPLOYED_WORKER_URL = 'https://openai-proxy.alexandrite.workers.dev/v1/chat/completions';

console.log('🔍 DETAILED ANALYSIS: How do we know it used Chutes?');
console.log('─'.repeat(60));

async function detailedAnalysis() {
  const payload = {
    model: 'deepseek/deepseek-v3.1',
    messages: [{ role: "user", content: "Show me the provider info" }],
    max_tokens: 10
  };

  try {
    const response = await fetch(DEPLOYED_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VERCEL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      
      console.log('📊 FULL RESPONSE STRUCTURE:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n🔍 PROVIDER DETECTION LOGIC:');
      console.log('Looking for: data.choices[0].message.provider_metadata.gateway.routing');
      
      const routing = data.choices?.[0]?.message?.provider_metadata?.gateway?.routing;
      
      if (routing) {
        console.log('\n🎯 FOUND ROUTING INFO:');
        console.log('Final provider used:', routing.finalProvider);
        console.log('Planning reasoning:', routing.planningReasoning);
        console.log('Available fallbacks:', routing.fallbacksAvailable);
        
        if (routing.finalProvider === 'chutes') {
          console.log('\n✅ PROOF: finalProvider === "chutes"');
          console.log('💰 This confirms Chutes provider (cheapest pricing)');
        } else {
          console.log('\n❌ UNEXPECTED: finalProvider !==  "chutes"');
          console.log('Expected: chutes, Got:', routing.finalProvider);
        }
        
        if (routing.planningReasoning?.includes('Provider set restricted to: chutes')) {
          console.log('✅ DOUBLE PROOF: Planning shows "restricted to: chutes"');
        }
      } else {
        console.log('❌ NO ROUTING METADATA FOUND');
        console.log('This means either:');
        console.log('- Not going through Vercel AI Gateway');
        console.log('- Response format changed');
        console.log('- Our providerOptions not working');
      }
      
    } else {
      console.log('❌ Request failed:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

detailedAnalysis();