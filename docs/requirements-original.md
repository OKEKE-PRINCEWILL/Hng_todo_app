# Software Requirements Document (SRD)

## Simple To-Do Application

**Version:** 1.0
**Application Type:** Full-stack web application
**Primary Goal:** Build a clean, simple, persistent to-do application that helps users create, manage, prioritize, complete, search, and track tasks without becoming a complex project-management system.

---

# 1. Project Overview

Build a responsive to-do web application that allows a user to:

- Create tasks.
- Edit tasks.
- Delete tasks.
- Mark tasks as completed.
- Add optional subtasks.
- Assign due dates.
- Assign one of three priorities: Low, Medium, or High.
- View tasks through Today, Upcoming, All Tasks, and Completed tabs.
- Search tasks.
- Filter tasks by priority.
- Receive an overdue notification.
- Automatically remove abandoned overdue tasks.
- Automatically clean up old completed tasks.
- Persist all task data in a database.

The application should remain intentionally simple.

It is **not** intended to be a project-management application like Jira, Asana, ClickUp, or Trello.

---

# 2. Recommended Technology Stack

Use the following stack unless there is a strong technical reason not to:

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Lucide icons

### Backend

-
- Database

Preferred:

- PostgreSQL

### Validation

Use:

- Zod

### State Management

Do not introduce a heavy global state-management library unless necessary.

Prefer:

- React state
- Server Components where appropriate
- Server Actions / API requests
- TanStack Query only if it meaningfully simplifies synchronization

### Deployment

The application should be deployable to:

- Vercel

The database may be deployed through:

- Neon
- Supabase PostgreSQL
- another standard hosted PostgreSQL provider

---

# 3. V1 Scope

The first version must include:

1. Create task.
2. Edit task.
3. Delete task.
4. Complete task.
5. Strike through a task immediately after completion.
6. Store completed tasks in a Completed section.
7. Automatically remove completed tasks after 30 days.
8. Optional subtasks.
9. Task title.
10. Task description.
11. Task due date.
12. Task priority.
13. Today tab.
14. Upcoming tab.
15. All Tasks tab.
16. Completed tab.
17. Search.
18. Priority filtering.
19. Overdue detection.
20. Overdue notification.
21. Automatic deletion of incomplete tasks after they have been overdue for two days.
22. Persistent database storage.
23. Responsive interface.

---

# 4. Explicitly Out of Scope

Do NOT add the following features unless specifically requested later:

- Categories
- Lists
- Projects
- Tags
- Urgent priority
- Calendar view
- Drag-and-drop boards
- Recurring tasks
- Productivity statistics
- Gamification
- Streaks
- AI task generation
- AI scheduling
- Team collaboration
- Comments
- File attachments
- Social features
- Authentication
- Multiple-user accounts
- Google login
- Email login
- Role-based access control

V1 should behave as a simple single-user to-do application.

Architecture may be kept reasonably extensible, but these features should NOT appear in the UI.

---

# 5. Task Data Model

Each task must contain at minimum:

```ts
type Priority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;

  title: string;

  description?: string | null;

  dueDate?: Date | null;

  priority: Priority;

  completed: boolean;

  completedAt?: Date | null;

  createdAt: Date;

  updatedAt: Date;

  subtasks: Subtask[];
}
```

---

# 6. Subtask Data Model

A task may optionally contain zero or more subtasks.

```ts
interface Subtask {
  id: string;

  taskId: string;

  title: string;

  completed: boolean;

  createdAt: Date;

  updatedAt: Date;
}
```

Subtasks must belong to exactly one task.

Deleting the parent task must also delete all associated subtasks.

Use cascading deletion at the database level where appropriate.

---

# 7. Task Creation

The application must have an obvious button such as:

**+ Add Task**

Opening the task creation interface should display:

### Required

**Task Title**

### Optional

**Description**

**Due Date**

**Subtasks**

### Priority

The user must be able to select:

- Low
- Medium
- High

Default priority:

**Medium**

The create-task form should approximately contain:

```text
Add Task

Title *
[________________________________]

Description
[________________________________]
[________________________________]

Due Date
[ Select date ]

Priority

○ Low
● Medium
○ High

Subtasks

[ Add subtask ]

Cancel                    Add Task
```

---

