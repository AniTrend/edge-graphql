FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app
RUN chown node:node /app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node mesh.config.ts ./
COPY --chown=node:node gateway.config.ts ./
COPY --chown=node:node swagger-spec.json ./

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8800) + '/graphql?query=%7B__typename%7D').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
