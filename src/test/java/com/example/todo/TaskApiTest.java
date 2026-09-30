package com.example.todo;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class TaskApiTest {
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired TaskRepository repository;
    @Autowired SettingsRepository settings;
    @Autowired TaskService service;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @MockitoBean Clock clock;
    private final Instant now = Instant.parse("2026-09-28T10:00:00Z");
    @BeforeEach void reset() {
        repository.deleteAll(); when(clock.instant()).thenReturn(now);
        AppSettings preference = new AppSettings(); settings.save(preference);
    }
    private String input(String title) throws Exception {
        return json.writeValueAsString(Map.of("title", title, "description", "Test description", "dueDate", "2026-09-28", "priority", "HIGH", "subtasks", List.of(Map.of("title", "First step", "completed", false))));
    }
    private com.fasterxml.jackson.databind.JsonNode create(String title) throws Exception {
        return json.readTree(mvc.perform(post("/api/tasks").contentType("application/json").content(input(title)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
    @Test void persistsCreateUpdateAndDeleteWithSubtaskCascade() throws Exception {
        var created = create("  Finish assignment  "); String id = created.get("id").asText();
        assertThat(created.get("title").asText()).isEqualTo("Finish assignment");
        mvc.perform(get("/api/tasks").header("X-Timezone", "Africa/Lagos")).andExpect(status().isOk()).andExpect(jsonPath("$[0].title").value("Finish assignment"));
        mvc.perform(put("/api/tasks/" + id).contentType("application/json").content(input("Updated"))).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Updated"));
        assertThat(jdbc.queryForObject("select count(*) from subtasks", Integer.class)).isEqualTo(1);
        mvc.perform(delete("/api/tasks/" + id)).andExpect(status().isNoContent());
        assertThat(repository.count()).isZero(); assertThat(jdbc.queryForObject("select count(*) from subtasks", Integer.class)).isZero();
    }
    @Test void subtaskCompletionDoesNotCompleteParentAndCanBeEditedWithoutLosingIdentity() throws Exception {
        var created = create("Build site"); String id = created.get("id").asText(); String subtask = created.get("subtasks").get(0).get("id").asText();
        mvc.perform(patch("/api/tasks/" + id + "/subtasks/" + subtask + "/completion").contentType("application/json").content("{\"completed\":true}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.completed").value(false)).andExpect(jsonPath("$.subtasks[0].completed").value(true));
        String update = json.writeValueAsString(Map.of("title", "Build site", "priority", "LOW", "subtasks", List.of(Map.of("id", subtask, "title", "Updated step", "completed", true))));
        mvc.perform(put("/api/tasks/" + id).contentType("application/json").content(update)).andExpect(status().isOk())
            .andExpect(jsonPath("$.subtasks[0].id").value(subtask)).andExpect(jsonPath("$.subtasks[0].completed").value(true));
    }
    @Test void completionIsIdempotentAndReopeningClearsTimestamp() throws Exception {
        String id = create("Read").get("id").asText();
        mvc.perform(patch("/api/tasks/" + id + "/completion").contentType("application/json").content("{\"completed\":true}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.completedAt").value(now.toString()));
        when(clock.instant()).thenReturn(now.plusSeconds(30));
        mvc.perform(patch("/api/tasks/" + id + "/completion").contentType("application/json").content("{\"completed\":true}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.completedAt").value(now.toString()));
        mvc.perform(patch("/api/tasks/" + id + "/completion").contentType("application/json").content("{\"completed\":false}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.completedAt").isEmpty());
    }
    @Test void validatesInputAndSubtaskOwnership() throws Exception {
        mvc.perform(post("/api/tasks").contentType("application/json").content(input("   "))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/tasks").contentType("application/json").content(input("x".repeat(151)))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/tasks").contentType("application/json").content(input("x").replace("2026-09-28", "2026-99-99"))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/tasks").contentType("application/json").content(input("Past due").replace("2026-09-28", "2026-09-27")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Due date cannot be in the past."));
        when(clock.instant()).thenReturn(Instant.parse("2026-09-28T23:30:00Z"));
        mvc.perform(post("/api/tasks").header("X-Timezone", "Africa/Lagos").contentType("application/json").content(input("Past locally")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Due date cannot be in the past."));
        when(clock.instant()).thenReturn(now);
        mvc.perform(get("/api/tasks").header("X-Timezone", "invalid-zone")).andExpect(status().isBadRequest());
        var first = create("First"); var second = create("Second");
        String invalid = json.writeValueAsString(Map.of("title", "Second", "priority", "MEDIUM", "subtasks", List.of(Map.of("id", first.get("subtasks").get(0).get("id").asText(), "title", "Not mine", "completed", false))));
        mvc.perform(put("/api/tasks/" + second.get("id").asText()).contentType("application/json").content(invalid)).andExpect(status().isBadRequest());
        mvc.perform(delete("/api/tasks/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }
    @Test void schedulerCleanupPersistsTimezoneAndCascadesWithoutPageVisit() throws Exception {
        create("Overdue soon");
        mvc.perform(get("/api/tasks").header("X-Timezone", "America/Los_Angeles")).andExpect(status().isOk());
        when(clock.instant()).thenReturn(Instant.parse("2026-10-01T06:59:59Z")); service.cleanup(); assertThat(repository.count()).isEqualTo(1);
        when(clock.instant()).thenReturn(Instant.parse("2026-10-01T07:00:00Z")); service.cleanup(); service.cleanup();
        assertThat(repository.count()).isZero(); assertThat(jdbc.queryForObject("select count(*) from subtasks", Integer.class)).isZero();
    }
    @Test void completedCleanupAtThirtyDays() throws Exception {
        String id = create("Done").get("id").asText();
        mvc.perform(patch("/api/tasks/" + id + "/completion").contentType("application/json").content("{\"completed\":true}")).andExpect(status().isOk());
        when(clock.instant()).thenReturn(now.plus(Duration.ofDays(30)).minusSeconds(1)); service.cleanup(); assertThat(repository.count()).isEqualTo(1);
        when(clock.instant()).thenReturn(now.plus(Duration.ofDays(30))); service.cleanup(); assertThat(repository.count()).isZero();
    }
}
