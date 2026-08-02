# Builds the Expo static web export and serves it with Caddy.
# Used by the Railway `medq-web` service (production environment).
#
# EXPO_PUBLIC_* values are baked into the JS bundle at BUILD time — Railway
# passes service variables to Docker builds as build args, so each must be
# declared as an ARG and exported to ENV before `expo export` runs.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG EXPO_PUBLIC_ENV
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_WEB_URL
ARG EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
ARG EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
ARG EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY
ARG EXPO_PUBLIC_ENABLE_OTP_LOGIN
ENV EXPO_PUBLIC_ENV=$EXPO_PUBLIC_ENV \
    EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_WEB_URL=$EXPO_PUBLIC_WEB_URL \
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID \
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=$EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID \
    EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=$EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY \
    EXPO_PUBLIC_ENABLE_OTP_LOGIN=$EXPO_PUBLIC_ENABLE_OTP_LOGIN

RUN npm run build:web

FROM node:22-alpine
COPY scripts/serve-web.mjs /serve-web.mjs
COPY --from=build /app/dist /srv
EXPOSE 8080
CMD ["node", "/serve-web.mjs"]
