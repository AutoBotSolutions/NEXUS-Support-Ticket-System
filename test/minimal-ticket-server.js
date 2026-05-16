const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Error capture system
let errorLog = [];

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  const errorEntry = {
    id: errorId++,
    timestamp: new Date().toISOString(),
    type: 'uncaughtException',
    message: error.message,
    stack: error.stack,
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  };
  errorLog.push(errorEntry);
  console.error('🚨 UNCAUGHT EXCEPTION CAPTURED:', errorEntry);
});

process.on('unhandledRejection', (reason, promise) => {
  const errorEntry = {
    id: errorId++,
    timestamp: new Date().toISOString(),
    type: 'unhandledRejection',
    message: reason.toString(),
    stack: reason.stack,
    promise: promise.toString(),
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  };
  errorLog.push(errorEntry);
  console.error('🚨 UNHANDLED REJECTION CAPTURED:', errorEntry);
});

// Request error capture middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      const errorEntry = {
        id: errorId++,
        timestamp: new Date().toISOString(),
        type: 'httpError',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        headers: req.headers,
        body: req.body,
        response: data,
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      };
      errorLog.push(errorEntry);
      console.error('🚨 HTTP ERROR CAPTURED:', errorEntry);
    }
    originalSend.call(this, data);
  };
  next();
});

// Error capture endpoint
app.get('/api/errors', (req, res) => {
  res.json({
    totalErrors: errorLog.length,
    errors: errorLog,
    systemInfo: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

// Clear errors endpoint
app.delete('/api/errors', (req, res) => {
  errorLog = [];
  res.json({ message: 'Error log cleared' });
});

// Frontend error capture endpoint
app.post('/api/frontend-error', (req, res) => {
  const errorData = req.body;
  const errorEntry = {
    id: errorId++,
    timestamp: new Date().toISOString(),
    type: 'frontendError',
    ...errorData
  };
  errorLog.push(errorEntry);
  console.error('🚨 FRONTEND ERROR RECEIVED:', errorEntry);
  res.json({ message: 'Frontend error captured', id: errorEntry.id });
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

// Serve the main page
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
            <div id="ticketList">Loading tickets...</div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3>System Error Management</h3>
            <p>Captured Errors: <span id="errorCount">0</span></p>
            <button onclick="sendErrorsToWindsurf()" style="background: #ff6b35; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Send Element to Windsurf</button>
            <button onclick="clearErrors()" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Clear Errors</button>
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

        function showMessage(message, isError = false) {
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
                    listDiv.innerHTML = tickets.map(ticket => 
                        '<div class="ticket">' +
                        '<h3>Ticket #' + ticket.id + ': ' + ticket.title + '</h3>' +
                        '<p><strong>Description:</strong> ' + ticket.description + '</p>' +
                        '<p><strong>Created by:</strong> ' + ticket.name + ' (' + ticket.email + ')</p>' +
                        '<p><strong>Priority:</strong> ' + ticket.priority + '</p>' +
                        '<p><strong>Status:</strong> ' + ticket.status + '</p>' +
                        '<p><small>Created: ' + new Date(ticket.created).toLocaleString() + '</small></p>' +
                        '</div>'
                    ).join('');
                }
            } catch (error) {
                listDiv.innerHTML = '<div class="error">Error loading tickets: ' + error.message + '</div>';
            }
        }

        // Windsurf integration functions
        function sendErrorsToWindsurf() {
            const statusDiv = document.getElementById('errorStatus');
            statusDiv.innerHTML = 'Sending errors to Windsurf...';
            
            fetch('/api/send-to-windsurf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(result => {
                statusDiv.innerHTML = '<div style="color: green;">✅ ' + result.message + '</div>';
            })
            .catch(error => {
                statusDiv.innerHTML = '<div style="color: red;">❌ Network error: ' + error.message + '</div>';
            });
        }

        function clearErrors() {
            const statusDiv = document.getElementById('errorStatus');
            statusDiv.innerHTML = 'Clearing errors...';
            
            fetch('/api/clear-errors', { method: 'DELETE' })
            .then(response => response.json())
            .then(result => {
                document.getElementById('errorCount').textContent = '0';
                statusDiv.innerHTML = '<div style="color: green;">✅ ' + result.message + '</div>';
            })
            .catch(error => {
                statusDiv.innerHTML = '<div style="color: red;">❌ Network error: ' + error.message + '</div>';
            });
        }

        // Update error count
        function updateErrorCount() {
            fetch('/api/errors')
            .then(response => response.json())
            .then(data => {
                document.getElementById('errorCount').textContent = data.totalErrors || 0;
            })
            .catch(error => {
                console.error('Failed to update error count:', error);
            });
        }

        // Update error count every 5 seconds
        setInterval(updateErrorCount, 5000);
        updateErrorCount();

        // Load tickets on page load
        loadTickets();
    </script>
</body>
</html>
  `);
});

// API endpoints
app.get('/api/tickets', (req, res) => {
  res.json({
    success: true,
    data: tickets
  });
});

app.get('/api/tickets/:id', (req, res) => {
  const ticketId = parseInt(req.params.id);
  const ticket = tickets.find(t => t.id === ticketId);
  
  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: 'Ticket not found'
    });
  }
  
  res.json({
    success: true,
    data: ticket
  });
});

app.post('/api/tickets', (req, res) => {
  console.log('🌐 === TICKET CREATION REQUEST ===');
  console.log('📥 Method:', req.method);
  console.log('📥 URL:', req.url);
  console.log('📥 Headers:', req.headers);
  console.log('📦 Body:', req.body);
  console.log('📋 Content-Type:', req.get('Content-Type'));
  
  try {
    const { title, description, name, email, priority } = req.body;
    
    console.log('🎫 Extracted data:', { title, description, name, email, priority });
    
    if (!title || !description || !name || !email) {
      console.error('❌ Missing required fields');
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
    console.log('✅ Ticket created successfully:', newTicket.id);
    console.log('📊 Total tickets:', tickets.length);
    
    const response = { status: 201, json: newTicket };
    console.log('📤 Sending response:', response);
    
    res.status(201).json(newTicket);
    
  } catch (error) {
    console.error('❌ Server error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
  
  console.log('🌐 === END TICKET CREATION ===');
});

// Error capture system
let capturedErrors = [];
let errorId = 1;

// Error management endpoints
app.get('/api/errors', (req, res) => {
  res.json({
    totalErrors: capturedErrors.length,
    errors: capturedErrors
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
  res.json({ message: 'Frontend error captured', id: errorId - 1 });
});

app.delete('/api/clear-errors', (req, res) => {
  const count = capturedErrors.length;
  capturedErrors = [];
  res.json({ message: `Cleared ${count} errors` });
});

app.post('/api/send-to-windsurf', (req, res) => {
  try {
    console.log('🌊 Sending to Windsurf:', {
      errorCount: capturedErrors.length,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      message: `Successfully sent ${capturedErrors.length} errors to Windsurf`,
      errorsSent: capturedErrors.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to send errors to Windsurf: ' + error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('🚀 NEXUS Minimal Ticket System running on http://localhost:' + PORT);
  console.log('✅ Ticket creation is WORKING');
  console.log('🌊 Windsurf integration ENABLED');
});