# 8. Task Title Requirements

Task title:

- Is required.
- Cannot contain only spaces.
- Should be trimmed before saving.
- Should have a reasonable maximum length, for example 150 characters.

Example:

```text
Finish CSE assignment
```

---

# 9. Description Requirements

Description:

- Is optional.
- May contain multiple lines.
- Should have a reasonable limit such as 1,000 characters.

Example:

```text
Complete questions 1–5 and review the proof section before submission.
```

---

# 10. Priority System

Only three priorities exist.

## Low

Visual color:

**Green**

Example:

```text
● Low
```

## Medium

Visual color:

**Amber / Orange**

Example:

```text
● Medium
```

## High

Visual color:

**Red**

Example:

```text
● High
```

Do NOT introduce an Urgent priority.

Colors should be visually accessible and should not be the only indicator of priority.

The text label must always accompany the color.

---

# 11. Due Dates

A task may optionally have a due date.

V1 does NOT require a due time.

Example:

```text
Due Sep 30, 2026
```

If no due date exists, the task should still be valid.

Tasks without due dates should appear in:

**All Tasks**

They should not appear in:

- Today
- Upcoming

---

# 12. Date and Timezone Behavior

Date calculations must use the user's local browser timezone.

Do not hardcode a particular country or timezone.

Store timestamps in the database in a standard format such as UTC.

When presenting dates or determining whether a task is Today, Upcoming, Completed, or Overdue, use the user's local date.

Because tasks have a due date but no due time, treat the task as valid for the entire due date.

Example:

Task due:

```text
September 28
```

The task should not become overdue during September 28.

It becomes overdue beginning:

```text
September 29 at 12:00 AM
```

in the user's local timezone.

---

# 13. Main Navigation Tabs

The primary task navigation must contain exactly these task tabs:

```text
Today | Upcoming | All Tasks | Completed
```

The selected tab should have a clear active state.

Do not add a separate Overdue tab in V1.

---

# 14. Today Tab

The Today tab displays:

- Tasks that are incomplete.
- Tasks whose due date is the current local date.

Example:

```text
TODAY

☐ Finish assignment             High

☐ Reply to professor            Medium

☐ Practice coding               Low
```

Completed tasks must not permanently appear here.

---

# 15. Upcoming Tab

The Upcoming tab contains:

- Incomplete tasks.
- Due date is later than today.

Sort upcoming tasks by due date ascending.

The closest due date should appear first.

Example:

```text
UPCOMING

Tomorrow

☐ Submit application            High

Oct 4

☐ Finish project                Medium

Oct 7

☐ Buy groceries                 Low
```

Completed tasks must not appear.

Overdue tasks must not appear.

---

# 16. All Tasks Tab

The All Tasks tab means:

**All active/incomplete tasks.**

It does NOT literally mean every record in the database.

All Tasks includes:

- Today's tasks.
- Upcoming tasks.
- Overdue tasks that have not yet reached their deletion deadline.
- Tasks with no due date.

All Tasks excludes:

- Completed tasks.

Example:

```text
ALL TASKS

⚠ Submit report
Overdue · High

☐ Finish CSE assignment
Today · Medium

☐ Apply for role
Oct 5 · High

☐ Clean workspace
No due date · Low
```

---

# 17. Completed Tab

The Completed tab contains only:

```ts
completed === true
```

Completed tasks should show:

- Task title.
- Strikethrough styling.
- Priority if appropriate.
- Completion date.

Example:

```text
COMPLETED

✓ Finish assignment
  Completed Sep 28

✓ Update resume
  Completed Sep 27
```

The task title should visually appear as:

```css
text-decoration: line-through;
```

Reduced opacity may also be used.

---

# 18. Completing a Task

Each active task must have a checkbox or equivalent completion control.

Example:

```text
☐ Finish assignment
```

When clicked:

```text
☑ F̶i̶n̶i̶s̶h̶ ̶a̶s̶s̶i̶g̶n̶m̶e̶n̶t̶
```

The UI should immediately:

1. Mark the task as completed.
2. Apply strikethrough styling.
3. Visually reduce its prominence.
4. Persist completion to the database.
5. Store `completedAt`.

The task may remain visibly crossed out in the current view immediately after the user checks it.

After the page is refreshed or the task list is re-fetched, it should no longer appear in active task tabs.

