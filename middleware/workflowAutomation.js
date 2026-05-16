/**
 * NEXUS Workflow Automation System
 * Provides comprehensive workflow automation capabilities for the support ticket system
 */

const { EventEmitter } = require('events');
const cron = require('node-cron');
const { sendNotification } = require('./notificationSystem');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

class WorkflowAutomationSystem extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.executions = new Map();
    this.schedules = new Map();
    this.triggers = new Map();
    this.actions = new Map();
    this.conditions = new Map();
    this.templates = new Map();
    this.metrics = {
      totalWorkflows: 0,
      activeWorkflows: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };
    
    this.initializeDefaultWorkflows();
    this.initializeTriggers();
    this.initializeActions();
    this.initializeConditions();
    this.initializeTemplates();
  }

  /**
   * Initialize default workflow templates
   */
  initializeDefaultWorkflows() {
    // Ticket Assignment Workflow
    this.createWorkflow('ticket-assignment', {
      name: 'Automatic Ticket Assignment',
      description: 'Automatically assign tickets to appropriate agents based on rules',
      category: 'ticket-management',
      enabled: true,
      trigger: {
        type: 'event',
        event: 'ticket.created'
      },
      conditions: [
        {
          type: 'field',
          field: 'priority',
          operator: 'equals',
          value: 'high'
        }
      ],
      actions: [
        {
          type: 'assignment',
          assignTo: 'least-busy-agent',
          priority: 'high'
        },
        {
          type: 'notification',
          template: 'ticket-assignment-notification',
          recipients: ['assigned-agent', 'team-lead']
        }
      ]
    });

    // Escalation Workflow
    this.createWorkflow('ticket-escalation', {
      name: 'Ticket Escalation',
      description: 'Escalate tickets that exceed SLA',
      category: 'sla-management',
      enabled: true,
      trigger: {
        type: 'schedule',
        schedule: '*/5 * * * *' // Every 5 minutes
      },
      conditions: [
        {
          type: 'sla',
          field: 'response-time',
          operator: 'exceeds',
          value: 3600 // 1 hour
        }
      ],
      actions: [
        {
          type: 'escalation',
          level: 'team-lead'
        },
        {
          type: 'notification',
          template: 'sla-escalation-notification',
          recipients: ['team-lead', 'manager']
        }
      ]
    });

    // Welcome Workflow
    this.createWorkflow('user-welcome', {
      name: 'User Welcome Sequence',
      description: 'Send welcome sequence to new users',
      category: 'user-onboarding',
      enabled: true,
      trigger: {
        type: 'event',
        event: 'user.created'
      },
      conditions: [
        {
          type: 'field',
          field: 'role',
          operator: 'equals',
          value: 'user'
        }
      ],
      actions: [
        {
          type: 'notification',
          template: 'welcome-email',
          recipients: ['user']
        },
        {
          type: 'delay',
          delay: 3600 // 1 hour
        },
        {
          type: 'notification',
          template: 'onboarding-guide',
          recipients: ['user']
        }
      ]
    });

    // System Health Check Workflow
    this.createWorkflow('system-health-check', {
      name: 'System Health Check',
      description: 'Monitor system health and send alerts',
      category: 'system-monitoring',
      enabled: true,
      trigger: {
        type: 'schedule',
        schedule: '0 */6 * * *' // Every 6 hours
      },
      conditions: [
        {
          type: 'system',
          field: 'cpu-usage',
          operator: 'greater-than',
          value: 80
        }
      ],
      actions: [
        {
          type: 'notification',
          template: 'system-alert',
          recipients: ['admin', 'devops']
        }
      ]
    });
  }

  /**
   * Initialize trigger types
   */
  initializeTriggers() {
    this.triggers.set('event', {
      name: 'Event Trigger',
      description: 'Trigger workflow based on system events',
      handler: this.handleEventTrigger.bind(this)
    });

    this.triggers.set('schedule', {
      name: 'Schedule Trigger',
      description: 'Trigger workflow based on time schedule',
      handler: this.handleScheduleTrigger.bind(this)
    });

    this.triggers.set('webhook', {
      name: 'Webhook Trigger',
      description: 'Trigger workflow based on external webhook',
      handler: this.handleWebhookTrigger.bind(this)
    });

    this.triggers.set('manual', {
      name: 'Manual Trigger',
      description: 'Trigger workflow manually',
      handler: this.handleManualTrigger.bind(this)
    });
  }

  /**
   * Initialize action types
   */
  initializeActions() {
    this.actions.set('assignment', {
      name: 'Assignment Action',
      description: 'Assign tickets to users',
      handler: this.handleAssignmentAction.bind(this)
    });

    this.actions.set('notification', {
      name: 'Notification Action',
      description: 'Send notifications',
      handler: this.handleNotificationAction.bind(this)
    });

    this.actions.set('escalation', {
      name: 'Escalation Action',
      description: 'Escalate tickets',
      handler: this.handleEscalationAction.bind(this)
    });

    this.actions.set('delay', {
      name: 'Delay Action',
      description: 'Add delay between actions',
      handler: this.handleDelayAction.bind(this)
    });

    this.actions.set('field-update', {
      name: 'Field Update Action',
      description: 'Update ticket fields',
      handler: this.handleFieldUpdateAction.bind(this)
    });

    this.actions.set('webhook', {
      name: 'Webhook Action',
      description: 'Call external webhook',
      handler: this.handleWebhookAction.bind(this)
    });
  }

  /**
   * Initialize condition types
   */
  initializeConditions() {
    this.conditions.set('field', {
      name: 'Field Condition',
      description: 'Check field values',
      evaluator: this.evaluateFieldCondition.bind(this)
    });

    this.conditions.set('sla', {
      name: 'SLA Condition',
      description: 'Check SLA compliance',
      evaluator: this.evaluateSLACondition.bind(this)
    });

    this.conditions.set('system', {
      name: 'System Condition',
      description: 'Check system metrics',
      evaluator: this.evaluateSystemCondition.bind(this)
    });

    this.conditions.set('user', {
      name: 'User Condition',
      description: 'Check user properties',
      evaluator: this.evaluateUserCondition.bind(this)
    });
  }

  /**
   * Initialize workflow templates
   */
  initializeTemplates() {
    this.templates.set('ticket-management', {
      name: 'Ticket Management Template',
      description: 'Template for ticket-related workflows',
      triggers: ['event'],
      actions: ['assignment', 'notification', 'escalation', 'field-update'],
      conditions: ['field', 'sla']
    });

    this.templates.set('user-management', {
      name: 'User Management Template',
      description: 'Template for user-related workflows',
      triggers: ['event', 'schedule'],
      actions: ['notification', 'field-update'],
      conditions: ['field', 'user']
    });

    this.templates.set('system-monitoring', {
      name: 'System Monitoring Template',
      description: 'Template for system monitoring workflows',
      triggers: ['schedule'],
      actions: ['notification', 'webhook'],
      conditions: ['system']
    });
  }

  /**
   * Create a new workflow
   */
  createWorkflow(id, config) {
    const workflow = {
      id,
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      lastExecuted: null,
      status: 'active'
    };

    this.workflows.set(id, workflow);
    this.metrics.totalWorkflows++;
    this.metrics.activeWorkflows++;

    // Setup triggers
    this.setupWorkflowTrigger(workflow);

    this.emit('workflow.created', workflow);
    return workflow;
  }

  /**
   * Setup workflow trigger
   */
  setupWorkflowTrigger(workflow) {
    const trigger = workflow.trigger;
    const triggerType = this.triggers.get(trigger.type);

    if (triggerType) {
      triggerType.handler(workflow);
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId, context = {}) {
    const startTime = Date.now();
    const executionId = `${workflowId}-${Date.now()}`;
    
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (!workflow.enabled) {
        throw new Error(`Workflow ${workflowId} is disabled`);
      }

      const execution = {
        id: executionId,
        workflowId,
        status: 'running',
        startTime,
        context,
        steps: []
      };

      this.executions.set(executionId, execution);
      this.metrics.totalExecutions++;

      // Evaluate conditions
      const conditionsMet = await this.evaluateConditions(workflow.conditions, context);
      
      if (conditionsMet) {
        // Execute actions
        await this.executeActions(workflow.actions, context, execution);
        
        execution.status = 'completed';
        this.metrics.successfulExecutions++;
      } else {
        execution.status = 'skipped';
        execution.reason = 'Conditions not met';
      }

      // Update workflow metrics
      workflow.executionCount++;
      workflow.lastExecuted = new Date();

      const executionTime = Date.now() - startTime;
      this.updateAverageExecutionTime(executionTime);

      this.emit('workflow.executed', execution);
      return execution;

    } catch (error) {
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = 'failed';
        execution.error = error.message;
      }
      
      this.metrics.failedExecutions++;
      this.emit('workflow.failed', { executionId, error });
      throw error;
    }
  }

  /**
   * Evaluate workflow conditions
   */
  async evaluateConditions(conditions, context) {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    for (const condition of conditions) {
      const conditionType = this.conditions.get(condition.type);
      if (conditionType) {
        const result = await conditionType.evaluator(condition, context);
        if (!result) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Execute workflow actions
   */
  async executeActions(actions, context, execution) {
    for (const action of actions) {
      const actionType = this.actions.get(action.type);
      if (actionType) {
        const stepResult = await actionType.handler(action, context, execution);
        execution.steps.push({
          type: action.type,
          status: 'completed',
          result: stepResult,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Handle event trigger
   */
  handleEventTrigger(workflow) {
    // Listen for system events
    this.on('ticket.created', (data) => {
      if (workflow.trigger.event === 'ticket.created') {
        this.executeWorkflow(workflow.id, { event: 'ticket.created', data });
      }
    });

    this.on('user.created', (data) => {
      if (workflow.trigger.event === 'user.created') {
        this.executeWorkflow(workflow.id, { event: 'user.created', data });
      }
    });
  }

  /**
   * Handle schedule trigger
   */
  handleScheduleTrigger(workflow) {
    if (workflow.trigger.schedule) {
      const task = cron.schedule(workflow.trigger.schedule, () => {
        this.executeWorkflow(workflow.id, { event: 'scheduled' });
      }, { scheduled: false });

      this.schedules.set(workflow.id, task);
      task.start();
    }
  }

  /**
   * Handle webhook trigger
   */
  handleWebhookTrigger(workflow) {
    // Webhook triggers are handled via API endpoints
  }

  /**
   * Handle manual trigger
   */
  handleManualTrigger(workflow) {
    // Manual triggers are handled via API endpoints
  }

  /**
   * Handle assignment action
   */
  async handleAssignmentAction(action, context, execution) {
    const { assignTo, priority } = action;
    
    if (assignTo === 'least-busy-agent') {
      // Find agent with least active tickets
      const agents = await User.find({ role: 'agent' });
      const assignments = await this.getAgentWorkloads(agents);
      
      const leastBusyAgent = assignments.reduce((min, curr) => 
        curr.activeTickets < min.activeTickets ? curr : min
      );

      if (context.data && context.data.ticketId) {
        await Ticket.findByIdAndUpdate(context.data.ticketId, {
          assignedTo: leastBusyAgent.agentId,
          priority: priority || 'normal'
        });
      }

      return { assignedTo: leastBusyAgent.agentId };
    }

    return { assignedTo: assignTo };
  }

  /**
   * Handle notification action
   */
  async handleNotificationAction(action, context, execution) {
    const { template, recipients } = action;
    
    const notificationData = {
      template,
      recipients: this.resolveRecipients(recipients, context),
      data: context.data || {}
    };

    await sendNotification(notificationData);
    return { notificationSent: true };
  }

  /**
   * Handle escalation action
   */
  async handleEscalationAction(action, context, execution) {
    const { level } = action;
    
    if (context.data && context.data.ticketId) {
      const ticket = await Ticket.findById(context.data.ticketId);
      
      if (level === 'team-lead') {
        // Find team lead
        const teamLead = await User.findOne({ role: 'team-lead' });
        if (teamLead) {
          await Ticket.findByIdAndUpdate(context.data.ticketId, {
            assignedTo: teamLead._id,
            escalated: true,
            escalatedAt: new Date(),
            escalationLevel: level
          });
        }
      }
    }

    return { escalated: true, level };
  }

  /**
   * Handle delay action
   */
  async handleDelayAction(action, context, execution) {
    const { delay } = action;
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ delayed: delay });
      }, delay * 1000);
    });
  }

  /**
   * Handle field update action
   */
  async handleFieldUpdateAction(action, context, execution) {
    const { field, value } = action;
    
    if (context.data && context.data.ticketId) {
      await Ticket.findByIdAndUpdate(context.data.ticketId, {
        [field]: value,
        updatedAt: new Date()
      });
    }

    return { fieldUpdated: field, value };
  }

  /**
   * Handle webhook action
   */
  async handleWebhookAction(action, context, execution) {
    const { url, method, headers, body } = action;
    
    // Implement webhook call
    return { webhookCalled: url };
  }

  /**
   * Evaluate field condition
   */
  async evaluateFieldCondition(condition, context) {
    const { field, operator, value } = condition;
    
    if (context.data && context.data[field] !== undefined) {
      const fieldValue = context.data[field];
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not-equals':
          return fieldValue !== value;
        case 'greater-than':
          return fieldValue > value;
        case 'less-than':
          return fieldValue < value;
        case 'contains':
          return fieldValue.includes(value);
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Evaluate SLA condition
   */
  async evaluateSLACondition(condition, context) {
    const { field, operator, value } = condition;
    
    if (context.data && context.data.ticketId) {
      const ticket = await Ticket.findById(context.data.ticketId);
      if (ticket) {
        const now = new Date();
        const created = ticket.createdAt;
        const elapsed = (now - created) / 1000; // seconds
        
        switch (operator) {
          case 'exceeds':
            return elapsed > value;
          case 'within':
            return elapsed <= value;
          default:
            return false;
        }
      }
    }

    return false;
  }

  /**
   * Evaluate system condition
   */
  async evaluateSystemCondition(condition, context) {
    const { field, operator, value } = condition;
    
    // Get system metrics
    const metrics = await this.getSystemMetrics();
    
    if (metrics[field] !== undefined) {
      const fieldValue = metrics[field];
      
      switch (operator) {
        case 'greater-than':
          return fieldValue > value;
        case 'less-than':
          return fieldValue < value;
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Evaluate user condition
   */
  async evaluateUserCondition(condition, context) {
    const { field, operator, value } = condition;
    
    if (context.data && context.data.userId) {
      const user = await User.findById(context.data.userId);
      if (user && user[field] !== undefined) {
        const fieldValue = user[field];
        
        switch (operator) {
          case 'equals':
            return fieldValue === value;
          case 'not-equals':
            return fieldValue !== value;
          default:
            return false;
        }
      }
    }

    return false;
  }

  /**
   * Resolve recipients
   */
  resolveRecipients(recipients, context) {
    const resolved = [];
    
    for (const recipient of recipients) {
      switch (recipient) {
        case 'user':
          if (context.data && context.data.userId) {
            resolved.push(context.data.userId);
          }
          break;
        case 'assigned-agent':
          if (context.data && context.data.assignedTo) {
            resolved.push(context.data.assignedTo);
          }
          break;
        case 'team-lead':
          // Find team lead
          break;
        case 'admin':
          // Find admin users
          break;
        default:
          resolved.push(recipient);
      }
    }
    
    return resolved;
  }

  /**
   * Get agent workloads
   */
  async getAgentWorkloads(agents) {
    const workloads = [];
    
    for (const agent of agents) {
      const activeTickets = await Ticket.countDocuments({
        assignedTo: agent._id,
        status: { $in: ['open', 'in-progress'] }
      });
      
      workloads.push({
        agentId: agent._id,
        agentName: agent.name,
        activeTickets
      });
    }
    
    return workloads;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      'cpu-usage': cpuUsage.user + cpuUsage.system,
      'memory-usage': memUsage.heapUsed,
      'memory-total': memUsage.heapTotal
    };
  }

  /**
   * Update average execution time
   */
  updateAverageExecutionTime(executionTime) {
    const totalExecutions = this.metrics.totalExecutions;
    const currentAverage = this.metrics.averageExecutionTime;
    
    this.metrics.averageExecutionTime = 
      (currentAverage * (totalExecutions - 1) + executionTime) / totalExecutions;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(id) {
    return this.workflows.get(id);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflows by category
   */
  getWorkflowsByCategory(category) {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.category === category);
  }

  /**
   * Update workflow
   */
  updateWorkflow(id, updates) {
    const workflow = this.workflows.get(id);
    if (workflow) {
      Object.assign(workflow, updates);
      workflow.updatedAt = new Date();
      this.emit('workflow.updated', workflow);
      return workflow;
    }
    return null;
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(id) {
    const workflow = this.workflows.get(id);
    if (workflow) {
      // Stop scheduled tasks
      const schedule = this.schedules.get(id);
      if (schedule) {
        schedule.stop();
        this.schedules.delete(id);
      }
      
      this.workflows.delete(id);
      this.metrics.totalWorkflows--;
      this.metrics.activeWorkflows--;
      
      this.emit('workflow.deleted', workflow);
      return true;
    }
    return false;
  }

  /**
   * Get workflow execution
   */
  getExecution(executionId) {
    return this.executions.get(executionId);
  }

  /**
   * Get workflow executions
   */
  getWorkflowExecutions(workflowId, limit = 50) {
    const executions = Array.from(this.executions.values())
      .filter(execution => execution.workflowId === workflowId)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
    
    return executions;
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics() {
    return {
      ...this.metrics,
      activeWorkflows: Array.from(this.workflows.values())
        .filter(workflow => workflow.enabled).length,
      recentExecutions: Array.from(this.executions.values())
        .filter(execution => Date.now() - execution.startTime < 3600000) // Last hour
        .length
    };
  }

  /**
   * Enable/disable workflow
   */
  toggleWorkflow(id, enabled) {
    const workflow = this.workflows.get(id);
    if (workflow) {
      workflow.enabled = enabled;
      workflow.updatedAt = new Date();
      
      if (enabled) {
        this.metrics.activeWorkflows++;
        this.setupWorkflowTrigger(workflow);
      } else {
        this.metrics.activeWorkflows--;
        // Stop scheduled tasks
        const schedule = this.schedules.get(id);
        if (schedule) {
          schedule.stop();
        }
      }
      
      this.emit('workflow.toggled', workflow);
      return workflow;
    }
    return null;
  }

  /**
   * Trigger event
   */
  triggerEvent(eventName, data) {
    this.emit(eventName, data);
  }
}

// Create singleton instance
const workflowAutomationSystem = new WorkflowAutomationSystem();

// Export functions
const createWorkflow = (id, config) => workflowAutomationSystem.createWorkflow(id, config);
const executeWorkflow = (workflowId, context) => workflowAutomationSystem.executeWorkflow(workflowId, context);
const getWorkflow = (id) => workflowAutomationSystem.getWorkflow(id);
const getAllWorkflows = () => workflowAutomationSystem.getAllWorkflows();
const getWorkflowsByCategory = (category) => workflowAutomationSystem.getWorkflowsByCategory(category);
const updateWorkflow = (id, updates) => workflowAutomationSystem.updateWorkflow(id, updates);
const deleteWorkflow = (id) => workflowAutomationSystem.deleteWorkflow(id);
const getExecution = (executionId) => workflowAutomationSystem.getExecution(executionId);
const getWorkflowExecutions = (workflowId, limit) => workflowAutomationSystem.getWorkflowExecutions(workflowId, limit);
const getWorkflowMetrics = () => workflowAutomationSystem.getWorkflowMetrics();
const toggleWorkflow = (id, enabled) => workflowAutomationSystem.toggleWorkflow(id, enabled);
const triggerEvent = (eventName, data) => workflowAutomationSystem.triggerEvent(eventName, data);

module.exports = {
  workflowAutomationSystem,
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
};
