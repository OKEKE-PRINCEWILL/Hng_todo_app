package com.example.todo;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import static com.example.todo.TaskDtos.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService service;
    public TaskController(TaskService service) { this.service = service; }
    @GetMapping List<TaskView> list(@RequestHeader(value = "X-Timezone", defaultValue = "UTC") String timezone) {
        return service.list(timezone);
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) TaskView create(@Valid @RequestBody TaskInput input) { return service.create(input); }
    @PutMapping("/{id}") TaskView update(@PathVariable UUID id, @Valid @RequestBody TaskInput input) { return service.update(id, input); }
    @PatchMapping("/{id}/completion") TaskView complete(@PathVariable UUID id, @Valid @RequestBody Completion input) {
        return service.complete(id, input.completed());
    }
    @PatchMapping("/{id}/subtasks/{subtaskId}/completion") TaskView completeSubtask(@PathVariable UUID id,
        @PathVariable UUID subtaskId, @Valid @RequestBody Completion input) {
        return service.completeSubtask(id, subtaskId, input.completed());
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable UUID id) { service.delete(id); }
}