It should instead appear in:

**Completed**

Database update:

```ts
completed = true;
completedAt = new Date();
```

---

# 19. Completed Task Retention

Completed tasks must remain available for:

**30 days**

After being completed for 30 days, they should be permanently deleted from the database.

Conceptual rule:

```ts
if (
  task.completed === true &&
  task.completedAt <= thirtyDaysAgo
) {
  permanentlyDeleteTask(task.id);
}
```

This must delete:

- Parent task.
- Associated subtasks.

---

# 20. Optional Subtasks

Subtasks are optional.

A user can create a task without any subtasks.

Example:

```text
☐ Submit assignment
```

Or they may add subtasks:

```text
☐ Build Portfolio Website

   ☐ Create homepage
   ☐ Add projects section
   ☐ Add contact section
   ☐ Deploy application
```

The task creation/editing form should have:

```text
+ Add subtask
```

Each added subtask should provide:

- Text input.
- Remove button before saving.

Example:

```text
Subtasks

[ Create homepage       ] ×
[ Add projects section  ] ×

+ Add another subtask
```

---

# 21. Completing Subtasks

Each subtask must have its own completion checkbox.

Example:

```text
☑ Create homepage
☐ Add projects section
☐ Deploy application
```

Completed subtasks should receive strikethrough styling.

Example:

```text
✓ C̶r̶e̶a̶t̶e̶ ̶h̶o̶m̶e̶p̶a̶g̶e̶
```

Completing a subtask must not automatically complete the parent task.

Likewise, all subtasks being completed should not automatically mark the parent task as complete.

The user explicitly completes the parent task.

If the parent task is completed while some subtasks remain incomplete, the entire task should still be treated as completed.

The individual subtask states may remain stored.

---

# 22. Editing Tasks

Every task should have an Edit action.

Selecting Edit should populate the existing values.

Example:

```text
Edit Task

Title
[ Finish project ]

Description
[ Complete frontend implementation ]

Due Date
[ Oct 4, 2026 ]

Priority
● High

Subtasks
[ Build dashboard ]
[ Add search ]

Cancel                 Save Changes
```

The user must be able to edit:

- Title.
- Description.
- Due date.
- Priority.
- Subtasks.

Save changes to the database.

---

# 23. Manual Task Deletion

Every task should provide a Delete option.

Manual deletion is permanent.

Before deletion, display confirmation.

Example:

```text
Delete task?

"Finish CSE assignment"

This action cannot be undone.

Cancel                  Delete
```

Only delete after confirmation.

Deleting a parent task must delete its subtasks.

---

# 24. Overdue Tasks

A task is overdue when:

1. It is incomplete.
2. It has a due date.
3. Its due date has passed.

Example:

```ts
completed === false &&
dueDate < today
```

Because V1 has no due time, the task becomes overdue on the calendar day following its due date.

Example:

Task due:

```text
September 28
```

Status:

```text
September 28
Due today

September 29
Overdue
```

---

# 25. Overdue Task Appearance

Overdue tasks should clearly stand out.

Example:

```text
⚠ OVERDUE

Submit project

Due Sep 28
High Priority
```

Use red or another warning treatment.

Do not rely exclusively on color.

Include visible text:

**Overdue**

Where possible, also show when the task will be automatically removed.

Example:

```text
Will be automatically removed in 1 day.
```

---

# 26. Overdue Notifications

When a task becomes overdue, notify the user.

V1 must support at minimum an in-app notification.

Example:

```text
⚠ "Submit project" is overdue.
```

This may appear as:

- Toast.
- Notification banner.
- Notification center item.

Avoid repeatedly showing the same overdue notification every few seconds or every render.

A task should not continuously spam notifications.

Optionally support browser notifications when permission has been granted.

If browser notification permission is unavailable or denied, the in-app notification must still work.

---

# 27. Automatic Deletion of Overdue Tasks

An incomplete overdue task must only remain for two days after it becomes overdue.

Example:

Task due:

```text
September 28
```

Lifecycle:

```text
Sep 28
Task is due.

Sep 29 00:00
Task becomes overdue.

Sep 29
First overdue day.

Sep 30
Second overdue day.

Oct 1 00:00
Task is permanently removed.
```

