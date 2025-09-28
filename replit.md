# Overview

This is a schedule management application called "Alliboard" built with React, Express.js, and PostgreSQL. The application allows users to manage students, aides, activities, and schedule blocks in a drag-and-drop interface. It features a master schedule view, individual student/aide views, conflict detection, template management, and print functionality for schedules.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Drag & Drop**: react-beautiful-dnd for schedule block manipulation
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Server**: Express.js with TypeScript running in ESM mode
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Custom logging, error handling, and request parsing
- **Development**: Hot module replacement with Vite integration
- **Storage**: Abstracted storage interface with in-memory implementation

## Data Layer
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Schema**: Five main entities - students, aides, activities, blocks, and templates
- **Validation**: Zod schemas for runtime type validation
- **Migrations**: Drizzle Kit for database schema management

## Key Features
- **Schedule Management**: Time-based grid layout with drag-and-drop functionality
- **Conflict Detection**: Real-time detection of scheduling conflicts for students and aides
- **Multiple View Modes**: Master view, individual student view, and individual aide view
- **Template System**: Save and load schedule templates with local storage fallback
- **Print Support**: Dedicated print view with optimized layout
- **Entity Management**: CRUD operations for students, aides, and activities with color coding

## Time Management
- **Time Slots**: 8 AM to 4 PM default range with 64px per hour grid
- **Time Utilities**: Helper functions for time conversion, formatting, and position calculations
- **Date Handling**: ISO date strings for consistency across client and server

# External Dependencies

## UI and Styling
- **@radix-ui/***: Accessible UI primitives for components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Icon library

## Data and State Management
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form handling and validation
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation and schema definition

## Database and ORM
- **drizzle-orm**: Type-safe SQL query builder
- **drizzle-kit**: Database migration and schema management tools
- **@neondatabase/serverless**: Serverless PostgreSQL driver

## Development Tools
- **vite**: Fast development server and build tool
- **typescript**: Static type checking
- **@replit/vite-plugin-***: Replit-specific development plugins

## Drag and Drop
- **react-beautiful-dnd**: Accessible drag and drop functionality

## Date and Time
- **date-fns**: Modern date utility library

## Utilities
- **nanoid**: URL-safe unique ID generator
- **clsx**: Conditional CSS class utility
- **cmdk**: Command menu component