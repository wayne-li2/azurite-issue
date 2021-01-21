FROM node:14-alpine

COPY . /app

CMD node /app/index.js
