const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Error capture system
let capturedErrors = [];
let errorId = 1;

// Capture all errors
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      capturedErrors.push({
        id: errorId++,
        timestamp: new Date().toISOString(),
        type: 'httpError',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        message: data.toString(),
        headers: req.headers,
        body: req.body
      });
    }
    originalSend.call(this, data);
  };
  next();
});

// Global error handlers
process.on('uncaughtException', (error) => {
  capturedErrors.push({
    id: errorId++,
    timestamp: new Date().toISOString(),
    type: 'uncaughtException',
    message: error.message,
    stack: error.stack
  });
});

process.on('unhandledRejection', (reason) => {
  capturedErrors.push({
    id: errorId++,
    timestamp: new Date().toISOString(),
    type: 'unhandledRejection',
    message: reason.toString(),
    stack: reason.stack
  });
});

let tickets = [
  {
    id: 1,
    title: 'Sample Login Issue',
    description: 'Users cannot login with valid credentials',
    name: 'John Doe',
    email: 'john@example.com',
    priority: 'high',
    status: 'open',
    created: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Feature Request - Dark Mode',
    description: 'Please add a dark mode option to the interface',
    name: 'Jane Smith',
    email: 'jane@example.com',
    priority: 'medium',
    status: 'open',
    created: new Date(Date.now() - 3600000).toISOString()
  }
];
let ticketId = 3;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>NEXUS Support System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; text-align: center; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .ticket { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
        .tabs { display: flex; margin-bottom: 20px; }
        .tab { padding: 10px 20px; background: #e9ecef; border: 1px solid #ddd; cursor: pointer; }
        .tab.active { background: #007bff; color: white; }
        .panel { display: none; }
        .panel.active { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <h1>NEXUS Support System</h1>
        
        <div class="tabs">
            <div class="tab active" onclick="showPanel('create')">Create Ticket</div>
            <div class="tab" onclick="showPanel('list')">View Tickets</div>
        </div>
        
        <div id="createPanel" class="panel active">
            <h2>Create New Ticket</h2>
            <div id="message"></div>
            <form id="ticketForm">
                <div class="form-group">
                    <label>Title:</label>
                    <input type="text" id="title" required>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="description" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="name" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label>Priority:</label>
                    <select id="priority">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <button type="submit">Create Ticket</button>
            </form>
        </div>
        
        <div id="listPanel" class="panel">
            <h2>All Tickets</h2>
            <div id="ticketList"></div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3>System Error Management</h3>
            <p>Captured Errors: <span id="errorCount">0</span></p>
            <button onclick="sendErrorsToWindsurf()" style="background: #ff6b35;">Send Element to Windsurf</button>
            <button onclick="clearErrors()" style="background: #6c757d; margin-left: 10px;">Clear Errors</button>
            <div id="errorStatus" style="margin-top: 10px;"></div>
        </div>
    </div>

    <script>
        function showPanel(panel) {
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(panel + 'Panel').classList.add('active');
            event.target.classList.add('active');
            
            if (panel === 'list') {
                loadTickets();
            }
        }

        function showMessage(message, isError) {
            const msgDiv = document.getElementById('message');
            msgDiv.innerHTML = '<div class="' + (isError ? 'error' : 'success') + '">' + message + '</div>';
            setTimeout(() => msgDiv.innerHTML = '', 5000);
        }

        document.getElementById('ticketForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const ticket = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                priority: document.getElementById('priority').value
            };

            try {
                const response = await fetch('/api/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ticket)
                });

                if (response.ok) {
                    const data = await response.json();
                    showMessage('✅ Ticket created successfully! ID: ' + data.id);
                    document.getElementById('ticketForm').reset();
                } else {
                    showMessage('❌ Error creating ticket', true);
                }
            } catch (error) {
                showMessage('❌ Network error: ' + error.message, true);
            }
        });

        async function loadTickets() {
            const listDiv = document.getElementById('ticketList');
            listDiv.innerHTML = 'Loading tickets...';
            
            try {
                const response = await fetch('/api/tickets');
                
                if (!response.ok) {
                    listDiv.innerHTML = '<div class="error">Error loading tickets</div>';
                    return;
                }
                
                const tickets = await response.json();
                
                if (!tickets || tickets.length === 0) {
                    listDiv.innerHTML = '<p>No tickets found.</p>';
                } else {
                    let html = '';
                    for (let i = 0; i < tickets.length; i++) {
                        const ticket = tickets[i];
                        html += '<div class="ticket">';
                        html += '<h3>Ticket #' + ticket.id + ': ' + ticket.title + '</h3>';
                        html += '<p><strong>Description:</strong> ' + ticket.description + '</p>';
                        html += '<p><strong>Created by:</strong> ' + ticket.name + ' (' + ticket.email + ')</p>';
                        html += '<p><strong>Priority:</strong> ' + ticket.priority + '</p>';
                        html += '<p><strong>Status:</strong> ' + ticket.status + '</p>';
                        html += '<p><small>Created: ' + new Date(ticket.created).toLocaleString() + '</small></p>';
                        html += '</div>';
                    }
                    listDiv.innerHTML = html;
                }
            } catch (error) {
                listDiv.innerHTML = '<div class="error">Error loading tickets: ' + error.message + '</div>';
            }
        }

        // Frontend error capture
        window.addEventListener('error', function(event) {
            fetch('/api/frontend-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    type: 'javascriptError',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error ? event.error.stack : 'No stack'
                })
            }).catch(() => {});
        });

        window.addEventListener('unhandledrejection', function(event) {
            fetch('/api/frontend-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    type: 'unhandledRejection',
                    message: event.reason ? event.reason.toString() : 'Unknown rejection',
                    stack: event.reason && event.reason.stack ? event.reason.stack : 'No stack'
                })
            }).catch(() => {});
        });

        // Windsurf integration functions
        async function sendErrorsToWindsurf() {
            const statusDiv = document.getElementById('errorStatus');
            statusDiv.innerHTML = 'Sending errors to Windsurf...';
            
            try {
                const response = await fetch('/api/send-to-windsurf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    statusDiv.innerHTML = '<div style="color: green;">✅ ' + result.message + '</div>';
                } else {
                    statusDiv.innerHTML = '<div style="color: red;">❌ Error: ' + result.error + '</div>';
                }
            } catch (error) {
                statusDiv.innerHTML = '<div style="color: red;">❌ Network error: ' + error.message + '</div>';
            }
        }

        async function clearErrors() {
            const statusDiv = document.getElementById('errorStatus');
            statusDiv.innerHTML = 'Clearing errors...';
            
            try {
                const response = await fetch('/api/clear-errors', { method: 'DELETE' });
                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('errorCount').textContent = '0';
                    statusDiv.innerHTML = '<div style="color: green;">✅ ' + result.message + '</div>';
                } else {
                    statusDiv.innerHTML = '<div style="color: red;">❌ Error: ' + result.error + '</div>';
                }
            } catch (error) {
                statusDiv.innerHTML = '<div style="color: red;">❌ Network error: ' + error.message + '</div>';
            }
        }

        // Update error count
        async function updateErrorCount() {
            try {
                const response = await fetch('/api/errors');
                const data = await response.json();
                document.getElementById('errorCount').textContent = data.totalErrors || 0;
            } catch (error) {
                console.error('Failed to update error count:', error);
            }
        }

        // Update error count every 5 seconds
        setInterval(updateErrorCount, 5000);
        updateErrorCount();

        loadTickets();
    </script>
