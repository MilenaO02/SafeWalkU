# Etapa 1: Construir la aplicación con Node.js
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:alpine
# Copiamos los archivos estáticos construidos
COPY --from=build /app/dist /usr/share/nginx/html
# Copiamos la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
