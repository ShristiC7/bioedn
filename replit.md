# BioDiversity Analytics Platform

## Overview

This is a production-ready biodiversity analytics platform that processes environmental DNA (eDNA) datasets to provide real-time biodiversity monitoring and predictive analytics. The platform enables researchers and citizen scientists to upload genomic samples, analyze species diversity, track endangered and invasive species, and generate predictive models for biodiversity trends.

The platform combines modern web technologies with AI/ML capabilities to deliver comprehensive biodiversity insights through interactive mapping, alert systems, and community engagement features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and building
- **UI Components**: Radix UI primitives with shadcn/ui component system for consistent design
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Build System**: Vite with path aliases for clean imports (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with organized route handlers
- **Real-time Communication**: WebSocket server for live updates and notifications
- **File Processing**: Multer for file uploads with support for genomic data formats (.tar.gz, .fasta, .fastq)
- **Background Processing**: Service-based architecture for file processing and ML operations

### Database & ORM
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Management**: Centralized schema in shared directory for type consistency
- **Connection**: Connection pooling with @neondatabase/serverless

### Data Processing Pipeline
- **File Formats**: Support for compressed genomic data (.tar.gz, .fasta, .fastq, .gz)
- **Processing**: Python scripts for bioinformatics analysis using BioPython
- **Quality Control**: Sequence quality filtering and validation
- **Species Detection**: Automated species identification from DNA sequences

### Authentication & Security
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **File Security**: File type validation and size limits (100MB)
- **Input Validation**: Zod schemas for runtime type checking

### External Integrations
- **Species Data**: IUCN Red List API integration for conservation status
- **Mapping**: Support for interactive mapping libraries (Leaflet/Mapbox/Google Maps)
- **Notifications**: Email and SMS alert capabilities for species detections

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration tools
- **express**: Web application framework
- **multer**: File upload handling
- **ws**: WebSocket server implementation

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Processing Dependencies
- **BioPython**: Python library for bioinformatics (server/python/)
- **connect-pg-simple**: PostgreSQL session store
- **zod**: Runtime type validation

### Development Dependencies
- **tsx**: TypeScript execution for development
- **vite**: Build tool and development server
- **esbuild**: Fast JavaScript bundler for production builds

### Potential Future Dependencies
- **Machine Learning**: TensorFlow.js or PyTorch for predictive analytics
- **Mapping**: Leaflet, Mapbox GL JS, or Google Maps API
- **Notifications**: SendGrid, Twilio, or similar services
- **Authentication**: Auth0, Firebase Auth, or custom JWT implementation