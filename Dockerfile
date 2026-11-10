FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN npm run build:deploy

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node serve-production.mjs ./serve-production.mjs
USER node
EXPOSE 8080
CMD ["node", "serve-production.mjs"]
