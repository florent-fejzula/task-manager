# Changelog

All notable changes to this project will be documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com).

---

## [Unreleased]

### Added
- Tasks can be tagged as 💼 Work or 🏠 Personal (defaults to Personal), with
  an All/Work/Personal filter above the task list so unrelated life areas
  don't stay mixed together; recurring spawns inherit their template's category
- Recurring tasks auto-pause if 5 spawned occurrences in a row go
  untouched (still "in-progress", never closed or changed), with a push
  notification and a one-tap "Resume" button on the task, so a recurring
  task can't silently pile up unaddressed copies if it's forgotten

### Planned
- Multi-user collaboration features (assigning tasks, comments, etc.)
- Admin panel for business use (M House)
- Task history & activity log

---

## [1.1.0] - 2026-08-16

### Added
- Per-task countdown timers (preset and custom durations) with a "15 minutes left" push notification
- Recurring tasks: closed recurring tasks automatically respawn on their configured interval
- Push notifications (FCM) for timers, with per-device token registration
- Side menu with Settings and Logout
- Settings page: option to not auto-collapse completed subtasks
- Firestore offline persistence and a shared `DataContext` so task/settings data loads instantly from cache
- Owner-only "Amel" habit tracker page

### Changed
- `firestore.rules` and `firestore.indexes.json` are now version-controlled instead of living only in the Firebase console
- `TaskList` now reads from the shared `DataContext` cache instead of doing its own separate fetch
- Subtask add/toggle/delete logic consolidated into a single `useSubtasks` hook, removing duplicated logic between `TaskCard` and `SubtaskList`
- The 15-minute timer notification function now queries only tasks with an active timer instead of scanning every task for every user
- Removed a leftover debug scheduled function (`testScheduler`) that had no purpose in production

---

## [1.0.0] - 2024-04-20

### Added
- Firebase Auth: Sign up / Login / Logout / Reset password (with Forgot Password)
- User-specific task storage (tasks now belong to user profile)
- Task Detail page with:
  - Editable task title
  - Priority selector (with color highlighting)
  - Status dropdown
  - Delete task with confirmation modal (animated)
- Subtask management (add, toggle, delete) on Task Detail
- Task creation with initial status selection
- Accordion view for Closed tasks
- PWA installable support (Add to Home Screen on mobile)
