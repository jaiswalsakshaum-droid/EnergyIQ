FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV VITE_API_URL=http://localhost:8000
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/dist ./dist 2>/dev/null || true

EXPOSE 3000 5173

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
