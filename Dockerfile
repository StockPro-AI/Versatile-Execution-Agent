# Use Node.js LTS
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
