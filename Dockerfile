FROM node:22-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/index.html frontend/landing.html frontend/vite.config.js ./
COPY frontend/src ./src
COPY frontend/public ./public
ENV VITE_AUTH_API_URL=/ VITE_API_BASE_URL=/api VITE_AUTH_PREVIEW_ENABLED=false
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /build/backend
COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=frontend /build/frontend/dist ./src/main/resources/static
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /build/backend/target/edgemart-backend-0.0.1-SNAPSHOT.jar app.jar
ENV SESSION_COOKIE_SECURE=true SESSION_COOKIE_SAME_SITE=lax JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=55.0"
USER 10001
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
