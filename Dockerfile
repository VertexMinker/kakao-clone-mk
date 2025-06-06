# ---- Builder Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build
# At this point, /app/dist should contain the compiled JavaScript

# ---- Production Stage ----
FROM node:18-alpine

WORKDIR /app

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S -G appgroup appuser

# Copy only necessary files from builder stage and production dependencies

# Copy package.json and package-lock.json for installing production dependencies
COPY package.json package-lock.json ./
# Or, if only package.json is needed for npm install --production:
# COPY --from=builder /app/package.json ./

# Install production dependencies
# Using npm ci --omit=dev which is preferred if package-lock.json is present and accurate
RUN npm ci --omit=dev
# Alternatively, for older npm versions or different behavior:
# RUN npm install --production

# Copy compiled application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema for runtime needs (e.g., if client needs to know schema path)
# The generated client should already be in node_modules from `npm ci --omit=dev`
# if @prisma/client is a production dependency.
# However, it's good practice to have the schema if any runtime generation/lookup happens.
COPY --from=builder /app/prisma ./prisma

# It's important that Prisma Client (generated in node_modules/.prisma/client)
# is available. If `npm ci --omit=dev` correctly installs `@prisma/client`
# and the generate step in the builder stage makes the client available via `dist`
# (e.g. if it's copied into dist, or if node_modules are structured to include it),
# then an explicit `npx prisma generate` might not be needed here.
# However, if the client is generated into the local node_modules of the builder,
# and we are installing fresh prod node_modules here, we might need to run generate again.
# Let's assume for now that the client is correctly installed with prod deps,
# or that the build process correctly bundles it.
# If issues arise, uncomment and run:
# RUN npx prisma generate

# Change ownership of the app directory to the new user
# This might be needed if subsequent operations require write access or for security.
# For running the app, read access is usually sufficient for /app.
# If node_modules or other parts are written at runtime by appuser, this is more critical.
# RUN chown -R appuser:appgroup /app
# For now, assuming USER appuser has sufficient permissions for copied files.

# Switch to the non-root user
USER appuser

# Expose the application port
EXPOSE 3001
# If PORT is set via .env file, Dockerfile ARG, or docker-compose environment,
# you might use: EXPOSE ${PORT} after declaring ARG PORT

# Command to run the application
# Adjust the path if your build process outputs to a different subdirectory within dist
CMD ["node", "dist/server/index.js"]
