import http from 'http';

const testTransaction = {
  studentId: "STU001", // Match the seeded student ID
  productType: "weekly", // daily, weekly, monthly
  amount: 25.00,
  transactionId: "QB-TEST-" + Date.now()
};

const data = JSON.stringify(testTransaction);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/webhooks/quickbooks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log(`🚀 Sending test transaction to http://localhost:5000/api/webhooks/quickbooks...`);

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Success! Transaction processed.');
      console.log('Response:', body);
      console.log('\nNow check the "Students" page or "Dashboard" to see the updated balance.');
    } else {
      console.error(`❌ Failed with status ${res.statusCode}:`, body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error sending webhook:', error.message);
});

req.write(data);
req.end();
