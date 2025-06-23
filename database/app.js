const express = require('express');
const { exec } = require('child_process');
const util = require('util');

const app = express();
const port = process.env.PORT || 3000;
const serviceName = process.env.SERVICE_NAME || 'database';
const execAsync = util.promisify(exec);

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: serviceName,
    timestamp: new Date().toISOString()
  });
});

// Main database service endpoint
app.get('/', (req, res) => {
  res.json({
    message: `Hello from ${serviceName} service!`,
    service: serviceName,
    type: 'internal',
    rack: process.env.RACK,
    app: process.env.APP,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET / - This page',
      'GET /health - Health check',
      'GET /status - Database status',
      'GET /users - Get mock users',
      'POST /users - Create mock user',
      'GET /stats - Database statistics',
      'GET /network-debug - Network debugging'
    ]
  });
});

// Mock database status
app.get('/status', (req, res) => {
  res.json({
    service: serviceName,
    database: {
      status: 'online',
      type: 'mock-database',
      version: '1.0.0',
      uptime: process.uptime(),
      connections: Math.floor(Math.random() * 20) + 5,
      last_backup: new Date(Date.now() - Math.random() * 86400000).toISOString()
    },
    rack: process.env.RACK,
    app: process.env.APP,
    timestamp: new Date().toISOString()
  });
});

// Mock users data
let users = [
  { id: 1, username: 'john_doe', email: 'john@example.com', created: new Date().toISOString() },
  { id: 2, username: 'jane_smith', email: 'jane@example.com', created: new Date().toISOString() },
  { id: 3, username: 'bob_wilson', email: 'bob@example.com', created: new Date().toISOString() }
];

app.get('/users', (req, res) => {
  res.json({
    service: serviceName,
    users: users,
    total_users: users.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/users', (req, res) => {
  const newUser = {
    id: users.length + 1,
    username: req.body.username || `user_${users.length + 1}`,
    email: req.body.email || `user${users.length + 1}@example.com`,
    created: new Date().toISOString()
  };
  
  users.push(newUser);
  
  res.status(201).json({
    service: serviceName,
    message: 'User created successfully',
    user: newUser,
    timestamp: new Date().toISOString()
  });
});

// Database statistics
app.get('/stats', (req, res) => {
  res.json({
    service: serviceName,
    statistics: {
      total_users: users.length,
      database_size_mb: Math.floor(Math.random() * 1000) + 100,
      queries_per_second: Math.floor(Math.random() * 500) + 50,
      cache_hit_ratio: (Math.random() * 0.3 + 0.7).toFixed(2),
      active_connections: Math.floor(Math.random() * 20) + 5,
      slow_queries: Math.floor(Math.random() * 10),
      last_updated: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Network debugging endpoint
app.get('/network-debug', async (req, res) => {
  const debug = {
    service: serviceName,
    hostname: require('os').hostname(),
    memory_usage: process.memoryUsage(),
    rack: process.env.RACK,
    app: process.env.APP,
    timestamp: new Date().toISOString()
  };

  try {
    // Test connectivity to API service
    const apiHostname = `api.${process.env.RACK}-${process.env.APP}.svc.cluster.local`;
    const { stdout: ping } = await execAsync(`ping -c 3 ${apiHostname}`);
    debug.api_connectivity = ping.split('\n');
  } catch (error) {
    debug.api_connectivity_error = error.message;
  }

  try {
    // Check listening ports
    const { stdout: netstat } = await execAsync('netstat -tuln || ss -tuln');
    debug.listening_ports = netstat.split('\n');
  } catch (error) {
    debug.ports_error = error.message;
  }

  try {
    // Environment info
    debug.environment = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT,
      SERVICE_NAME: process.env.SERVICE_NAME,
      RACK: process.env.RACK,
      APP: process.env.APP
    };
  } catch (error) {
    debug.env_error = error.message;
  }

  res.json(debug);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`${serviceName} service listening on port ${port}`);
  console.log(`Service type: internal (rack-only access)`);
  console.log(`Environment:`, {
    RACK: process.env.RACK,
    APP: process.env.APP,
    SERVICE: process.env.SERVICE
  });
});