package com.example.todo;

import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static com.example.todo.TaskDtos.*;

@Service
@Transactional
public class TaskService {
    private final TaskRepository tasks;
    private final SettingsRepository settings;
    private final Clock clock;
    public TaskService(TaskRepository tasks, SettingsRepository settings, Clock clock) {
        this.tasks = tasks; this.settings = settings; this.clock = clock;
    }
    public List<TaskView> list(String timezone) {
        ZoneId zone = parseTimezone(timezone);
        var preference = settings.findById(1).orElseGet(AppSettings::new);
        preference.timezone = zone.getId();
        settings.save(preference);
        cleanup();
        return tasks.findAll().stream().map(TaskView::of).toList();
    }
    public TaskView create(TaskInput input, String timezone) {
        validateDueDate(input.dueDate(), parseTimezone(timezone));
        Task task = new Task(); task.createdAt = clock.instant();
        apply(task, input);
        return TaskView.of(tasks.saveAndFlush(task));
    }
    public TaskView update(UUID id, TaskInput input, String timezone) {
        validateDueDate(input.dueDate(), parseTimezone(timezone));
        Task task = find(id); apply(task, input);
        return TaskView.of(tasks.saveAndFlush(task));
    }
    public TaskView complete(UUID id, boolean completed) {
        Task task = find(id);
        if (task.completed != completed) {
            task.completed = completed;
            task.completedAt = completed ? clock.instant() : null;
            task.updatedAt = clock.instant();
        }
        return TaskView.of(task);
    }
    public TaskView completeSubtask(UUID id, UUID subtaskId, boolean completed) {
        Task task = find(id);
        Subtask subtask = task.subtasks.stream().filter(s -> s.id.equals(subtaskId)).findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subtask not found."));
        subtask.completed = completed; subtask.updatedAt = clock.instant(); task.updatedAt = clock.instant();
        return TaskView.of(task);
    }
    public void delete(UUID id) { tasks.delete(find(id)); }
    public void cleanup() {
        ZoneId zone = ZoneId.of(settings.findById(1).map(s -> s.timezone).orElse("UTC"));
        tasks.deleteAll(tasks.findAll().stream().filter(t -> RetentionPolicy.expired(t, clock.instant(), zone)).toList());
        tasks.flush();
    }
    private Task find(UUID id) {
        return tasks.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found."));
    }
    private ZoneId parseTimezone(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid browser timezone.");
        }
    }
    private void validateDueDate(LocalDate dueDate, ZoneId timezone) {
        LocalDate today = LocalDate.ofInstant(clock.instant(), timezone);
        if (dueDate != null && dueDate.isBefore(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date cannot be in the past.");
        }
    }
    private void apply(Task task, TaskInput input) {
        task.title = input.title().strip(); task.description = input.description();
        task.dueDate = input.dueDate(); task.priority = input.priority(); task.updatedAt = clock.instant();
        Map<UUID, Subtask> existing = new HashMap<>();
        task.subtasks.forEach(s -> existing.put(s.id, s));
        Set<UUID> retained = new HashSet<>();
        int position = 0;
        for (SubtaskInput row : input.subtasks()) {
            Subtask subtask;
            if (row.id() == null) {
                subtask = new Subtask(); subtask.task = task; subtask.createdAt = clock.instant();
                task.subtasks.add(subtask);
            } else {
                subtask = existing.get(row.id());
                if (subtask == null || retained.contains(row.id())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or duplicate subtask ID.");
                }
            }
            retained.add(subtask.id); subtask.title = row.title().strip(); subtask.completed = row.completed();
            subtask.position = position++; subtask.updatedAt = clock.instant();
        }
        task.subtasks.removeIf(s -> !retained.contains(s.id));
    }
}
