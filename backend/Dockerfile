# Use Node.js LTS
FROM node:20-slim

# Install build dependencies for native modules (like sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production --build-from-source sqlite3

# Bundle app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose the port from our backend code
EXPOSE 5018

# Start the server
CMD [ "node", "index.js" ]