Therefore, an incomplete task should survive approximately 48 hours after entering the overdue state.

After that period:

- Permanently delete task.
- Permanently delete related subtasks.
- Remove it from the database.
- It must not appear in Completed.

Conceptual rule:

```ts
if (
  task.completed === false &&
  task.dueDate &&
  currentDate >= deletionThreshold
) {
  permanentlyDeleteTask(task.id);
}
```

The implementation should calculate the threshold carefully using the user's date semantics.

---

# 28. Automatic Cleanup Architecture

Automatic deletion must NOT depend only on the user manually visiting the page.

Use a scheduled cleanup mechanism.

Recommended approach:

- Server-side scheduled job.
- Vercel Cron if deployed on Vercel.
- Or another scheduled server process.

The cleanup job should:

1. Find completed tasks older than 30 days.
2. Permanently delete them.
3. Find incomplete tasks that have been overdue for more than two days.
4. Permanently delete them.

The cleanup process should be idempotent.

Running it multiple times should not cause errors.

---

# 29. Search

Provide a search field near the task navigation.

Example:

```text
Search tasks...
```

Search should match:

- Task title.
- Task description.

Search should be case-insensitive.

Example query:

```text
assignment
```

May return:

```text
Database Assignment

Security Assignment

CSE Assignment
```

Search should operate within the currently selected tab.

Example:

If the user is on:

**Completed**

search should search completed tasks.

If the user is on:

**Today**

search should search today's tasks.

---

# 30. Priority Filtering

Provide a priority filter.

Options:

```text
All Priorities
Low
Medium
High
```

Example UI:

```text
Priority: [ High ▼ ]
```

Priority filters should work with the currently selected tab.

Example:

Today + High:

Show only today's active High-priority tasks.

Completed + Low:

Show only completed Low-priority tasks.

---

# 31. Status Filtering

Do NOT add a separate status filter in V1.

The tabs already represent task state.

Completed state is represented by:

**Completed**

Active state is represented by:

- Today
- Upcoming
- All Tasks

A separate Active / Completed dropdown would unnecessarily duplicate the navigation.

---

# 32. Task Sorting

Default ordering should be predictable.

### Today

Sort primarily by:

1. Priority.
2. Creation time.

Recommended priority ordering:

```text
High
Medium
Low
```

### Upcoming

Sort primarily by:

1. Due date ascending.
2. Priority.

### All Tasks

Recommended:

1. Overdue tasks first.
2. Today's tasks.
3. Upcoming tasks.
4. Tasks without due dates.

Within each group, High priority should appear before Medium, then Low.

### Completed

Sort by:

```text
completedAt descending
```

Most recently completed tasks appear first.

---

# 33. Empty States

Each section must have a friendly empty state.

Examples:

Today:

```text
Nothing due today.

Enjoy the breathing room.
```

Upcoming:

```text
No upcoming tasks.
```

All Tasks:

```text
You have no active tasks.

Create your first task.
```

Completed:

```text
No completed tasks yet.
```

Search:

```text
No tasks match your search.
```

---

# 34. Main Layout

Desktop concept:

```text
--------------------------------------------------

My Tasks

[ Search tasks... ]               [+ Add Task]

Today | Upcoming | All Tasks | Completed

Priority: [ All ▼ ]

--------------------------------------------------

☐ Finish assignment

   Complete questions 1–5.

   Due Today       ● High

   ☐ Question 1
   ☐ Question 2

                         Edit   Delete

--------------------------------------------------
```

The interface should feel spacious and uncluttered.

---

# 35. Task Card

A task card should display the most important information without overwhelming the user.

Suggested contents:

```text
[checkbox] Task title

Description preview

Due date           Priority

Subtasks if present

Edit               Delete
```

Priority should appear as a badge.

Example:

```text
High
```

Due date may appear as:

```text
Today
Tomorrow
Sep 30
Overdue
No due date
```

---

# 36. Responsive Design

The application must work properly on:

- Desktop.
- Tablet.
- Mobile.

On mobile:

- Tabs may horizontally scroll if necessary.
- Task controls should remain touch-friendly.
- Forms should fit within the screen.
- Buttons should have comfortable tap targets.
- Task cards should stack vertically.

Do not require hover to access essential functionality.

---

# 37. Accessibility

