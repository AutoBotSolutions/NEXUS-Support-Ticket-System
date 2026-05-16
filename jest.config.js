module.exports = {
  "testEnvironment": "node",
  "setupFilesAfterEnv": [
    "<rootDir>/test/setup-isolated.js"
  ],
  "collectCoverageFrom": [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "routes/**/*.js",
    "services/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/test/**",
    "!**/debug*.js",
    "!**/test-*.js",
    "!**/setup*.js"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html",
    "json",
    "clover"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "./controllers/": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "./models/": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "./middleware/": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "testTimeout": 30000,
  "verbose": true,
  "roots": [
    "<rootDir>/test"
  ],
  "testMatch": [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/coverage/",
    "/debug-*.js",
    "/test-*.js"
  ],
  "transform": {
    "^.+\\.js$": "babel-jest"
  },
  "projects": [
    {
      "displayName": "Unit Tests",
      "testMatch": [
        "<rootDir>/test/unit/**/*.test.js"
      ],
      "setupFilesAfterEnv": [
        "<rootDir>/test/setup-isolated.js"
      ]
    },
    {
      "displayName": "Integration Tests",
      "testMatch": [
        "<rootDir>/test/integration/**/*.test.js"
      ],
      "setupFilesAfterEnv": [
        "<rootDir>/test/setup-isolated.js"
      ]
    },
    {
      "displayName": "E2E Tests",
      "testMatch": [
        "<rootDir>/test/e2e/**/*.test.js"
      ],
      "setupFilesAfterEnv": [
        "<rootDir>/test/setup-isolated.js"
      ]
    },
    {
      "displayName": "Performance Tests",
      "testMatch": [
        "<rootDir>/test/performance/**/*.test.js"
      ],
      "setupFilesAfterEnv": [
        "<rootDir>/test/setup-isolated.js"
      ]
    },
    {
      "displayName": "Security Tests",
      "testMatch": [
        "<rootDir>/test/security/**/*.test.js"
      ],
      "setupFilesAfterEnv": [
        "<rootDir>/test/setup-isolated.js"
      ]
    }
  ]
};