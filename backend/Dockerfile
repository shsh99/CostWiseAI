FROM gradle:8.10.2-jdk21 AS build
WORKDIR /app

COPY backend/build.gradle backend/settings.gradle ./
COPY backend/src src

RUN gradle --no-daemon bootJar

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/build/libs/*.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar /app/app.jar"]