The application should include:

- Proper button labels.
- Keyboard-accessible controls.
- Visible focus states.
- Semantic HTML.
- Accessible modal/dialog implementation.
- Labels associated with form fields.
- Sufficient contrast.
- Priority text labels in addition to colors.
- Screen-reader-accessible checkboxes.

Use accessible primitives from shadcn/Radix where appropriate.

---

# 38. Loading States

Provide reasonable loading feedback when:

- Fetching tasks.
- Creating task.
- Editing task.
- Deleting task.
- Completing task.

Avoid duplicate submissions.

Buttons may temporarily show:

```text
Saving...
```

or

```text
Deleting...
```

---

# 39. Error Handling

Database/network failures must not fail silently.

Provide messages such as:

```text
Could not create task. Please try again.
```

```text
Could not update task.
```

```text
Could not delete task.
```

If an optimistic UI update fails, restore the previous UI state where appropriate.

---

# 40. Database Requirements

Use relational persistence.

Suggested Prisma models:

```prisma
enum Priority {
  LOW
  MEDIUM
  HIGH
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  dueDate     DateTime?
  priority    Priority   @default(MEDIUM)
  completed   Boolean    @default(false)
  completedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  subtasks    Subtask[]
}

model Subtask {
  id        String   @id @default(cuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
}
```

Modify this schema if technically necessary, but preserve the product behavior.

---

# 41. Suggested Application Structure

A reasonable project structure could resemble:

```text
src/
├── app/
│   ├── api/
│   │   ├── tasks/
│   │   └── cleanup/
│   │
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── task-list.tsx
│   ├── task-card.tsx
│   ├── task-form.tsx
│   ├── task-dialog.tsx
│   ├── task-tabs.tsx
│   ├── task-search.tsx
│   ├── priority-filter.tsx
│   ├── subtask-item.tsx
│   └── overdue-notification.tsx
│
├── lib/
│   ├── db.ts
│   ├── dates.ts
│   ├── validations.ts
│   └── task-utils.ts
│
└── types/
    └── task.ts
```

This is a suggestion rather than an absolute requirement.

Keep the architecture understandable.

---

# 42. Task API / Server Operations

The application should support server-side operations equivalent to:

```text
GET tasks

POST task

PATCH task

DELETE task

PATCH task completion

POST subtask

PATCH subtask

DELETE subtask
```

Do not expose unnecessary endpoints.

Validate all mutations on the server.

---

# 43. Validation

Use Zod.

Example task validation:

```ts
const taskSchema = z.object({
  title: z.string().trim().min(1).max(150),

  description: z
    .string()
    .max(1000)
    .optional()
    .nullable(),

  dueDate: z.coerce.date().optional().nullable(),

  priority: z.enum([
    "LOW",
    "MEDIUM",
    "HIGH",
  ]),

  subtasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(150),
      })
    )
    .optional(),
});
```

Server-side validation is required even if client-side validation already exists.

---

# 44. Important Business Rules

The following rules must always hold:

### Rule 1

Completed tasks must not appear under All Tasks after data is reloaded.

### Rule 2

Completed tasks must not appear under Today after data is reloaded.

### Rule 3

Completed tasks must not appear under Upcoming.

### Rule 4

Completed tasks belong in Completed.

### Rule 5

Completed tasks are permanently deleted after 30 days.

### Rule 6

Incomplete tasks become overdue after their due date passes.

### Rule 7

Overdue tasks remain active temporarily.

### Rule 8

Incomplete tasks are permanently deleted after being overdue for two days.

### Rule 9

Overdue automatic deletion does not send the task to Completed.

### Rule 10

A user may manually delete a task at any time.

### Rule 11

Subtasks are optional.

### Rule 12

A task may contain multiple subtasks.

### Rule 13

Completing a subtask does not automatically complete its parent.

### Rule 14

Completing all subtasks does not automatically complete the parent.

### Rule 15

Only Low, Medium, and High priorities exist.

### Rule 16

Tasks with no due date belong only in All Tasks.

---

# 45. Example Task Lifecycle

Create:

```text
Finish assignment

Description:
Complete questions 1–5

Due:
Sep 28

Priority:
High
```

Initially:

```text
TODAY

☐ Finish assignment
   Due Today
   High
```

If completed:

