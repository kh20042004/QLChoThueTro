/**
 * ===================================
 * TEST AI CHATBOT
 * Script để test các endpoint AI chatbot
 * ===================================
 */

const API_BASE = 'http://localhost:3000/api/ai';

// Test 1: Chat endpoint
async function testChat() {
  console.log('\n=== TEST 1: Chat Endpoint ===');
  
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Xin chào! Tôi đang tìm phòng trọ giá rẻ ở quận 1',
        history: []
      })
    });

    const data = await response.json();
    console.log('✓ Status:', response.status);
    console.log('✓ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

// Test 2: Recommendation endpoint
async function testRecommendation() {
  console.log('\n=== TEST 2: Recommendation Endpoint ===');
  
  try {
    const response = await fetch(`${API_BASE}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        budget: 3000000,
        location: 'Quận 1, TP.HCM',
        preferences: 'Gần trường đại học, có wifi, máy lạnh'
      })
    });

    const data = await response.json();
    console.log('✓ Status:', response.status);
    console.log('✓ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

// Test 3: FAQ endpoint
async function testFAQ() {
  console.log('\n=== TEST 3: FAQ Endpoint ===');
  
  try {
    const response = await fetch(`${API_BASE}/faq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: 'Làm thế nào để đăng tin cho thuê phòng?'
      })
    });

    const data = await response.json();
    console.log('✓ Status:', response.status);
    console.log('✓ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('========================================');
  console.log('🤖 AI CHATBOT API TESTING');
  console.log('========================================');
  
  await testChat();
  await testRecommendation();
  await testFAQ();
  
  console.log('\n========================================');
  console.log('✓ All tests completed!');
  console.log('========================================\n');
}

runAllTests();
