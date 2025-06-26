# Text Analyzer API [![codecov](https://codecov.io/gh/arifmahmudrana/node-text-analyzer/branch/main/graph/badge.svg)](https://codecov.io/gh/arifmahmudrana/node-text-analyzer) [![Security](https://img.shields.io/github/actions/workflow/status/arifmahmudrana/node-text-analyzer/ci-cd.yml?branch=main&label=Tests%20and%20Scans&logo=github)](https://github.com/arifmahmudrana/node-text-analyzer/security/code-scanning)

A robust Node.js/TypeScript API for analyzing text content with asynchronous processing and comprehensive monitoring capabilities.

## Features

- **Text Analysis**: Automatically analyzes text for word count, character count, sentences, paragraphs, and longest words per paragraph
- **Asynchronous Processing**: Uses event-driven architecture for non-blocking text analysis
- **MongoDB Integration**: Persistent storage with Mongoose ODM
- **Comprehensive API**: RESTful endpoints with proper validation and error handling
- **Pagination Support**: Configurable pagination for listing texts
- **Log Monitoring**: Integrated Grafana + Loki + Promtail stack for log visualization
- **TypeScript**: Fully typed codebase for better development experience
- **Docker Support**: Complete containerized setup for monitoring stack

## Project Architecture

### Core Components

```
src/
├── app.ts                    # Express application setup
├── server.ts                 # Server entry point with database connection
├── config/
│   ├── config.ts            # Application configuration
│   └── database.ts          # MongoDB connection setup
├── controllers/
│   └── textController.ts    # Text CRUD operations
├── routes/
│   └── textRoutes.ts        # API route definitions
├── models/
│   └── Text.ts              # MongoDB schema definition
├── middlewares/
│   ├── errorHandler.ts      # Global error handling
│   ├── pagination.ts        # Pagination middleware
│   └── validation.ts        # Request validation middleware
├── events/
│   └── textProcessor.ts     # Asynchronous text processing
├── helpers/
│   └── text.ts              # Text analysis utilities
├── validations/
│   └── textValidation.ts    # Joi validation schemas
└── types/
    ├── index.ts             # Main TypeScript type definitions
    └── pagination.ts        # Pagination-specific types

```

### Technology Stack

- **Runtime**: Node.js 22+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Validation**: Joi
- **Testing**: Jest
- **Monitoring**: Grafana + Loki + Promtail
- **Process Management**: Event-driven architecture

## Getting Started

### Prerequisites

- Node.js 22 or higher
- MongoDB running locally or remote connection
- Docker and Docker Compose (for monitoring stack)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arifmahmudrana/node-text-analyzer.git
   cd node-text-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/textapi
   ```

### Running the Application

#### Development Mode
```bash
# Run with auto-reload
npm run dev

# Run with logging
npm run dev:log
```

#### Production Mode
```bash
# Build and run
npm run build
npm start

# Run with logging
npm run start:log

# Production with environment variable
npm run start:prod
```

### Monitoring Stack (Optional)

Start the complete monitoring stack with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- **Loki**: Log aggregation service (port 3100)
- **Grafana**: Log visualization dashboard (port 3001)
- **Promtail**: Log collector

Access Grafana at `http://localhost:3001` (no authentication required in development).

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check

#### GET /health
Check API status and environment information.

**Response:**
```json
{
  "success": true,
  "message": "API is running successfully",
  "data": {
    "timestamp": "2025-06-02T10:30:00.000Z",
    "environment": "development"
  }
}
```

### Text Operations

#### POST /api/texts
Create a new text for analysis.

**Request Body:**
```json
{
  "text": "Your text content here. This can be multiple paragraphs with various sentences."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Text created successfully",
  "data": {
    "_id": "60d5f484f1b2c8b1f8e4e1a1",
    "text": "Your text content here...",
    "done": false,
    "numberOfWords": 0,
    "numberOfCharacters": 0,
    "numberOfSentences": 0,
    "numberOfParagraphs": 0,
    "longestWordsInParagraphs": [],
    "createdAt": "2025-06-02T10:30:00.000Z",
    "updatedAt": "2025-06-02T10:30:00.000Z"
  }
}
```

**Note**: The text analysis runs asynchronously. The `done` field will be `false` initially and `true` once processing is complete.

#### GET /api/texts/:id
Retrieve a specific text by ID (only returns completed analyses).

**Parameters:**
- `id` (string): MongoDB ObjectId of the text

**Response:**
```json
{
  "success": true,
  "message": "Text retrieved successfully",
  "data": {
    "_id": "60d5f484f1b2c8b1f8e4e1a1",
    "text": "Your text content here...",
    "done": true,
    "numberOfWords": 45,
    "numberOfCharacters": 234,
    "numberOfSentences": 3,
    "numberOfParagraphs": 2,
    "longestWordsInParagraphs": ["paragraph", "sentences"],
    "createdAt": "2025-06-02T10:30:00.000Z",
    "updatedAt": "2025-06-02T10:30:15.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Text not found"
}
```

#### GET /api/texts
List texts with pagination and filtering.

