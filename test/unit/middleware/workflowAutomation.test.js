/**
 * Workflow Automation System Tests
 * Comprehensive test suite for the workflow automation middleware
 */

const { 
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
} = require('../../middleware/workflowAutomation');

describe('Workflow Automation System', () => {
  let testWorkflowId;

  beforeEach(() => {
    // Clear test data before each test
    const workflows = getAllWorkflows();
    for (const workflow of workflows) {
      if (workflow.id.startsWith('test-')) {
        deleteWorkflow(workflow.id);
      }
    }
  });

  afterEach(() => {
    // Clean up after each test
    const workflows = getAllWorkflows();
    for (const workflow of workflows) {
      if (workflow.id.startsWith('test-')) {
        deleteWorkflow(workflow.id);
      }
    }
  });

  describe('Workflow Creation', () => {
    test('should create a new workflow successfully', () => {
      const workflowConfig = {
        name: 'Test Workflow',
        description: 'Test workflow for unit testing',
        category: 'test',
        enabled: true,
        trigger: {
          type: 'manual'
        },
        conditions: [],
        actions: [
          {
            type: 'notification',
            template: 'test-template',
            recipients: ['user']
          }
        ]
      };

      const workflow = createWorkflow('test-workflow', workflowConfig);

      expect(workflow).toBeDefined();
      expect(workflow.id).toBe('test-workflow');
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.enabled).toBe(true);
      expect(workflow.category).toBe('test');
      expect(workflow.trigger.type).toBe('manual');
      expect(workflow.actions).toHaveLength(1);
    });

    test('should initialize default workflows', () => {
      const workflows = getAllWorkflows();
      
      // Check that default workflows are created
      expect(workflows.length).toBeGreaterThan(0);
      
      // Check for specific default workflows
      const ticketAssignment = getWorkflow('ticket-assignment');
      expect(ticketAssignment).toBeDefined();
      expect(ticketAssignment.name).toBe('Automatic Ticket Assignment');
      
      const escalation = getWorkflow('ticket-escalation');
      expect(escalation).toBeDefined();
      expect(escalation.name).toBe('Ticket Escalation');
      
      const welcome = getWorkflow('user-welcome');
      expect(welcome).toBeDefined();
      expect(welcome.name).toBe('User Welcome Sequence');
    });
  });

  describe('Workflow Retrieval', () => {
    test('should get workflow by ID', () => {
      const workflowConfig = {
        name: 'Test Workflow',
        description: 'Test workflow',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [],
        actions: []
      };

      createWorkflow('test-retrieval', workflowConfig);
      const workflow = getWorkflow('test-retrieval');

      expect(workflow).toBeDefined();
      expect(workflow.id).toBe('test-retrieval');
      expect(workflow.name).toBe('Test Workflow');
    });

    test('should return null for non-existent workflow', () => {
      const workflow = getWorkflow('non-existent');
      expect(workflow).toBeNull();
    });

    test('should get all workflows', () => {
      const workflows = getAllWorkflows();
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);
    });

    test('should get workflows by category', () => {
      const workflows = getWorkflowsByCategory('ticket-management');
      expect(Array.isArray(workflows)).toBe(true);
      
      // Should contain ticket assignment workflow
      const ticketAssignment = workflows.find(w => w.id === 'ticket-assignment');
      expect(ticketAssignment).toBeDefined();
    });
  });

  describe('Workflow Execution', () => {
    test('should execute workflow manually', async () => {
      const workflowConfig = {
        name: 'Test Execution Workflow',
        description: 'Test workflow execution',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [],
        actions: [
          {
            type: 'notification',
            template: 'test-template',
            recipients: ['user']
          }
        ]
      };

      createWorkflow('test-execution', workflowConfig);
      
      const execution = await executeWorkflow('test-execution', {
        userId: 'test-user',
        data: { testField: 'testValue' }
      });

      expect(execution).toBeDefined();
      expect(execution.workflowId).toBe('test-execution');
      expect(execution.status).toBe('completed');
      expect(execution.steps).toHaveLength(1);
      expect(execution.steps[0].type).toBe('notification');
    });

    test('should skip workflow when conditions are not met', async () => {
      const workflowConfig = {
        name: 'Test Conditions Workflow',
        description: 'Test workflow conditions',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
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
            type: 'notification',
            template: 'test-template',
            recipients: ['user']
          }
        ]
      };

      createWorkflow('test-conditions', workflowConfig);
      
      const execution = await executeWorkflow('test-conditions', {
        data: { priority: 'low' } // Condition should not be met
      });

      expect(execution).toBeDefined();
      expect(execution.status).toBe('skipped');
      expect(execution.reason).toBe('Conditions not met');
    });

    test('should handle disabled workflow', async () => {
      const workflowConfig = {
        name: 'Test Disabled Workflow',
        description: 'Test disabled workflow',
        category: 'test',
        enabled: false, // Disabled
        trigger: { type: 'manual' },
        conditions: [],
        actions: []
      };

      createWorkflow('test-disabled', workflowConfig);
      
      await expect(executeWorkflow('test-disabled', {})).rejects.toThrow('is disabled');
    });

    test('should handle non-existent workflow execution', async () => {
      await expect(executeWorkflow('non-existent', {})).rejects.toThrow('not found');
    });
  });

  describe('Workflow Updates', () => {
    test('should update workflow successfully', () => {
      const workflowConfig = {
        name: 'Test Update Workflow',
        description: 'Test workflow update',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [],
        actions: []
      };

      const workflow = createWorkflow('test-update', workflowConfig);
      expect(workflow.name).toBe('Test Update Workflow');

      const updatedWorkflow = updateWorkflow('test-update', {
        name: 'Updated Workflow Name',
        description: 'Updated description'
      });

      expect(updatedWorkflow).toBeDefined();
      expect(updatedWorkflow.name).toBe('Updated Workflow Name');
      expect(updatedWorkflow.description).toBe('Updated description');
      expect(updatedWorkflow.updatedAt).toBeInstanceOf(Date);
    });

    test('should return null when updating non-existent workflow', () => {
      const result = updateWorkflow('non-existent', { name: 'New Name' });
      expect(result).toBeNull();
    });
  });

  describe('Workflow Deletion', () => {
    test('should delete workflow successfully', () => {
      const workflowConfig = {
        name: 'Test Delete Workflow',
        description: 'Test workflow deletion',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [],
        actions: []
      };

      createWorkflow('test-delete', workflowConfig);
      expect(getWorkflow('test-delete')).toBeDefined();

      const deleted = deleteWorkflow('test-delete');
      expect(deleted).toBe(true);
      expect(getWorkflow('test-delete')).toBeNull();
    });

    test('should return false when deleting non-existent workflow', () => {
      const deleted = deleteWorkflow('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('Workflow Toggle', () => {
    test('should enable workflow', () => {
      const workflowConfig = {
        name: 'Test Toggle Workflow',
        description: 'Test workflow toggle',
        category: 'test',
        enabled: false,
        trigger: { type: 'manual' },
        conditions: [],
        actions: []
      };

      createWorkflow('test-toggle', workflowConfig);
      expect(getWorkflow('test-toggle').enabled).toBe(false);

      const workflow = toggleWorkflow('test-toggle', true);
      expect(workflow).toBeDefined();
      expect(workflow.enabled).toBe(true);
    });

    test('should disable workflow', () => {
      const workflowConfig = {
        name: 'Test Toggle Workflow',
        description: 'Test workflow toggle',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [],
        actions: []
      };

      createWorkflow('test-toggle-disable', workflowConfig);
      expect(getWorkflow('test-toggle-disable').enabled).toBe(true);

      const workflow = toggleWorkflow('test-toggle-disable', false);
      expect(workflow).toBeDefined();
      expect(workflow.enabled).toBe(false);
    });

    test('should return null when toggling non-existent workflow', () => {
      const result = toggleWorkflow('non-existent', true);
      expect(result).toBeNull();
    });
  });

  describe('Workflow Metrics', () => {
    test('should get workflow metrics', () => {
      const metrics = getWorkflowMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalWorkflows).toBeGreaterThan(0);
      expect(metrics.activeWorkflows).toBeGreaterThanOrEqual(0);
      expect(metrics.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(metrics.successfulExecutions).toBeGreaterThanOrEqual(0);
      expect(metrics.failedExecutions).toBeGreaterThanOrEqual(0);
      expect(metrics.averageExecutionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.recentExecutions).toBeGreaterThanOrEqual(0);
    });

    test('should update metrics after workflow execution', async () => {
      const initialMetrics = getWorkflowMetrics();
      
      const workflowConfig = {
        name: 'Test Metrics Workflow',
        description: 'Test workflow metrics',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [],
        actions: []
      };

      createWorkflow('test-metrics', workflowConfig);
      await executeWorkflow('test-metrics', {});

      const updatedMetrics = getWorkflowMetrics();
      expect(updatedMetrics.totalExecutions).toBe(initialMetrics.totalExecutions + 1);
      expect(updatedMetrics.successfulExecutions).toBe(initialMetrics.successfulExecutions + 1);
    });
  });

  describe('Event Triggering', () => {
    test('should trigger events successfully', () => {
      // Set up event listener
      let eventReceived = false;
      let eventData = null;
      
      workflowAutomationSystem.on('test-event', (data) => {
        eventReceived = true;
        eventData = data;
      });

      triggerEvent('test-event', { test: 'data' });

      expect(eventReceived).toBe(true);
      expect(eventData).toEqual({ test: 'data' });
    });
  });

  describe('Condition Evaluation', () => {
    test('should evaluate field conditions correctly', async () => {
      const workflowConfig = {
        name: 'Test Field Condition',
        description: 'Test field condition evaluation',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [
          {
            type: 'field',
            field: 'priority',
            operator: 'equals',
            value: 'high'
          }
        ],
        actions: []
      };

      createWorkflow('test-field-condition', workflowConfig);
      
      // Should execute when condition is met
      const execution1 = await executeWorkflow('test-field-condition', {
        data: { priority: 'high' }
      });
      expect(execution1.status).toBe('completed');

      // Should skip when condition is not met
      const execution2 = await executeWorkflow('test-field-condition', {
        data: { priority: 'low' }
      });
      expect(execution2.status).toBe('skipped');
    });
  });

  describe('Action Execution', () => {
    test('should execute delay action', async () => {
      const workflowConfig = {
        name: 'Test Delay Action',
        description: 'Test delay action execution',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [],
        actions: [
          {
            type: 'delay',
            delay: 0.1 // 100ms
          }
        ]
      };

      createWorkflow('test-delay-action', workflowConfig);
      
      const startTime = Date.now();
      const execution = await executeWorkflow('test-delay-action', {});
      const endTime = Date.now();
      
      expect(execution.status).toBe('completed');
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle workflow execution errors', async () => {
      const workflowConfig = {
        name: 'Test Error Workflow',
        description: 'Test workflow error handling',
        category: 'test',
        enabled: true,
        trigger: { type: 'manual' },
        conditions: [],
        actions: [
          {
            type: 'invalid-action-type',
            data: {}
          }
        ]
      };

      createWorkflow('test-error', workflowConfig);
      
      await expect(executeWorkflow('test-error', {})).rejects.toThrow();
    });
  });

  describe('Workflow Templates', () => {
    test('should have workflow templates initialized', () => {
      const templates = workflowAutomationSystem.templates;
      expect(templates.size).toBeGreaterThan(0);
      
      expect(templates.has('ticket-management')).toBe(true);
      expect(templates.has('user-management')).toBe(true);
      expect(templates.has('system-monitoring')).toBe(true);
    });
  });

  describe('Trigger Types', () => {
    test('should have trigger types initialized', () => {
      const triggers = workflowAutomationSystem.triggers;
      expect(triggers.size).toBeGreaterThan(0);
      
      expect(triggers.has('event')).toBe(true);
      expect(triggers.has('schedule')).toBe(true);
      expect(triggers.has('webhook')).toBe(true);
      expect(triggers.has('manual')).toBe(true);
    });
  });

  describe('Action Types', () => {
    test('should have action types initialized', () => {
      const actions = workflowAutomationSystem.actions;
      expect(actions.size).toBeGreaterThan(0);
      
      expect(actions.has('assignment')).toBe(true);
      expect(actions.has('notification')).toBe(true);
      expect(actions.has('escalation')).toBe(true);
      expect(actions.has('delay')).toBe(true);
      expect(actions.has('field-update')).toBe(true);
      expect(actions.has('webhook')).toBe(true);
    });
  });

  describe('Condition Types', () => {
    test('should have condition types initialized', () => {
      const conditions = workflowAutomationSystem.conditions;
      expect(conditions.size).toBeGreaterThan(0);
      
      expect(conditions.has('field')).toBe(true);
      expect(conditions.has('sla')).toBe(true);
      expect(conditions.has('system')).toBe(true);
      expect(conditions.has('user')).toBe(true);
    });
  });
});

describe('Workflow Automation Integration', () => {
  test('should integrate with notification system', async () => {
    // Mock notification system
    const mockSendNotification = jest.fn();
    jest.doMock('../../middleware/notificationSystem', () => ({
      sendNotification: mockSendNotification
    }));

    // Re-require to get mocked version
    const { executeWorkflow } = require('../../middleware/workflowAutomation');

    const workflowConfig = {
      name: 'Test Integration Workflow',
      description: 'Test notification integration',
      category: 'test',
      enabled: true,
      trigger: { type: 'manual' },
      conditions: [],
      actions: [
        {
          type: 'notification',
          template: 'test-template',
          recipients: ['user']
        }
      ]
    };

    createWorkflow('test-integration', workflowConfig);
    
    const execution = await executeWorkflow('test-integration', {
      userId: 'test-user',
      data: { testField: 'testValue' }
    });

    expect(execution.status).toBe('completed');
    expect(mockSendNotification).toHaveBeenCalled();
  });
});

describe('Workflow Automation Performance', () => {
  test('should handle multiple concurrent executions', async () => {
    const workflowConfig = {
      name: 'Test Performance Workflow',
      description: 'Test workflow performance',
      category: 'test',
      enabled: true,
      trigger: { type: 'manual' },
      conditions: [],
      actions: []
    };

    createWorkflow('test-performance', workflowConfig);
    
    // Execute multiple workflows concurrently
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(executeWorkflow('test-performance', { index: i }));
    }

    const executions = await Promise.all(promises);
    
    expect(executions).toHaveLength(10);
    executions.forEach(execution => {
      expect(execution.status).toBe('completed');
    });
  });

  test('should complete execution within reasonable time', async () => {
    const workflowConfig = {
      name: 'Test Performance Timing',
      description: 'Test workflow execution timing',
      category: 'test',
      enabled: true,
      trigger: { type: 'manual' },
      conditions: [],
      actions: []
    };

    createWorkflow('test-timing', workflowConfig);
    
    const startTime = Date.now();
    const execution = await executeWorkflow('test-timing', {});
    const endTime = Date.now();
    
    expect(execution.status).toBe('completed');
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });
});
