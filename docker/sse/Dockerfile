# Use Node.js 16 as the base image
FROM node:16

# Set workdir
WORKDIR /app

# Global install of @standby/mcp-server-chart
RUN npm install -g @standby/mcp-server-chart

# Start the server (using streamable for transmission)
CMD ["mcp-server-chart", "--transport", "sse", "--port", "1123"]