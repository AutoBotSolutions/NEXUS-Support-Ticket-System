/**
 * NEXUS Workflow Automation API Routes
 * RESTful API endpoints for workflow automation management
 */

const express = require('express');
const router = express.Router();
const {
  createWorkflow,
  executeWorkflow,
  getWorkflow,
  getAllWorkflows,
  getWorkflowsByCategory,
  updateWorkflow,
  deleteWorkflow,
  getExecution,
  getWorkflowExecutions,
  getWorkflowMetrics,
  toggleWorkflow,
  triggerEvent
} = require('../middleware/workflowAutomation');

// Middleware for authentication and authorization
const auth = require('../middleware/auth');

/**
 * GET /api/workflows
 * Get all workflows
 */
router.get('/', auth, async (req, res) => {
  try {
    const { category, enabled } = req.query;
    let workflows;

    if (category) {
      workflows = getWorkflowsByCategory(category);
    } else {
      workflows = getAllWorkflows();
    }

    // Filter by enabled status if specified
    if (enabled !== undefined) {
      const isEnabled = enabled === 'true';
      workflows = workflows.filter(workflow => workflow.enabled === isEnabled);
    }

    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflows',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/:id
 * Get a specific workflow by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = getWorkflow(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        message: `Workflow with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow',
      message: error.message
    });
  }
});

/**
 * POST /api/workflows
 * Create a new workflow
 */
router.post('/', auth,  async (req, res) => {
  try {
    const workflowData = req.body;
    const { id } = workflowData;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Workflow ID is required',
        message: 'Workflow ID must be provided'
      });
    }

    // Check if workflow already exists
    const existingWorkflow = getWorkflow(id);
    if (existingWorkflow) {
      return res.status(409).json({
        success: false,
        error: 'Workflow already exists',
        message: `Workflow with ID ${id} already exists`
      });
    }

    const workflow = createWorkflow(id, workflowData);

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow',
      message: error.message
    });
  }
});

/**
 * PUT /api/workflows/:id
 * Update a workflow
 */
router.put('/:id', auth,  async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const workflow = updateWorkflow(id, updates);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        message: `Workflow with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: workflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow',
      message: error.message
    });
  }
});

/**
 * DELETE /api/workflows/:id
 * Delete a workflow
 */
