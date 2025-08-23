# Use Node.js 18 Alpine for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the entire project (including pre-built files)
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
