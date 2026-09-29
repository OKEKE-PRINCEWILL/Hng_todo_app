package com.example.todo;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name = "tasks")
public class Task {
    @Id UUID id = UUID.randomUUID();
    @Column(nullable = false, length = 150) String title;
    @Column(length = 1000) String description;
    LocalDate dueDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false) Priority priority = Priority.MEDIUM;
    boolean completed;
    Instant completedAt;
    @Column(nullable = false) Instant createdAt;
    @Column(nullable = false) Instant updatedAt;
    @Version long version;
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC") List<Subtask> subtasks = new ArrayList<>();
}
