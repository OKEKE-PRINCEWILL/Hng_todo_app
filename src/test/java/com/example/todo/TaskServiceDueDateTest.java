package com.example.todo;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.example.todo.TaskDtos.TaskInput;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class TaskServiceDueDateTest {
    private final TaskRepository tasks = mock(TaskRepository.class);
    private final TaskService service = new TaskService(
        tasks,
        mock(SettingsRepository.class),
        Clock.fixed(Instant.parse("2026-09-28T23:30:00Z"), ZoneOffset.UTC)
    );

    @Test
    void rejectsADueDateThatIsPastInTheBrowserTimezone() {
        TaskInput input = new TaskInput(
            "Test task",
            null,
            LocalDate.parse("2026-09-28"),
            Priority.MEDIUM,
            List.of()
        );

        assertThatThrownBy(() -> service.create(input, "Africa/Lagos"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Due date cannot be in the past.");
        verifyNoInteractions(tasks);
    }
}
