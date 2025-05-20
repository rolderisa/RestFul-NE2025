# Parking Management System - Microservices Architecture

A comprehensive car parking management system built with Node.js, TypeScript, Prisma, and PostgreSQL, following a microservices architecture.

## Features

- User authentication and authorization with JWT
- Parking space management with real-time availability tracking
- Vehicle entry/exit tracking with automated billing
- Comprehensive reporting system
- Email notifications for important events

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer

## Project Structure

The project follows a microservices architecture with the following components:

- **User Service**: Handles user registration, authentication, and profile management
- **Parking Service**: Manages parking locations, spaces, and availability
- **Vehicle Service**: Tracks vehicle entries/exits and calculates bills
- **Report Service**: Generates various reports for business analysis

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/parking-management.git
   cd parking-management
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the following variables:
   ```
   PORT=3000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parking_management"
   JWT_SECRET="your-jwt-secret-key-here"
   JWT_EXPIRES_IN="24h"
   EMAIL_HOST="smtp.example.com"
   EMAIL_PORT=587
   EMAIL_USER="your-email@example.com"
   EMAIL_PASS="your-email-password"
   EMAIL_FROM="no-reply@parking-management.com"
   ```

4. Set up the database:
   ```
   npm run migrate
   npm run seed
   ```

5. Start the server:
   ```
   npm run dev
   ```

6. Access the API documentation:
   ```
   http://localhost:3000/api-docs
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login and get JWT token
- GET `/api/auth/profile` - Get user profile

### Users
- GET `/api/users` - Get all users (admin only)
- GET `/api/users/:id` - Get user by ID
- PUT `/api/users/:id` - Update user (admin only)
- PUT `/api/users/:id/change-password` - Change user password
- DELETE `/api/users/:id` - Delete user (admin only)

### Parkings
- POST `/api/parkings` - Create a new parking (admin only)
- GET `/api/parkings` - Get all parkings
- GET `/api/parkings/available` - Get parkings with available spaces
- GET `/api/parkings/:code` - Get parking by code
- PUT `/api/parkings/:code` - Update parking (admin only)
- DELETE `/api/parkings/:code` - Delete parking (admin only)

### Entries
- POST `/api/entries` - Register a vehicle entry
- GET `/api/entries` - Get all entries
- GET `/api/entries/active` - Get active entries
- GET `/api/entries/:id` - Get entry by ID
- PUT `/api/entries/:id/exit` - Register vehicle exit

### Reports
- GET `/api/reports/outgoing` - Get report of outgoing cars in a date range
- GET `/api/reports/incoming` - Get report of incoming cars in a date range
- GET `/api/reports/occupancy` - Get parking occupancy report
- GET `/api/reports/revenue` - Get revenue report

## License

This project is licensed under the MIT License.