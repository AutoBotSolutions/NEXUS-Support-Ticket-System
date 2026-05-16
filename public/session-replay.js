/**
 * NEXUS Session Replay System
 * Records user sessions for debugging and user experience analysis
 */

class SessionReplay {
    constructor(options = {}) {
        this.options = {
            maxSessionLength: 30 * 60 * 1000, // 30 minutes
            maxEvents: 10000,
            sampleRate: options.sampleRate || 1.0, // 100% sampling by default
            recordMouseMovements: options.recordMouseMovements !== false,
            recordClicks: options.recordClicks !== false,
            recordScrolls: options.recordScrolls !== false,
            recordInputs: options.recordInputs !== false,
            recordNetworkRequests: options.recordNetworkRequests !== false,
            recordConsoleLogs: options.recordConsoleLogs !== false,
            recordErrors: options.recordErrors !== false,
            ...options
        };

        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.isRecording = false;
        this.recordingInterval = null;
        this.mousePositionBuffer = [];
        this.originalConsole = {};
        this.originalFetch = window.fetch;
        this.originalXHR = window.XMLHttpRequest;

        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        // Don't record if sample rate doesn't allow
        if (Math.random() > this.options.sampleRate) {
            return;
        }

        this.isRecording = true;
        this.setupEventListeners();
        this.setupConsoleOverride();
        this.setupNetworkOverride();
        this.startRecording();
    }

    setupEventListeners() {
        // Mouse movements (throttled)
        if (this.options.recordMouseMovements) {
            let mouseMoveThrottle;
            document.addEventListener('mousemove', (e) => {
                if (!mouseMoveThrottle) {
                    mouseMoveThrottle = setTimeout(() => {
                        this.addEvent('mousemove', {
                            x: e.clientX,
                            y: e.clientY,
                            timestamp: Date.now()
                        });
                        mouseMoveThrottle = null;
                    }, 50); // Throttle to every 50ms
                }
            });
        }

        // Clicks
        if (this.options.recordClicks) {
            document.addEventListener('click', (e) => {
                this.addEvent('click', {
                    x: e.clientX,
                    y: e.clientY,
                    target: this.getElementSelector(e.target),
                    timestamp: Date.now()
                });
            });
        }

        // Scrolls
        if (this.options.recordScrolls) {
            window.addEventListener('scroll', () => {
                this.addEvent('scroll', {
                    x: window.scrollX,
                    y: window.scrollY,
                    timestamp: Date.now()
                });
            });
        }

        // Input events
        if (this.options.recordInputs) {
            document.addEventListener('input', (e) => {
                const input = e.target;
                const isPassword = input.type === 'password';
                
                this.addEvent('input', {
                    target: this.getElementSelector(input),
                    value: isPassword ? '*****' : input.value,
                    inputType: input.type,
                    timestamp: Date.now()
                });
            });
        }

        // Form submissions
        document.addEventListener('submit', (e) => {
            this.addEvent('form_submit', {
                target: this.getElementSelector(e.target),
                action: e.target.action,
                timestamp: Date.now()
            });
        });

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.addEvent('visibility_change', {
                hidden: document.hidden,
                timestamp: Date.now()
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.addEvent('resize', {
                width: window.innerWidth,
                height: window.innerHeight,
                timestamp: Date.now()
            });
        });

        // Errors
        if (this.options.recordErrors) {
            window.addEventListener('error', (e) => {
                this.addEvent('error', {
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    stack: e.error ? e.error.stack : null,
                    timestamp: Date.now()
                });
            });

            window.addEventListener('unhandledrejection', (e) => {
                this.addEvent('unhandled_rejection', {
                    reason: e.reason,
                    timestamp: Date.now()
                });
            });
        }
    }

    setupConsoleOverride() {
        if (!this.options.recordConsoleLogs) return;

        const self = this;
        const consoleMethods = ['log', 'warn', 'error', 'info', 'debug'];

        consoleMethods.forEach(method => {
            this.originalConsole[method] = console[method];
            console[method] = function(...args) {
                // Call original method
                self.originalConsole[method].apply(console, args);

                // Record the console call
                self.addEvent('console', {
                    method,
                    args: args.map(arg => {
                        if (typeof arg === 'object') {
                            try {
                                return JSON.stringify(arg);
                            } catch (e) {
                                return '[Object]';
                            }
                        }
                        return String(arg);
                    }),
                    timestamp: Date.now()
                });
            };
        });
    }

