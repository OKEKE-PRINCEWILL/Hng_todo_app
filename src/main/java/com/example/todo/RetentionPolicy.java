package com.example.todo;

import java.time.*;

final class RetentionPolicy {
    private RetentionPolicy() {}
    static boolean expired(Task task, Instant now, ZoneId timezone) {
        if (task.completed) {
            return task.completedAt != null && !now.isBefore(task.completedAt.plus(Duration.ofDays(30)));
        }
        return task.dueDate != null && !now.isBefore(task.dueDate.plusDays(3).atStartOfDay(timezone).toInstant());
    }
}
