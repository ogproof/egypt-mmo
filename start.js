#!/usr/bin/env node

// Simple start script for Railway
console.log('🚂 Starting Egypt MMO Server...');

// Use the package.json start script (which includes build)
const { spawn } = require('child_process');
const startProcess = spawn('npm', ['start'], { stdio: 'inherit' });

startProcess.on('close', (code) => {
    console.log(`✅ Server process exited with code ${code}`);
});