    setupNetworkOverride() {
        if (!this.options.recordNetworkRequests) return;

        const self = this;

        // Override fetch
        window.fetch = function(...args) {
            const url = args[0];
            const options = args[1] || {};
            const startTime = Date.now();

            return self.originalFetch.apply(this, args)
                .then(response => {
                    const endTime = Date.now();
                    self.addEvent('network_request', {
                        url: typeof url === 'string' ? url : url.url,
                        method: options.method || 'GET',
                        status: response.status,
                        statusText: response.statusText,
                        duration: endTime - startTime,
                        success: response.ok,
                        timestamp: startTime
                    });
                    return response;
                })
                .catch(error => {
                    const endTime = Date.now();
                    self.addEvent('network_request', {
                        url: typeof url === 'string' ? url : url.url,
                        method: options.method || 'GET',
                        error: error.message,
                        duration: endTime - startTime,
                        success: false,
                        timestamp: startTime
                    });
                    throw error;
                });
        };

        // Override XMLHttpRequest
        const originalXHROpen = this.originalXHR.prototype.open;
        const originalXHRSend = this.originalXHR.prototype.send;

        this.originalXHR.prototype.open = function(method, url, ...args) {
            this._replayMethod = method;
            this._replayUrl = url;
            this._replayStartTime = Date.now();
            return originalXHROpen.apply(this, [method, url, ...args]);
        };

        this.originalXHR.prototype.send = function(body) {
            const startTime = this._replayStartTime;
            const self = this;

            const originalOnReadyStateChange = this.onreadystatechange;
            this.onreadystatechange = function() {
                if (this.readyState === 4) {
                    const endTime = Date.now();
                    window.nexusSessionReplay.addEvent('network_request', {
                        url: self._replayUrl,
                        method: self._replayMethod,
                        status: this.status,
                        statusText: this.statusText,
                        duration: endTime - startTime,
                        success: this.status >= 200 && this.status < 400,
                        timestamp: startTime
                    });
                }
                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(this, arguments);
                }
            };

            return originalXHRSend.apply(this, arguments);
        };
    }

    getElementSelector(element) {
        if (!element) return 'unknown';
        
        // Try to get a unique selector
        if (element.id) {
            return `#${element.id}`;
        }
        
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
                return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
            }
        }
        
        // Use tag name and position
        let selector = element.tagName.toLowerCase();
        if (element.parentElement) {
            const siblings = Array.from(element.parentElement.children);
            const index = siblings.indexOf(element);
            if (index > 0) {
                selector += `:nth-child(${index + 1})`;
            }
        }
        
        return selector;
    }

    addEvent(type, data) {
        if (!this.isRecording) return;

        const event = {
            id: this.generateEventId(),
            type,
            data,
            timestamp: data.timestamp || Date.now()
        };

        this.events.push(event);

        // Maintain event limit
        if (this.events.length > this.options.maxEvents) {
            this.events = this.events.slice(-this.options.maxEvents);
        }

        // Check session length
        if (Date.now() - this.startTime > this.options.maxSessionLength) {
            this.stopRecording();
        }
    }

    generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    startRecording() {
        // Add initial session event
        this.addEvent('session_start', {
            url: window.location.href,
            userAgent: navigator.userAgent,
            screen: {
                width: screen.width,
                height: screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: this.startTime
        });

        // Periodic status updates
        this.recordingInterval = setInterval(() => {
            this.addEvent('status_update', {
                eventsCount: this.events.length,
                duration: Date.now() - this.startTime
            });
        }, 30000); // Every 30 seconds
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;
        
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
        }

        // Add session end event
        this.addEvent('session_end', {
            finalEventCount: this.events.length,
            totalDuration: Date.now() - this.startTime,
            timestamp: Date.now()
        });

        // Send session data to server
        this.sendSessionData();

        // Restore original console
        if (this.options.recordConsoleLogs) {
            Object.keys(this.originalConsole).forEach(method => {
                console[method] = this.originalConsole[method];
            });
        }
    }

    getSessionData() {
        return {
            sessionId: this.sessionId,
            startTime: this.startTime,
            endTime: Date.now(),
            duration: Date.now() - this.startTime,
            events: this.events,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        };
    }

    async sendSessionData() {
        try {
            const sessionData = this.getSessionData();
            
            // Send to server
            await fetch('/api/monitoring/session-replay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });
        } catch (error) {
            console.error('Failed to send session replay data:', error);
        }
    }

    // Replay functionality
    replay(sessionData, options = {}) {
        const replayOptions = {
            speed: options.speed || 1.0,
            showCursor: options.showCursor !== false,
            highlightClicks: options.highlightClicks !== false,
            autoPlay: options.autoPlay !== false,
            ...options
        };

        return new SessionReplayPlayer(sessionData, replayOptions);
    }
}

class SessionReplayPlayer {
    constructor(sessionData, options) {
        this.sessionData = sessionData;
        this.options = options;
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playbackSpeed = options.speed;
        this.startTime = null;
        this.callbacks = {};

        this.setupPlayer();
    }

    setupPlayer() {
        // Create replay UI
        this.createReplayUI();
        
        // Sort events by timestamp
        this.sessionData.events.sort((a, b) => a.timestamp - b.timestamp);
    }

