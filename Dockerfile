FROM node:22-alpine AS build

WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.29-alpine
ARG BACKEND_UPSTREAM=backend:5000
COPY --from=build /app/dist /usr/share/nginx/html

RUN sed "s|__BACKEND_UPSTREAM__|${BACKEND_UPSTREAM}|g" > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 3000;
    server_name _;

    location /api/ {
        proxy_pass http://__BACKEND_UPSTREAM__/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
NGINX

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
