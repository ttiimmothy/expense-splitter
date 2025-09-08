FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

## shouldm't run the migration in the Dockerfile, Dockerfile is built before your containers (including Postgres) are running

# Expose port
EXPOSE 3001

# Start the application, separate is for running directly in a shell when typing (Docker behavior)
ENTRYPOINT ["npm", "start"]
