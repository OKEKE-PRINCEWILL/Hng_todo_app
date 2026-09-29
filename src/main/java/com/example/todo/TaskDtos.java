package com.example.todo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;

public final class TaskDtos {
    private TaskDtos() {}
    public record SubtaskInput(UUID id, @NotBlank @Size(max = 150) String title, boolean completed) {}
    public record TaskInput(@NotBlank @Size(max = 150) String title,
        @Size(max = 1000) String description, LocalDate dueDate, @NotNull Priority priority,
        @NotNull @Size(max = 100) List<@NotNull @Valid SubtaskInput> subtasks) {}
    public record Completion(@NotNull Boolean completed) {}
    public record SubtaskView(UUID id, UUID taskId, String title, boolean completed, Instant createdAt, Instant updatedAt) {}
    public record TaskView(UUID id, String title, String description, LocalDate dueDate, Priority priority,
        boolean completed, Instant completedAt, Instant createdAt, Instant updatedAt, List<SubtaskView> subtasks) {
        static TaskView of(Task task) {
            return new TaskView(task.id, task.title, task.description, task.dueDate, task.priority,
                task.completed, task.completedAt, task.createdAt, task.updatedAt,
                task.subtasks.stream().map(s -> new SubtaskView(s.id, task.id, s.title, s.completed, s.createdAt, s.updatedAt)).toList());
        }
    }
}
