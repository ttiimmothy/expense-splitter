# Expense Splitter

A full-stack application for splitting expenses with friends and family. Built with React, Node.js, TypeScript, and PostgreSQL.

## Features

- 🏠 **Group Management**: Create and manage expense groups
- 👥 **Member Invitations**: Invite friends to join your groups
- 💰 **Expense Tracking**: Add and track shared expenses
- ⚖️ **Smart Splitting**: Equal or custom amount splitting
- 📊 **Balance Visualization**: See who owes what with interactive charts
- 💸 **Settlement Suggestions**: Minimize transactions with smart settlement recommendations
- 🔄 **Real-time Updates**: Live updates using Socket.IO
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔐 **Secure Authentication**: JWT-based authentication with password hashing

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **Socket.IO** for real-time features
- **Zod** for input validation
- **Jest** for testing

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **Zustand** for state management
- **Recharts** for data visualization
- **Vitest** for testing

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### 1. Clone the repository
```bash
git clone https://github.com:ttiimmothy/expense-splitter
cd expense-splitter
```

### 2. For development

#### 1. Start the database
```bash
cd backend && docker compose up -d postgres
```

#### 2. Set up the backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and JWT secret
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

#### 3. Set up the frontend
```bash
cd frontend
npm install
cp .
# Edit .env with your API URL
npm run start
```

#### 4. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Database: localhost:5432
- PgAdmin: http://localhost:5050 (admin@example.com / admin)

## Demo Credentials

The application comes with seeded demo data. You can log in with:
- **Email**: alice@example.com (or bob@example.com, charlie@example.com)
- **Password**: any password (authentication is simplified for demo)

## Project Structure

```
expense_splitter/
├── backend/                  # Node.js API server and database layer
│   ├── docker-compose.yml    # Local dev services (Postgres, PgAdmin)
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/               # Prisma schema and migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── controllers/      # Route handlers
│       ├── services/         # Business logic
│       ├── middleware/       # Express middleware
│       ├── db/               # Prisma client
│       ├── types/
│       ├── __tests__/        # Backend tests
│       ├── index.ts          # App bootstrap
│       ├── routes.ts         # Route registration
│       └── io.ts             # Socket.IO setup
├── frontend/                 # React application
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── stores/           # Zustand stores
│   │   ├── lib/              # API client and sockets
│   │   ├── constants/
│   │   └── __tests__/        # Frontend tests
│   ├── vite.config.ts
│   └── vercel.json           # Deployment config (if used)
├── LICENSE
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/invite` - Invite member

### Expenses
- `POST /api/groups/:id/expenses` - Add expense
- `GET /api/groups/:id/expenses` - Get group expenses

### Settlements
- `GET /api/balances/:groupId` - Get group balances
- `POST /api/groups/:id/settlements` - Record settlement
- `GET /api/groups/:id/settlements` - Get settlements

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# All tests
npm test
```

### Linting
```bash
# Backend linting
cd backend
npm run lint

# Frontend linting
cd frontend
npm run lint

# All linting
npm run lint
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Seed database
npm run prisma:seed
```

## Docker Deployment

### Build and run with Docker Compose
```bash
cd backend

# Build all services
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

### Individual Docker builds
```bash
# Backend
cd backend
docker build -t backend .
```
## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/expense_splitter?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3001
CLIENT_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"
```
### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with modern web technologies
- Inspired by popular expense splitting apps
- Designed for simplicity and ease of use
