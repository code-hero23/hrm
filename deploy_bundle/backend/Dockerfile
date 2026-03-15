# Use Node.js LTS
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose the port from our backend code
EXPOSE 5018

# Start the server
CMD [ "node", "index.js" ]
