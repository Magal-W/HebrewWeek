FROM node:lts-alpine as builder

WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --silent
COPY . .

RUN npm run build

FROM nginx

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