router.delete('/:id', auth,  async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteWorkflow(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        message: `Workflow with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow',
      message: error.message
    });
  }
});

/**
 * POST /api/workflows/:id/execute
 * Execute a workflow manually
 */
router.post('/:id/execute', auth,  async (req, res) => {
  try {
    const { id } = req.params;
    const context = req.body.context || {};

    const execution = await executeWorkflow(id, context);

    res.json({
      success: true,
      data: execution,
      message: 'Workflow executed successfully'
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow',
      message: error.message
    });
  }
});

/**
 * POST /api/workflows/:id/toggle
 * Enable or disable a workflow
 */
router.post('/:id/toggle', auth,  async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Enabled status is required',
        message: 'Enabled status must be provided'
      });
    }

    const workflow = toggleWorkflow(id, enabled);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        message: `Workflow with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: workflow,
      message: `Workflow ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle workflow',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/:id/executions
 * Get workflow execution history
 */
router.get('/:id/executions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const executions = getWorkflowExecutions(id, parseInt(limit));

    res.json({
      success: true,
      data: executions,
      count: executions.length
    });
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow executions',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/executions/:executionId
 * Get a specific workflow execution
 */
router.get('/executions/:executionId', auth, async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = getExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
        message: `Execution with ID ${executionId} not found`
      });
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error('Error fetching workflow execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow execution',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/metrics
 * Get workflow system metrics
 */
router.get('/metrics', auth,  async (req, res) => {
  try {
    const metrics = getWorkflowMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching workflow metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow metrics',
      message: error.message
    });
  }
});

/**
 * POST /api/workflows/trigger
 * Trigger a system event
 */
router.post('/trigger', auth,  async (req, res) => {
  try {
    const { eventName, data } = req.body;

    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'Event name is required',
        message: 'Event name must be provided'
      });
    }

    triggerEvent(eventName, data);

    res.json({
      success: true,
      message: `Event ${eventName} triggered successfully`
    });
  } catch (error) {
    console.error('Error triggering event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger event',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/categories
 * Get workflow categories
 */
router.get('/categories', auth, async (req, res) => {
  try {
    const workflows = getAllWorkflows();
    const categories = [...new Set(workflows.map(workflow => workflow.category))];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching workflow categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow categories',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/templates
 * Get workflow templates
 */
router.get('/templates', auth, async (req, res) => {
  try {
    // Return available workflow templates
    const templates = [
      {
        id: 'ticket-management',
        name: 'Ticket Management Template',
        description: 'Template for ticket-related workflows',
        triggers: ['event'],
        actions: ['assignment', 'notification', 'escalation', 'field-update'],
        conditions: ['field', 'sla']
      },
      {
        id: 'user-management',
        name: 'User Management Template',
        description: 'Template for user-related workflows',
        triggers: ['event', 'schedule'],
        actions: ['notification', 'field-update'],
        conditions: ['field', 'user']
      },
      {
        id: 'system-monitoring',
        name: 'System Monitoring Template',
        description: 'Template for system monitoring workflows',
        triggers: ['schedule'],
        actions: ['notification', 'webhook'],
        conditions: ['system']
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching workflow templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow templates',
      message: error.message
    });
  }
});

/**
 * POST /api/workflows/validate
 * Validate workflow configuration
 */
router.post('/validate', auth,  async (req, res) => {
  try {
    const workflowConfig = req.body;
    const errors = [];

    // Validate required fields
    if (!workflowConfig.id) {
      errors.push('Workflow ID is required');
    }

    if (!workflowConfig.name) {
      errors.push('Workflow name is required');
    }

    if (!workflowConfig.trigger) {
      errors.push('Workflow trigger is required');
    }

    if (!workflowConfig.actions || workflowConfig.actions.length === 0) {
      errors.push('At least one action is required');
    }

    // Validate trigger
    if (workflowConfig.trigger) {
      const validTriggerTypes = ['event', 'schedule', 'webhook', 'manual'];
      if (!validTriggerTypes.includes(workflowConfig.trigger.type)) {
        errors.push('Invalid trigger type');
      }

      if (workflowConfig.trigger.type === 'schedule' && !workflowConfig.trigger.schedule) {
        errors.push('Schedule is required for schedule trigger');
      }

      if (workflowConfig.trigger.type === 'event' && !workflowConfig.trigger.event) {
        errors.push('Event name is required for event trigger');
      }
    }

    // Validate actions
    if (workflowConfig.actions) {
      const validActionTypes = ['assignment', 'notification', 'escalation', 'delay', 'field-update', 'webhook'];
      
      for (const action of workflowConfig.actions) {
        if (!validActionTypes.includes(action.type)) {
          errors.push(`Invalid action type: ${action.type}`);
        }

        if (action.type === 'notification' && !action.template) {
          errors.push('Template is required for notification action');
        }

        if (action.type === 'delay' && !action.delay) {
          errors.push('Delay is required for delay action');
        }
      }
    }

    // Validate conditions
    if (workflowConfig.conditions) {
      const validConditionTypes = ['field', 'sla', 'system', 'user'];
      
      for (const condition of workflowConfig.conditions) {
        if (!validConditionTypes.includes(condition.type)) {
          errors.push(`Invalid condition type: ${condition.type}`);
        }

        if (!condition.field || !condition.operator || !condition.value) {
          errors.push('Field, operator, and value are required for conditions');
        }
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        valid: errors.length === 0,
        errors
      }
    });
  } catch (error) {
    console.error('Error validating workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate workflow',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/health
 * Check workflow system health
 */
router.get('/health', auth, async (req, res) => {
  try {
    const metrics = getWorkflowMetrics();
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      workflows: {
        total: metrics.totalWorkflows,
        active: metrics.activeWorkflows,
        recentExecutions: metrics.recentExecutions
      },
      lastCheck: new Date()
    };

    // Determine health status
    if (metrics.failedExecutions > metrics.successfulExecutions * 0.1) {
      health.status = 'degraded';
    }

    if (metrics.failedExecutions > metrics.successfulExecutions * 0.5) {
      health.status = 'unhealthy';
    }

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking workflow health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check workflow health',
      message: error.message
    });
  }
});

module.exports = router;
