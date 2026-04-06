const http = require('http');

// Test email status
function testEmailStatus() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/email-status',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📧 Email Service Status:');
      console.log('Status Code:', res.statusCode);
      console.log('Response:', JSON.parse(data));
      console.log('---');
      
      // Test sending OTP
      testSendOTP();
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error testing email status:', e);
  });

  req.end();
}

// Test sending OTP
function testSendOTP() {
  const postData = JSON.stringify({
    email: 'palakkalwani4@gmail.com',
    otp: '1234',
    subject: 'StyleEase - Test OTP'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/send-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📨 Send OTP Test:');
      console.log('Status Code:', res.statusCode);
      console.log('Response:', JSON.parse(data));
      console.log('---');
      console.log('✅ Email service test completed!');
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error testing send OTP:', e);
  });

  req.write(postData);
  req.end();
}

// Run tests
console.log('🧪 Testing Email Service...\n');
testEmailStatus();
