// Jest setup file
import dotenv from 'dotenv'

// Load environment variables for testing
dotenv.config({ path: '.env.test' })

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/expense_splitter_test?schema=public'