**Query Parameters:**
- `done` (optional): Filter by processing status
  - `true`: Only completed analyses
  - `false`: Only pending analyses  
  - `all`: All texts (default)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `order` (optional): Sort order - `asc` or `desc` (default: desc)
- `orderBy` (optional): Sort field - `createdAt` or `updatedAt` (default: createdAt)

**Example Requests:**
```bash
# Get all texts (first page)
GET /api/texts

# Get completed texts only
GET /api/texts?done=true

# Get second page with 20 items
GET /api/texts?page=2&limit=20

# Get texts ordered by update time (ascending)
GET /api/texts?orderBy=updatedAt&order=asc

# Combined filters
GET /api/texts?done=true&page=1&limit=50&orderBy=createdAt&order=desc
```

**Response:**
```json
{
  "success": true,
  "message": "Texts retrieved successfully",
  "data": [
    {
      "_id": "60d5f484f1b2c8b1f8e4e1a1",
      "text": "Sample text...",
      "done": true,
      "numberOfWords": 45,
      "numberOfCharacters": 234,
      "numberOfSentences": 3,
      "numberOfParagraphs": 2,
      "longestWordsInParagraphs": ["paragraph", "sentences"],
      "createdAt": "2025-06-02T10:30:00.000Z",
      "updatedAt": "2025-06-02T10:30:15.000Z"
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Text Analysis Details

The API analyzes text content and provides the following metrics:

- **numberOfWords**: Total word count (splits on whitespace)
- **numberOfCharacters**: Total character count including spaces
- **numberOfSentences**: Count of sentences (splits on `.`, `!`, `?`)
- **numberOfParagraphs**: Count of paragraphs (splits on double newlines)
- **longestWordsInParagraphs**: Array of longest words from each paragraph

### Analysis Process

1. Text is saved immediately with `done: false`
2. Asynchronous event is triggered for processing
3. Text analysis runs in the background
4. Document is updated with results and `done: true`
5. Completed analysis is available via API

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm run dev:log          # Start with logging

# Production
npm run build            # Compile TypeScript
npm start                # Start compiled server
npm run start:log        # Start with logging
npm run start:prod       # Production with logging

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Run ESLint
```

### VS Code Debugging

The project includes VS Code launch configurations:

1. **Debug Server (ts-node)**: Debug the main server
2. **Debug Jest Tests**: Debug all tests
3. **Jest Current File**: Debug current test file

### Project Structure Details

#### Configuration (`src/config/`)
- `config.ts`: Centralized configuration management
- `database.ts`: MongoDB connection with error handling

#### Models (`src/models/`)
- `Text.ts`: Mongoose schema for text documents

#### Controllers (`src/controllers/`)
- `textController.ts`: Business logic for text operations

#### Middlewares (`src/middlewares/`)
- `errorHandler.ts`: Global error handling
- `pagination.ts`: Reusable pagination logic
- `validation.ts`: Request validation middleware using Joi schemas

#### Events (`src/events/`)
- `textProcessor.ts`: Event-driven text analysis processor

#### Helpers (`src/helpers/`)
- `text.ts`: Pure functions for text analysis

#### Validations (`src/validations/`)
- `textValidation.ts`: Joi schemas for request validation including `createTextSchema`

#### Types (`src/types/`)
- `index.ts`: Main TypeScript type definitions
- `pagination.ts`: Pagination-specific type definitions

## Log Monitoring

### Grafana Dashboard

1. Start monitoring stack: `docker-compose up --build`
2. Access Grafana: `http://localhost:3001`
3. Loki datasource is pre-configured
4. View application logs in real-time

### Log Locations

- Development logs: `logs/app-dev.log`
- Production logs: `logs/app-prod.log`

## Error Handling

The API includes error handling:

- **Validation Errors**: Proper validation with Joi
- **Database Errors**: MongoDB connection and query errors
- **Not Found**: 404 responses for missing resources
- **Server Errors**: 500 responses with error details
- **Graceful Shutdown**: Proper cleanup on process termination

## Performance Considerations

- **Asynchronous Processing**: Text analysis doesn't block API responses
- **Database Indexes**: Optimized queries with proper indexing
- **Lean Queries**: Using `lean()` for better performance
- **Pagination**: Efficient data retrieval with limits
- **Event-driven Architecture**: Non-blocking processing pipeline

## Environment Variables

```env
PORT=3000                                    # Server port
NODE_ENV=development                         # Environment (development/production)
MONGODB_URI=mongodb://localhost:27017/textapi  # MongoDB connection string e.g. mongodb://root:123@localhost:27027/textapi?authSource=admin here root is username 123 is password and authSource admin set for authentication
```

## Testing

Run the test suite:

```bash
npm test
```

The project uses Jest for testing with configurations for:
- Unit tests for individual functions
- Mocking for external dependencies

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Run linting: `npm run lint`
7. Commit changes: `git commit -am 'Add feature'`
8. Push to branch: `git push origin feature-name`
9. Submit a pull request

## License

BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/arifmahmudrana/node-text-analyzer/issues)
- Check existing documentation
- Review the code examples above

---

**Happy analyzing! 📊📝**
