package com.example.todo;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subtasks")
public class Subtask {
    @Id UUID id = UUID.randomUUID();
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "task_id") Task task;
    @Column(nullable = false, length = 150) String title;
    boolean completed;
    int position;
    @Column(nullable = false) Instant createdAt;
    @Column(nullable = false) Instant updatedAt;
}
