FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/edgemart-backend-0.0.1-SNAPSHOT.jar app.jar
ENV LOCAL_EMAIL_INBOX=false SESSION_COOKIE_SECURE=true
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
