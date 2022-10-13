FROM node:14-alpine3.11
RUN mkdir /app && cd /app
WORKDIR /app
COPY . /app 
RUN npm install
ENTRYPOINT [ "node", "basicAPI.js"]