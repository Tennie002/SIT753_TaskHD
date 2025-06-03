# --------------------------------------------------------------------------------
# Production Dockerfile
# --------------------------------------------------------------------------------

# 1) Start from Node 18 (Alpine flavor)
FROM node:18-alpine

# 2) Create and switch to /usr/src/app inside the container
WORKDIR /usr/src/app

# 3) Copy only package.json and package-lock.json (so Docker can cache deps)
COPY package*.json ./

# 4) Install ONLY production dependencies
RUN npm install --only=production

# 5) Ensure the non-root 'node' user owns /usr/src/app so SQLite can write its .db
RUN chown -R node:node /usr/src/app

# 6) Copy the rest of the application code (including index.js, views/, etc.)
COPY . .

# 7) Expose port 3000 (the port your Express app listens on)
EXPOSE 3000

# 8) Switch to the non-root 'node' user for security and permission reasons
USER node

# 9) Define the command to run your app when the container starts
CMD ["npm", "start"]
