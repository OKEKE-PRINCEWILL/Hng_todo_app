package com.example.todo;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class CleanupJob {
    private final TaskService service;
    public CleanupJob(TaskService service) { this.service = service; }
    @Scheduled(cron = "0 * * * * *")
    public void run() { service.cleanup(); }
}
