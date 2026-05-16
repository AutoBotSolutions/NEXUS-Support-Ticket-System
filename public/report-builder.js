/**
 * NEXUS Custom Report Builder
 * 
 * Frontend JavaScript for building custom reports with drag-and-drop interface,
 * data source configuration, and report generation.
 */

class ReportBuilder {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            apiEndpoint: options.apiEndpoint || '/api/reports',
            templatesEndpoint: options.templatesEndpoint || '/api/reports/templates',
            autoSave: options.autoSave !== false,
            theme: options.theme || 'light'
        };
        
        this.container = document.getElementById(containerId);
        this.reportConfig = {
            name: '',
            description: '',
            type: 'custom',
            parameters: {},
            format: 'json',
            sections: []
        };
        
        this.templates = [];
        this.dataSources = [];
        this.availableFields = [];
        this.draggedElement = null;
        
        this.init();
    }

    async init() {
        try {
            this.setupContainer();
            await this.loadTemplates();
            await this.loadDataSources();
            this.setupEventListeners();
            this.initializeDragAndDrop();
        } catch (error) {
            console.error('Error initializing report builder:', error);
            this.showError('Failed to initialize report builder');
        }
    }

    setupContainer() {
        if (!this.container) {
            throw new Error(`Container with ID '${this.containerId}' not found`);
        }

        this.container.innerHTML = `
            <div class="report-builder">
                <div class="builder-header">
                    <h2>Custom Report Builder</h2>
                    <div class="builder-controls">
                        <button class="btn btn-secondary" id="loadTemplateBtn">
                            <i class="fas fa-file-import"></i> Load Template
                        </button>
                        <button class="btn btn-secondary" id="saveTemplateBtn">
                            <i class="fas fa-save"></i> Save Template
                        </button>
                        <button class="btn btn-primary" id="previewBtn">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="btn btn-success" id="generateBtn">
                            <i class="fas fa-download"></i> Generate Report
                        </button>
                    </div>
                </div>
                
                <div class="builder-content">
                    <div class="builder-sidebar">
                        <div class="builder-section">
                            <h3>Report Configuration</h3>
                            <div class="form-group">
                                <label for="reportName">Report Name</label>
                                <input type="text" id="reportName" class="form-control" placeholder="Enter report name">
                            </div>
                            <div class="form-group">
                                <label for="reportDescription">Description</label>
                                <textarea id="reportDescription" class="form-control" placeholder="Enter report description"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="reportFormat">Output Format</label>
                                <select id="reportFormat" class="form-control">
                                    <option value="json">JSON</option>
                                    <option value="csv">CSV</option>
                                    <option value="excel">Excel</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="builder-section">
                            <h3>Data Sources</h3>
                            <div class="data-sources-list" id="dataSourcesList"></div>
                        </div>
                        
                        <div class="builder-section">
                            <h3>Available Fields</h3>
                            <div class="fields-list" id="fieldsList"></div>
                        </div>
                    </div>
                    
                    <div class="builder-main">
                        <div class="report-canvas" id="reportCanvas">
                            <div class="canvas-placeholder">
                                <div class="placeholder-content">
                                    <i class="fas fa-plus-circle"></i>
                                    <h3>Start Building Your Report</h3>
                                    <p>Drag and drop components from the sidebar to create your custom report</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="builder-footer">
                    <div class="builder-actions">
                        <button class="btn btn-secondary" id="clearBtn">
                            <i class="fas fa-trash"></i> Clear
                        </button>
                        <button class="btn btn-primary" id="saveBtn">
                            <i class="fas fa-save"></i> Save Report
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.reportCanvas = this.container.querySelector('#reportCanvas');
        this.dataSourcesList = this.container.querySelector('#dataSourcesList');
        this.fieldsList = this.container.querySelector('#fieldsList');
    }

    async loadTemplates() {
        try {
            const response = await fetch(this.options.templatesEndpoint);
            const data = await response.json();
            
            if (data.success) {
                this.templates = data.data;
                this.renderTemplates();
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    async loadDataSources() {
        try {
            // Mock data sources - in real implementation, this would come from API
            this.dataSources = [
                {
                    id: 'ticket_analytics',
                    name: 'Ticket Analytics',
                    description: 'Ticket volume, resolution time, and trends',
                    type: 'api',
                    endpoint: '/api/analytics/tickets'
                },
                {
                    id: 'user_performance',
                    name: 'User Performance',
                    description: 'User activity and performance metrics',
                    type: 'api',
                    endpoint: '/api/analytics/users'
                },
                {
                    id: 'system_performance',
                    name: 'System Performance',
                    description: 'API performance, database metrics, and system health',
                    type: 'api',
                    endpoint: '/api/analytics/performance'
                },
                {
                    id: 'github_integration',
                    name: 'GitHub Integration',
                    description: 'GitHub sync and integration analytics',
                    type: 'api',
                    endpoint: '/api/analytics/github'
                }
            ];
            
            this.renderDataSources();
        } catch (error) {
            console.error('Error loading data sources:', error);
        }
    }

    renderTemplates() {
        // Templates are rendered in modal when user clicks "Load Template"
    }

    renderDataSources() {
        this.dataSourcesList.innerHTML = this.dataSources.map(source => `
            <div class="data-source-item" data-source-id="${source.id}">
                <div class="source-header">
                    <h4>${source.name}</h4>
                    <button class="btn btn-sm btn-outline-primary add-source-btn" data-source-id="${source.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <p>${source.description}</p>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Report configuration
        const reportName = this.container.querySelector('#reportName');
        const reportDescription = this.container.querySelector('#reportDescription');
        const reportFormat = this.container.querySelector('#reportFormat');

        reportName.addEventListener('input', (e) => {
            this.reportConfig.name = e.target.value;
        });

        reportDescription.addEventListener('input', (e) => {
            this.reportConfig.description = e.target.value;
        });

        reportFormat.addEventListener('change', (e) => {
            this.reportConfig.format = e.target.value;
        });

        // Action buttons
        this.container.querySelector('#loadTemplateBtn').addEventListener('click', () => this.showTemplateModal());
        this.container.querySelector('#saveTemplateBtn').addEventListener('click', () => this.saveTemplate());
        this.container.querySelector('#previewBtn').addEventListener('click', () => this.previewReport());
        this.container.querySelector('#generateBtn').addEventListener('click', () => this.generateReport());
        this.container.querySelector('#clearBtn').addEventListener('click', () => this.clearReport());
        this.container.querySelector('#saveBtn').addEventListener('click', () => this.saveReport());

        // Data source buttons
        this.container.querySelectorAll('.add-source-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sourceId = e.target.closest('.add-source-btn').dataset.sourceId;
                this.addDataSource(sourceId);
            });
        });
    }

    initializeDragAndDrop() {
        // Make fields draggable
        this.container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('field-item')) {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'copy';
            }
        });

        this.container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('field-item')) {
                e.target.classList.remove('dragging');
            }
        });

        // Setup drop zones
        this.reportCanvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.reportCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
        });
    }

    addDataSource(sourceId) {
        const source = this.dataSources.find(s => s.id === sourceId);
        if (!source) return;

        // Add to report configuration
        this.reportConfig.parameters.dataSource = source;
        
        // Load available fields for this data source
        this.loadAvailableFields(sourceId);
        
        // Update UI
        this.updateDataSourceUI(source);
    }

    async loadAvailableFields(sourceId) {
        try {
            // Mock fields - in real implementation, this would come from API
            const fieldsMap = {
                'ticket_analytics': [
                    { id: 'ticket_count', name: 'Ticket Count', type: 'number' },
                    { id: 'resolution_time', name: 'Resolution Time', type: 'duration' },
                    { id: 'priority', name: 'Priority', type: 'string' },
                    { id: 'status', name: 'Status', type: 'string' },
                    { id: 'created_date', name: 'Created Date', type: 'date' },
                    { id: 'assigned_to', name: 'Assigned To', type: 'string' }
                ],
                'user_performance': [
                    { id: 'user_name', name: 'User Name', type: 'string' },
                    { id: 'tickets_handled', name: 'Tickets Handled', type: 'number' },
                    { id: 'resolution_rate', name: 'Resolution Rate', type: 'percentage' },
                    { id: 'avg_response_time', name: 'Avg Response Time', type: 'duration' },
                    { id: 'satisfaction_score', name: 'Satisfaction Score', type: 'number' }
                ],
                'system_performance': [
                    { id: 'api_response_time', name: 'API Response Time', type: 'duration' },
                    { id: 'error_rate', name: 'Error Rate', type: 'percentage' },
                    { id: 'uptime', name: 'Uptime', type: 'percentage' },
                    { id: 'memory_usage', name: 'Memory Usage', type: 'percentage' },
                    { id: 'cpu_usage', name: 'CPU Usage', type: 'percentage' }
                ]
            };

            this.availableFields = fieldsMap[sourceId] || [];
            this.renderAvailableFields();
        } catch (error) {
            console.error('Error loading available fields:', error);
        }
    }

    renderAvailableFields() {
        this.fieldsList.innerHTML = this.availableFields.map(field => `
            <div class="field-item" draggable="true" data-field-id="${field.id}" data-field-type="${field.type}">
                <div class="field-info">
                    <span class="field-name">${field.name}</span>
                    <span class="field-type">${field.type}</span>
                </div>
                <i class="fas fa-grip-vertical"></i>
            </div>
        `).join('');
    }

    updateDataSourceUI(source) {
        this.dataSourcesList.innerHTML += `
            <div class="active-source">
                <div class="source-info">
                    <i class="fas fa-check-circle text-success"></i>
                    <span>${source.name}</span>
                </div>
            </div>
        `;
    }

    handleDrop(e) {
        if (!this.draggedElement) return;

        const fieldId = this.draggedElement.dataset.fieldId;
        const fieldType = this.draggedElement.dataset.fieldType;
        
        const field = this.availableFields.find(f => f.id === fieldId);
        if (!field) return;

        this.addReportSection(field);
        this.draggedElement = null;
    }

    addReportSection(field) {
        // Remove placeholder if exists
        const placeholder = this.reportCanvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const sectionId = `section_${Date.now()}`;
        const section = {
            id: sectionId,
            type: this.getSectionType(field.type),
            field: field,
            title: field.name,
            config: this.getDefaultSectionConfig(field.type)
        };

        this.reportConfig.sections.push(section);
        this.renderSection(section);
    }

    getSectionType(fieldType) {
        const typeMap = {
            'number': 'metric',
            'percentage': 'progress',
            'duration': 'metric',
            'string': 'table',
            'date': 'table'
        };
        return typeMap[fieldType] || 'table';
    }

    getDefaultSectionConfig(fieldType) {
        const configMap = {
            'metric': { showTrend: true },
            'progress': { showLabel: true },
            'table': { sortable: true, filterable: true }
        };
        return configMap[fieldType] || {};
    }

    renderSection(section) {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'report-section';
        sectionElement.id = section.id;
        sectionElement.innerHTML = `
            <div class="section-header">
                <h4>${section.title}</h4>
                <div class="section-controls">
                    <button class="btn btn-sm btn-outline-secondary edit-section-btn" data-section-id="${section.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger remove-section-btn" data-section-id="${section.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="section-content">
                <div class="section-preview">
                    <i class="fas fa-${this.getSectionIcon(section.type)}"></i>
                    <span>${section.type} component</span>
                </div>
            </div>
        `;

        this.reportCanvas.appendChild(sectionElement);

        // Add event listeners
        sectionElement.querySelector('.edit-section-btn').addEventListener('click', (e) => {
            this.editSection(section.id);
        });

        sectionElement.querySelector('.remove-section-btn').addEventListener('click', (e) => {
            this.removeSection(section.id);
        });
    }

    getSectionIcon(type) {
        const iconMap = {
            'metric': 'chart-bar',
            'progress': 'tasks-progress',
            'table': 'table',
            'chart': 'chart-line',
            'list': 'list'
        };
        return iconMap[type] || 'cube';
    }

    editSection(sectionId) {
        const section = this.reportConfig.sections.find(s => s.id === sectionId);
        if (!section) return;

        // Show edit modal for section configuration
        this.showSectionEditModal(section);
    }

    removeSection(sectionId) {
        const index = this.reportConfig.sections.findIndex(s => s.id === sectionId);
        if (index !== -1) {
            this.reportConfig.sections.splice(index, 1);
            const element = document.getElementById(sectionId);
            if (element) {
                element.remove();
            }
        }

        // Show placeholder if no sections left
        if (this.reportConfig.sections.length === 0) {
            this.showPlaceholder();
        }
    }

    showPlaceholder() {
        this.reportCanvas.innerHTML = `
            <div class="canvas-placeholder">
                <div class="placeholder-content">
                    <i class="fas fa-plus-circle"></i>
                    <h3>Start Building Your Report</h3>
                    <p>Drag and drop components from the sidebar to create your custom report</p>
                </div>
            </div>
        `;
    }

    showTemplateModal() {
        // Implementation for template selection modal
        console.log('Show template modal');
    }

    async saveTemplate() {
        try {
            if (!this.reportConfig.name) {
                this.showError('Please enter a report name');
                return;
            }

            const templateData = {
                ...this.reportConfig,
                isTemplate: true,
                templateCategory: 'custom'
            };

            const response = await fetch(`${this.options.apiEndpoint}/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templateData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Template saved successfully');
            } else {
                throw new Error(result.error || 'Failed to save template');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            this.showError('Failed to save template');
        }
    }

    async previewReport() {
        try {
            if (!this.validateReportConfig()) {
                return;
            }

            // Show preview modal
            this.showPreviewModal();
        } catch (error) {
            console.error('Error previewing report:', error);
            this.showError('Failed to preview report');
        }
    }

    async generateReport() {
        try {
            if (!this.validateReportConfig()) {
                return;
            }

            this.showLoading(true);

            const response = await fetch(`${this.options.apiEndpoint}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.reportConfig)
            });

            const result = await response.json();
            
            if (result.success) {
                this.downloadReport(result.data);
            } else {
                throw new Error(result.error || 'Failed to generate report');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            this.showError('Failed to generate report');
        } finally {
            this.showLoading(false);
        }
    }

    clearReport() {
        this.reportConfig = {
            name: '',
            description: '',
            type: 'custom',
            parameters: {},
            format: 'json',
            sections: []
        };

        // Reset form fields
        this.container.querySelector('#reportName').value = '';
        this.container.querySelector('#reportDescription').value = '';
        this.container.querySelector('#reportFormat').value = 'json';

        // Clear canvas
        this.showPlaceholder();
    }

    async saveReport() {
        try {
            if (!this.validateReportConfig()) {
                return;
            }

            this.showLoading(true);

            const response = await fetch(this.options.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.reportConfig)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Report saved successfully');
            } else {
                throw new Error(result.error || 'Failed to save report');
            }
        } catch (error) {
            console.error('Error saving report:', error);
            this.showError('Failed to save report');
        } finally {
            this.showLoading(false);
        }
    }

    validateReportConfig() {
        if (!this.reportConfig.name) {
            this.showError('Please enter a report name');
            return false;
        }

        if (this.reportConfig.sections.length === 0) {
            this.showError('Please add at least one section to the report');
            return false;
        }

        return true;
    }

    downloadReport(reportData) {
        const { format, data } = reportData;
        
        let blob;
        let filename;
        let mimeType;

        switch (format) {
            case 'json':
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                filename = `report_${this.reportConfig.name}.json`;
                mimeType = 'application/json';
                break;
            case 'csv':
                blob = new Blob([data], { type: 'text/csv' });
                filename = `report_${this.reportConfig.name}.csv`;
                mimeType = 'text/csv';
                break;
            case 'excel':
                blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                filename = `report_${this.reportConfig.name}.xlsx`;
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            case 'pdf':
                blob = new Blob([data], { type: 'application/pdf' });
                filename = `report_${this.reportConfig.name}.pdf`;
                mimeType = 'application/pdf';
                break;
            default:
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                filename = `report_${this.reportConfig.name}.json`;
                mimeType = 'application/json';
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showLoading(show) {
        // Implementation for loading overlay
        console.log('Loading:', show);
    }

    showError(message) {
        // Implementation for error notification
        console.error('Error:', message);
        alert(message); // Simple fallback
    }

    showSuccess(message) {
        // Implementation for success notification
        console.log('Success:', message);
        alert(message); // Simple fallback
    }

    showPreviewModal() {
        // Implementation for preview modal
        console.log('Show preview modal');
    }

    showSectionEditModal(section) {
        // Implementation for section edit modal
        console.log('Show section edit modal for:', section);
    }

    destroy() {
        // Clean up event listeners and resources
        this.container.innerHTML = '';
    }
}

// Initialize report builder when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined' && window.ReportBuilder) {
        // Auto-initialize report builder if container exists
        const container = document.getElementById('report-builder');
        if (container) {
            new ReportBuilder('report-builder');
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportBuilder;
} else if (typeof window !== 'undefined') {
    window.ReportBuilder = ReportBuilder;
}