```text
☑ F̶i̶n̶i̶s̶h̶ ̶a̶s̶s̶i̶g̶n̶m̶e̶n̶t̶
```

After data refresh:

```text
COMPLETED

✓ Finish assignment
  Completed Sep 28
```

Thirty days later:

```text
Permanently deleted
```

---

# 46. Example Overdue Lifecycle

Task:

```text
Submit project

Due:
Sep 28
```

Sep 28:

```text
☐ Submit project
Due Today
```

Sep 29:

```text
⚠ OVERDUE

Submit project

Due Sep 28

Automatic removal in 2 days.
```

Sep 30:

```text
⚠ OVERDUE

Submit project

Automatic removal in 1 day.
```

Oct 1:

```text
Task permanently deleted.
```

It must not appear in Completed.

---

# 47. Acceptance Criteria

The application is considered functionally complete when all of the following work:

### Task creation

A task can be created and remains after page refresh.

### Task editing

A task can be edited and changes remain after refresh.

### Manual deletion

A task can be permanently deleted after confirmation.

### Completion

Checking a task immediately strikes it through.

Completion is persisted.

After re-fetch or refresh, the completed task appears in Completed and disappears from active task lists.

### Due dates

Today and Upcoming correctly classify tasks according to the local date.

### Priority

Low, Medium, and High display distinct visual treatments.

No Urgent priority exists.

### Search

Search finds tasks by title or description.

### Filtering

Priority filtering works on every relevant tab.

### Subtasks

Subtasks can be optionally added, edited where appropriate, completed, and removed.

### Overdue detection

Past-due incomplete tasks display an Overdue status.

### Notifications

Users receive an in-app notification when applicable overdue tasks are detected.

### Automatic overdue deletion

Incomplete tasks are permanently deleted after two overdue days.

### Completed cleanup

Completed tasks are permanently deleted after 30 days.

### Persistence

Refreshing or reopening the site does not lose data unless the data meets automatic deletion criteria.

---

# 48. Testing Requirements

Add tests for the most important business logic.

At minimum test:

```text
Task creation

Task update

Task deletion

Task completion

Subtask completion

Today calculation

Upcoming calculation

Overdue detection

Two-day overdue deletion threshold

30-day completed deletion threshold

Search

Priority filtering
```

Date logic deserves especially careful testing.

Test boundary cases such as:

```text
11:59 PM on due date

12:00 AM following due date

exactly 2 overdue days

29 completed days

exactly 30 completed days
```

---

# 49. Code Quality Requirements

Use:

- TypeScript strictness.
- Reusable components.
- Clear naming.
- Small focused functions.
- Server-side validation.
- Proper error handling.
- No unnecessary abstractions.
- No giant monolithic components.
- No `any` unless absolutely necessary.
- No secrets committed into source control.

Provide:

```text
.env.example
```

for required environment variables.

---

# 50. README Requirements

Generate a README containing:

- Project overview.
- Feature list.
- Tech stack.
- Installation instructions.
- Environment setup.
- Database setup.
- Prisma migration instructions.
- Local development instructions.
- Production deployment instructions.
- Scheduled cleanup configuration.
- Important automatic deletion rules.

---

# 51. Development Instructions for Codex

Build the application completely based on this specification.

Do not merely generate mockups.

Create:

- Functional frontend.
- Functional backend.
- Database schema.
- Database migrations.
- Task CRUD operations.
- Subtask functionality.
- Search.
- Priority filters.
- Tab behavior.
- Overdue logic.
- Notifications.
- Scheduled cleanup logic.
- Completed-task cleanup logic.
- Responsive styling.
- Validation.
- Error handling.
- README.
- `.env.example`.

Use sensible defaults when minor visual decisions are unspecified.

Do NOT introduce product features explicitly listed as out of scope.

If an implementation detail must differ from this document for technical reasons, preserve the intended user-facing behavior.

---

# 52. Final Product Principle

The product should answer one simple question immediately:

**"What do I still need to do?"**

The interface should therefore prioritize active work while keeping completed work separate.

The final application should feel:

- Simple.
- Fast.
- Clean.
- Easy to understand.
- Visually polished.
- Focused.
- Not overloaded with features.

Do not turn the app into a project-management platform.

Build a polished, dependable to-do application.
