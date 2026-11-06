FROM node:22-alpine AS build

WORKDIR /app

COPY client/package*.json ./
RUN npm install --no-audit --no-fund

COPY client/ ./

ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
