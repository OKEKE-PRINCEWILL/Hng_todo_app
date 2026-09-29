package com.example.todo;

import static org.assertj.core.api.Assertions.assertThat;
import java.time.*;
import org.junit.jupiter.api.Test;

class RetentionPolicyTest {
    private Task due(String date) { Task task = new Task(); task.dueDate = LocalDate.parse(date); return task; }
    @Test void keepsTaskUntilTwoFullOverdueCalendarDaysHavePassed() {
        Task task = due("2026-09-28"); ZoneId zone = ZoneId.of("Africa/Lagos");
        assertThat(RetentionPolicy.expired(task, ZonedDateTime.of(2026, 9, 28, 23, 59, 59, 0, zone).toInstant(), zone)).isFalse();
        assertThat(RetentionPolicy.expired(task, ZonedDateTime.of(2026, 9, 29, 0, 0, 0, 0, zone).toInstant(), zone)).isFalse();
        assertThat(RetentionPolicy.expired(task, ZonedDateTime.of(2026, 9, 30, 23, 59, 59, 0, zone).toInstant(), zone)).isFalse();
        assertThat(RetentionPolicy.expired(task, ZonedDateTime.of(2026, 10, 1, 0, 0, 0, 0, zone).toInstant(), zone)).isTrue();
    }
    @Test void respectsCalendarDaysAcrossDaylightSaving() {
        Task task = due("2026-03-06"); ZoneId zone = ZoneId.of("America/New_York");
        Instant threshold = LocalDate.of(2026, 3, 9).atStartOfDay(zone).toInstant();
        assertThat(RetentionPolicy.expired(task, threshold.minusSeconds(1), zone)).isFalse();
        assertThat(RetentionPolicy.expired(task, threshold, zone)).isTrue();
    }
    @Test void completedRetentionUsesCompletionInstantAndIgnoresOldDueDate() {
        Task task = due("2020-01-01"); task.completed = true; task.completedAt = Instant.parse("2026-09-01T13:25:00Z");
        assertThat(RetentionPolicy.expired(task, task.completedAt.plus(Duration.ofDays(29)), ZoneOffset.UTC)).isFalse();
        assertThat(RetentionPolicy.expired(task, task.completedAt.plus(Duration.ofDays(30)).minusNanos(1), ZoneOffset.UTC)).isFalse();
        assertThat(RetentionPolicy.expired(task, task.completedAt.plus(Duration.ofDays(30)), ZoneOffset.UTC)).isTrue();
    }
    @Test void noDueDateNeverExpiresWhileActive() {
        assertThat(RetentionPolicy.expired(new Task(), Instant.parse("2100-01-01T00:00:00Z"), ZoneOffset.UTC)).isFalse();
    }
}
