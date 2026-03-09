FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 py3-pip tzdata \
  && pip3 install --no-cache-dir --break-system-packages yfinance

COPY package*.json ./
RUN npm install

COPY src ./src
COPY scripts ./scripts

EXPOSE 3000

CMD ["npm", "start"]
