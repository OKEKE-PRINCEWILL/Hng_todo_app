CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    due_date DATE,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CHECK ((completed = FALSE AND completed_at IS NULL) OR (completed = TRUE AND completed_at IS NOT NULL))
);
CREATE TABLE subtasks (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_subtasks_task ON subtasks(task_id);
CREATE INDEX idx_tasks_due ON tasks(completed, due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed, completed_at);
CREATE TABLE app_settings (id INTEGER PRIMARY KEY, timezone VARCHAR(255) NOT NULL);
INSERT INTO app_settings (id, timezone) VALUES (1, 'UTC');
