# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Nginx stage
FROM nginx:alpine
# Copy the built React app to Nginx's web folder
COPY --from=build /app/dist /usr/share/nginx/html
# Copy your custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
