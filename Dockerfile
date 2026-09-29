FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw --batch-mode dependency:go-offline

COPY src src
RUN ./mvnw --batch-mode -DskipTests package

FROM eclipse-temurin:21-jre-jammy

RUN groupadd --system app && useradd --system --gid app app
WORKDIR /app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

COPY --from=build --chown=app:app /workspace/target/todo-0.0.1-SNAPSHOT.jar app.jar

USER app
EXPOSE 10000

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
