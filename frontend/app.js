const express = require('express');
const { exec } = require('child_process');
const util = require('util');

const app = express();
const port = process.env.PORT || 3000;
const serviceName = process.env.SERVICE_NAME || 'frontend';
const execAsync = util.promisify(exec);

app.use(express.json());

// Function to build internal service URL
function getInternalServiceUrl(serviceName) {
  // Get rack and app from environment variables that Convox sets
  const rack = process.env.RACK || 'unknown-rack';
  const appName = process.env.APP || 'unknown-app';
  return `http://${serviceName}.${rack}-${appName}.svc.cluster.local:3000`;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: serviceName,
    timestamp: new Date().toISOString()
  });
});

// Main page
app.get('/', (req, res) => {
  res.json({
    message: `Hello from ${serviceName} service!`,
    service: serviceName,
    type: 'external',
    rack: process.env.RACK,
    app: process.env.APP,
    namespace: `${process.env.RACK}-${process.env.APP}`,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET / - This page',
      'GET /health - Health check',
      'GET /test-internal - Test internal service calls',
      'GET /nslookup/:hostname - DNS lookup',
      'GET /curl/:service - HTTP test to internal services',
      'GET /debug-env - Show all environment variables'
    ]
  });
});

// Test internal service connectivity
app.get('/test-internal', async (req, res) => {
  const apiUrl = getInternalServiceUrl('api');
  const dbUrl = getInternalServiceUrl('database');
  
  const results = {
    service: serviceName,
    rack: process.env.RACK,
    app: process.env.APP,
    namespace: `${process.env.RACK}-${process.env.APP}`,
    timestamp: new Date().toISOString(),
    urls_tested: {
      api: apiUrl,
      database: dbUrl
    },
    tests: {}
  };

  try {
    // Test API service
    const apiResponse = await fetch(apiUrl);
    results.tests.api = {
      status: 'success',
      response: await apiResponse.json()
    };
  } catch (error) {
    results.tests.api = {
      status: 'error',
      error: error.message
    };
  }

  try {
    // Test Database service
    const dbResponse = await fetch(dbUrl);
    results.tests.database = {
      status: 'success',
      response: await dbResponse.json()
    };
  } catch (error) {
    results.tests.database = {
      status: 'error',
      error: error.message
    };
  }

  res.json(results);
});

// DNS lookup utility
app.get('/nslookup/:hostname', async (req, res) => {
  const hostname = req.params.hostname;
  
  try {
    const { stdout, stderr } = await execAsync(`nslookup ${hostname}`);
    res.json({
      hostname,
      stdout: stdout.split('\n'),
      stderr: stderr || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      hostname,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Curl utility for testing HTTP connections
app.get('/curl/:service', async (req, res) => {
  const service = req.params.service;
  const url = getInternalServiceUrl(service);
  
  try {
    const { stdout, stderr } = await execAsync(`curl -s -w "\\nStatus: %{http_code}\\nTime: %{time_total}s" ${url}`);
    res.json({
      service,
      url,
      response: stdout.split('\n'),
      stderr: stderr || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      service,
      url,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug environment variables
app.get('/debug-env', (req, res) => {
  res.json({
    service: serviceName,
    convox_vars: {
      RACK: process.env.RACK,
      APP: process.env.APP,
      SERVICE: process.env.SERVICE,
      RELEASE: process.env.RELEASE,
      BUILD: process.env.BUILD
    },
    all_env: process.env,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`${serviceName} service listening on port ${port}`);
  console.log(`Service type: external (publicly accessible)`);
  console.log(`Environment:`, {
    RACK: process.env.RACK,
    APP: process.env.APP,
    SERVICE: process.env.SERVICE
  });
});