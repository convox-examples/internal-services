const express = require('express');
const { exec } = require('child_process');
const util = require('util');

const app = express();
const port = process.env.PORT || 3000;
const serviceName = process.env.SERVICE || 'api';
const rack = process.env.RACK || 'unknown-rack';
const appName = process.env.APP || 'unknown-app';
const execAsync = util.promisify(exec);

app.use(express.json());

// Function to build internal service URL
function getInternalServiceUrl(serviceName) {
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

// Main API endpoint
app.get('/', (req, res) => {
  res.json({
    message: `Hello from ${serviceName} service!`,
    service: serviceName,
    type: 'internal',
    rack: rack,
    app: appName,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET / - This page',
      'GET /health - Health check',
      'GET /data - Get mock data',
      'POST /data - Create mock data',
      'GET /test-database - Test database connectivity',
      'GET /network-info - Network debugging info'
    ]
  });
});

// Mock data endpoint
let mockData = [
  { id: 1, name: 'Sample Item 1', created: new Date().toISOString() },
  { id: 2, name: 'Sample Item 2', created: new Date().toISOString() }
];

app.get('/data', (req, res) => {
  res.json({
    service: serviceName,
    data: mockData,
    count: mockData.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/data', (req, res) => {
  const newItem = {
    id: mockData.length + 1,
    name: req.body.name || `New Item ${mockData.length + 1}`,
    created: new Date().toISOString()
  };
  
  mockData.push(newItem);
  
  res.status(201).json({
    service: serviceName,
    message: 'Item created',
    item: newItem,
    timestamp: new Date().toISOString()
  });
});

// Test database connectivity
app.get('/test-database', async (req, res) => {
  const dbUrl = getInternalServiceUrl('database');
  
  try {
    const response = await fetch(`${dbUrl}/status`);
    const data = await response.json();
    
    res.json({
      service: serviceName,
      database_test: 'success',
      database_url: dbUrl,
      database_response: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      service: serviceName,
      database_test: 'failed',
      database_url: dbUrl,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Network debugging info
app.get('/network-info', async (req, res) => {
  const info = {
    service: serviceName,
    hostname: require('os').hostname(),
    platform: require('os').platform(),
    architecture: require('os').arch(),
    uptime: require('os').uptime(),
    rack: rack,
    app: appName,
    timestamp: new Date().toISOString()
  };

  try {
    // Get network interfaces
    const { stdout: ifconfig } = await execAsync('ifconfig || ip addr show');
    info.network_interfaces = ifconfig.split('\n');
  } catch (error) {
    info.network_error = error.message;
  }

  try {
    // Test DNS resolution
    const dbHostname = `database.${rack}-${appName}.svc.cluster.local`;
    const { stdout: nslookup } = await execAsync(`nslookup ${dbHostname}`);
    info.dns_test = nslookup.split('\n');
  } catch (error) {
    info.dns_error = error.message;
  }

  res.json(info);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`${serviceName} service listening on port ${port}`);
  console.log(`Service type: internal (rack-only access)`);
  console.log(`Environment:`, {
    RACK: rack,
    APP: appName,
    SERVICE: serviceName
  });
});