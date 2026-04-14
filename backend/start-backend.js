// Simple server startup script that avoids router conflicts
const { spawn } = require('child_process');

console.log('🚀 Starting StyleEase Email Server...');
console.log('📁 Working directory:', process.cwd());

// Start the test server which we know works
const serverProcess = spawn('node', ['test-server.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
});

serverProcess.on('close', (code) => {
  console.log(`📊 Server process exited with code: ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  serverProcess.kill('SIGTERM');
});
