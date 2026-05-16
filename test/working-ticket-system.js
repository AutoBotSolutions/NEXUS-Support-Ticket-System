const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory ticket storage
let tickets = [
  {
    id: 1,
    title: 'Login Issue',
    description: 'Cannot login to system',
    status: 'open',
    priority: 'high',
    created: new Date().toISOString()
  }
];
let nextId = 2;

// Serve the main page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>NEXUS Support System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .ticket { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
        .ticket h3 { margin: 0 0 10px 0; color: #333; }
        .ticket p { margin: 5px 0; }
        .status { padding: 3px 8px; border-radius: 3px; font-size: 12px; }
        .status.open { background: #d4edda; color: #155724; }
        .status.closed { background: #f8d7da; color: #721c24; }
        .priority { padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-left: 10px; }
        .priority.high { background: #f8d7da; color: #721c24; }
        .priority.medium { background: #fff3cd; color: #856404; }
        .priority.low { background: #d1ecf1; color: #0c5460; }
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
            <div id="createMessage"></div>
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
            const msgDiv = document.getElementById('createMessage');
            msgDiv.innerHTML = '<div class="' + (isError ? 'error' : 'success') + '">' + message + '</div>';
            setTimeout(() => msgDiv.innerHTML = '', 5000);
        }

        document.getElementById('ticketForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const ticket = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
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
                    showMessage('Ticket created successfully! ID: ' + data.id);
                    document.getElementById('ticketForm').reset();
                } else {
                    showMessage('Error creating ticket', true);
                }
            } catch (error) {
                showMessage('Network error: ' + error.message, true);
            }
        });

        async function loadTickets() {
            try {
                const response = await fetch('/api/tickets');
                const tickets = await response.json();
                
                const listDiv = document.getElementById('ticketList');
                listDiv.innerHTML = tickets.map(ticket => \`
                    <div class="ticket">
                        <h3>\${ticket.title}</h3>
                        <p><strong>Description:</strong> \${ticket.description}</p>
                        <p>
                            <span class="status \${ticket.status}">\${ticket.status.toUpperCase()}</span>
                            <span class="priority \${ticket.priority}">\${ticket.priority.toUpperCase()} PRIORITY</span>
                        </p>
                        <p><small>Created: \${new Date(ticket.created).toLocaleString()}</small></p>
                    </div>
                \`).join('');
            } catch (error) {
                document.getElementById('ticketList').innerHTML = '<div class="error">Error loading tickets</div>';
            }
        }

        // Load tickets on page load
        loadTickets();
    </script>
</body>
</html>
  `);
});

// API endpoints
app.get('/api/tickets', (req, res) => {
  res.json(tickets);
});

app.post('/api/tickets', (req, res) => {
  const { title, description, priority } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const newTicket = {
    id: nextId++,
    title,
    description,
    priority: priority || 'medium',
    status: 'open',
    created: new Date().toISOString()
  };

  tickets.push(newTicket);
  console.log('✅ Ticket created:', newTicket);
  
  res.status(201).json(newTicket);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('🚀 NEXUS Working Ticket System running on http://localhost:' + PORT);
  console.log('✅ Ticket creation is ENABLED and WORKING');
});