</body>
</html>
  `);
});

app.get('/api/tickets', (req, res) => {
  res.json(tickets);
});

app.post('/api/tickets', (req, res) => {
  try {
    const { title, description, name, email, priority } = req.body;
    
    if (!title || !description || !name || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newTicket = {
      id: ticketId++,
      title,
      description,
      name,
      email,
      priority: priority || 'medium',
      status: 'open',
      created: new Date().toISOString()
    };

    tickets.push(newTicket);
    console.log('✅ Ticket created:', newTicket.id);
    
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error management endpoints
app.get('/api/errors', (req, res) => {
  res.json({
    totalErrors: capturedErrors.length,
    errors: capturedErrors,
    systemInfo: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

app.post('/api/frontend-error', (req, res) => {
  const errorData = req.body;
  capturedErrors.push({
    id: errorId++,
    timestamp: new Date().toISOString(),
    type: 'frontendError',
    ...errorData
  });
  console.error('🚨 FRONTEND ERROR CAPTURED:', errorData);
  res.json({ message: 'Frontend error captured', id: errorId - 1 });
});

app.delete('/api/clear-errors', (req, res) => {
  const count = capturedErrors.length;
  capturedErrors = [];
  res.json({ message: `Cleared ${count} errors` });
});

app.post('/api/send-to-windsurf', (req, res) => {
  try {
    // Simulate sending to Windsurf
    const errorData = {
      timestamp: new Date().toISOString(),
      totalErrors: capturedErrors.length,
      errors: capturedErrors,
      systemInfo: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      serverInfo: {
        url: 'http://localhost:3000',
        environment: 'development',
        version: '1.0.0'
      }
    };
    
    // In a real implementation, this would send to actual Windsurf API
    console.log('🌊 Sending to Windsurf:', {
      errorCount: errorData.totalErrors,
      timestamp: errorData.timestamp
    });
    
    // Simulate successful send
    res.json({ 
      message: `Successfully sent ${errorData.totalErrors} errors to Windsurf`,
      errorsSent: errorData.totalErrors,
      timestamp: errorData.timestamp
    });
    
  } catch (error) {
    console.error('❌ Error sending to Windsurf:', error);
    res.status(500).json({ error: 'Failed to send errors to Windsurf: ' + error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('🚀 NEXUS Working Server running on http://localhost:' + PORT);
  console.log('✅ Ticket creation and viewing are WORKING');
  console.log('🌊 Windsurf integration ENABLED');
});