    createReplayUI() {
        // Create replay container
        this.replayContainer = document.createElement('div');
        this.replayContainer.id = 'nexus-session-replay-container';
        this.replayContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 999999;
            display: none;
        `;

        // Create controls
        this.createControls();

        // Create cursor
        if (this.options.showCursor) {
            this.createCursor();
        }

        document.body.appendChild(this.replayContainer);
    }

    createControls() {
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 10px;
            border-radius: 5px;
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 1000000;
        `;

        controls.innerHTML = `
            <button id="replay-play">Play</button>
            <button id="replay-pause">Pause</button>
            <button id="replay-stop">Stop</button>
            <input type="range" id="replay-progress" min="0" max="100" value="0" style="width: 200px;">
            <span id="replay-time">0:00 / 0:00</span>
            <button id="replay-close">Close</button>
        `;

        this.replayContainer.appendChild(controls);

        // Setup control handlers
        document.getElementById('replay-play').addEventListener('click', () => this.play());
        document.getElementById('replay-pause').addEventListener('click', () => this.pause());
        document.getElementById('replay-stop').addEventListener('click', () => this.stop());
        document.getElementById('replay-close').addEventListener('click', () => this.close());
    }

    createCursor() {
        this.cursor = document.createElement('div');
        this.cursor.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M0,0 L0,16 L4,12 L8,16 L12,8 L20,16 L20,0 Z" fill="black"/></svg>') no-repeat;
            pointer-events: none;
            z-index: 999998;
            display: none;
        `;

        this.replayContainer.appendChild(this.cursor);
    }

    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.startTime = Date.now() - (this.sessionData.events[this.currentIndex]?.timestamp || 0);
        
        this.playLoop();
    }

    pause() {
        this.isPlaying = false;
    }

    stop() {
        this.isPlaying = false;
        this.currentIndex = 0;
        this.startTime = null;
        this.updateProgress();
    }

    close() {
        this.stop();
        this.replayContainer.style.display = 'none';
    }

    playLoop() {
        if (!this.isPlaying) return;

        const currentTime = (Date.now() - this.startTime) * this.playbackSpeed;
        
        while (this.currentIndex < this.sessionData.events.length && 
               this.sessionData.events[this.currentIndex].timestamp <= currentTime) {
            
            this.executeEvent(this.sessionData.events[this.currentIndex]);
            this.currentIndex++;
        }

        this.updateProgress();

        if (this.currentIndex < this.sessionData.events.length) {
            requestAnimationFrame(() => this.playLoop());
        } else {
            this.stop();
        }
    }

    executeEvent(event) {
        switch (event.type) {
            case 'mousemove':
                if (this.cursor) {
                    this.cursor.style.left = event.data.x + 'px';
                    this.cursor.style.top = event.data.y + 'px';
                    this.cursor.style.display = 'block';
                }
                break;

            case 'click':
                if (this.options.highlightClicks) {
                    this.highlightClick(event.data.x, event.data.y);
                }
                break;

            case 'scroll':
                window.scrollTo(event.data.x, event.data.y);
                break;

            case 'input':
                const input = document.querySelector(event.data.target);
                if (input && input.value !== event.data.value) {
                    input.value = event.data.value;
                }
                break;

            case 'resize':
                // Note: Can't actually resize window in replay
                break;

            case 'console':
                this.originalConsole[event.data.method](...event.data.args);
                break;

            case 'error':
                console.error('Replayed Error:', event.data.message);
                break;
        }

        // Trigger callback if exists
        if (this.callbacks[event.type]) {
            this.callbacks[event.type](event);
        }
    }

    highlightClick(x, y) {
        const highlight = document.createElement('div');
        highlight.style.cssText = `
            position: absolute;
            left: ${x - 10}px;
            top: ${y - 10}px;
            width: 20px;
            height: 20px;
            border: 2px solid red;
            border-radius: 50%;
            pointer-events: none;
            z-index: 999999;
            animation: pulse 0.5s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;

        document.head.appendChild(style);
        this.replayContainer.appendChild(highlight);

        setTimeout(() => {
            highlight.remove();
            style.remove();
        }, 500);
    }

    updateProgress() {
        const progress = this.currentIndex / this.sessionData.events.length * 100;
        const progressBar = document.getElementById('replay-progress');
        const timeDisplay = document.getElementById('replay-time');

        if (progressBar) {
            progressBar.value = progress;
        }

        if (timeDisplay) {
            const current = this.formatTime(this.sessionData.events[this.currentIndex]?.timestamp || 0);
            const total = this.formatTime(this.sessionData.duration);
            timeDisplay.textContent = `${current} / ${total}`;
        }
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    show() {
        this.replayContainer.style.display = 'block';
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }
}

// Initialize session replay
window.nexusSessionReplay = new SessionReplay({
    sampleRate: 0.1, // Sample 10% of sessions
    maxEvents: 5000,
    recordMouseMovements: true,
    recordClicks: true,
    recordScrolls: true,
    recordInputs: true,
    recordNetworkRequests: true,
    recordConsoleLogs: true,
    recordErrors: true
});

// Auto-stop when page unloads
window.addEventListener('beforeunload', () => {
    window.nexusSessionReplay.stopRecording();
});

// Export for external access
window.NexusSessionReplay = SessionReplay;
