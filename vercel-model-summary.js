// Quick Vercel AI Gateway Model Price Summary 
// Based on the full analysis, here are the best choices:

console.log('💰 BEST VERCEL AI GATEWAY MODELS BY PRICE:');
console.log('═'.repeat(60));

console.log('\n🏆 TOP 10 CHEAPEST TOTAL COST (Input + Output):');
console.log('─'.repeat(50));
console.log('1. $0.000000075 - amazon/nova-micro (Amazon)');
console.log('   Input: $0.000000035 | Output: $0.00000014');
console.log('   💡 Cheapest overall! Text-only, lowest latency');

console.log('\n2. $0.000000112 - alibaba/qwen-3-14b (Alibaba)');  
console.log('   Input: $0.00000008 | Output: $0.00000024');
console.log('   💡 Great value, 14B model with good capabilities');

console.log('\n3. $0.000000135 - meta/llama-3.1-8b (Meta)');
console.log('   Input: $0.00000005 | Output: $0.00000008');  
console.log('   💡 Popular open source model, fast via Groq');

console.log('\n4. $0.000000154 - deepseek/deepseek-v3 (DeepSeek)');
console.log('   Input: $0.00000077 | Output: $0.00000077');
console.log('   💡 BEST REASONING MODEL! Shows thinking process');

console.log('\n5. $0.0000002 - meta/llama-4-scout (Meta)');
console.log('   Input: $0.0000001 | Output: $0.0000003');
console.log('   💡 Latest Llama 4, multimodal, 17B with 16 experts');

console.log('\n6. $0.0000003 - deepseek/deepseek-v3.1 (DeepSeek)'); 
console.log('   Input: $0.0000001999 | Output: $0.0000008001');
console.log('   💡 Improved reasoning, long context');

console.log('\n7. $0.0000004 - meta/llama-3.2-3b (Meta)');
console.log('   Input: $0.00000015 | Output: $0.00000015');
console.log('   💡 Good for on-device use, multilingual');

console.log('\n8. $0.0000005 - alibaba/qwen-3-32b (Alibaba)');
console.log('   Input: $0.0000001 | Output: $0.0000003');
console.log('   💡 Larger Qwen model, excellent performance');

console.log('\n9. $0.0000008 - deepseek/deepseek-v3.1-thinking (DeepSeek)');
console.log('   Input: $0.00000056 | Output: $0.00000168');
console.log('   💡 THINKING MODEL! Hybrid inference modes');

console.log('\n10. $0.000000756 - amazon/nova-lite (Amazon)');
console.log('    Input: $0.00000006 | Output: $0.00000024');
console.log('    💡 Multimodal (text, image, video), very fast');

console.log('\n🧠 BEST FOR REASONING (Shows thinking process):');
console.log('─'.repeat(50));
console.log('🥇 deepseek/deepseek-v3 - $0.000000154 total');
console.log('🥈 deepseek/deepseek-v3.1-thinking - $0.000000724 total'); 
console.log('🥉 deepseek/deepseek-r1 - $0.000004790 total');

console.log('\n🚀 BEST FOR SPEED (Groq-powered):');
console.log('─'.repeat(50));
console.log('🥇 meta/llama-3.1-8b - $0.000000135 total');
console.log('🥈 meta/llama-3-8b - $0.000000130 total');
console.log('🥉 google/gemma-2-9b - $0.0000004 total');

console.log('\n🎨 BEST FOR CREATIVITY:');
console.log('─'.repeat(50));
console.log('🥇 meta/llama-4-scout - $0.0000002 total (newest, multimodal)');
console.log('🥈 alibaba/qwen-3-235b - $0.0000008 total (235B parameters!)');
console.log('🥉 meta/llama-3.3-70b - $0.00000144 total (latest Meta 70B)');

console.log('\n👁️ BEST MULTIMODAL (Image/Video):');
console.log('─'.repeat(50));
console.log('🥇 amazon/nova-lite - $0.000000756 total (image, video, text)');
console.log('🥈 meta/llama-4-scout - $0.0000002 total (text + image)');
console.log('🥉 google/gemini-2.0-flash-lite - $0.000000375 total');

console.log('\n💻 BEST FOR CODING:');
console.log('─'.repeat(50));
console.log('🥇 mistral/devstral-small - $0.000000350 total');
console.log('🥈 mistral/codestral - $0.0000012 total');
console.log('🥉 deepseek/deepseek-v3 - $0.000000154 total (general purpose)');

console.log('\n🎯 MY TOP RECOMMENDATIONS:');
console.log('═'.repeat(50));
console.log('🏆 BEST OVERALL: deepseek/deepseek-v3');
console.log('   💰 Only $0.000154 per 1M tokens total');
console.log('   🧠 Shows thinking process with <think> tags'); 
console.log('   ⚡ Fast and reliable');
console.log('   🎯 Great for reasoning, chat, coding');

console.log('\n🏆 CHEAPEST: amazon/nova-micro');
console.log('   💰 Only $0.000075 per 1M tokens total');
console.log('   📝 Text-only, lowest latency');
console.log('   💡 Perfect for simple tasks');

console.log('\n🏆 BEST VALUE: meta/llama-4-scout');
console.log('   💰 Only $0.0002 per 1M tokens total');
console.log('   🆕 Latest Llama 4 technology');
console.log('   👁️ Multimodal (text + images)');
console.log('   🚀 17B parameters with 16 experts');

console.log('\n💡 REMEMBER:');
console.log('✨ Vercel gives you $5 free credits every 30 days');
console.log('🔄 All models work through your existing proxy');
console.log('🎯 For thinking models, use hide_thinking=true to see only final answers');
console.log('🏃‍♂️ Models served by Groq are fastest');
console.log('💰 Prices shown are per 1 million tokens');

console.log('\n🧪 Test any model with your proxy:');
console.log('curl -X POST "https://openai-proxy.alexandrite.workers.dev/v1/chat/completions" \\');
console.log('  -H "Authorization: Bearer YOUR_VERCEL_KEY" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"model": "deepseek/deepseek-v3", "messages": [{"role": "user", "content": "Hello!"}]}\'');