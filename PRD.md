# Product Requirements Document (PRD)

# Youth Conference Management System
**Version:** 2.0  
**Project Type:** Static Web Application  
**Platform:** HTML5 + CSS3 + JavaScript (Vanilla)  
**Target Devices:** Mobile First (Android) + Desktop  
**Database:** Static JSON File  
**Backend:** None

---

# 1. Project Vision

The Youth Conference Management System is a fully static web application designed to manage every aspect of a youth conference from one centralized interface.

The system does not rely on any backend, authentication system, online database, or server-side technologies.

Instead, all conference data is generated before deployment into a single JSON file that becomes the only source of truth for the entire application.

The goal is to make the website extremely fast, portable, easy to maintain, and reusable for future conferences.

---

# 2. Project Goals

The system aims to:

- Organize all conference information in one application.
- Make navigation easy and intuitive.
- Provide a unique dashboard experience.
- Simplify conference preparation.
- Eliminate manual HTML editing.
- Eliminate duplicated data.
- Allow conference reuse by replacing only one JSON file.
- Work completely without internet services or databases.

---

# 3. Target Users

### Conference Participant

Can:

- Browse lectures
- Browse workshops
- View hymns
- View prayer
- View program
- Find bus seat
- Find room
- Find group

---

### Conference Organizer

Can:

- Prepare conference data.
- Generate JSON file.
- Upload project.

No editing happens after deployment.

---

# 4. System Architecture

The project follows three completely separated layers.

## Presentation Layer

Responsible for UI only.

Contains

- HTML
- CSS

No business logic.

---

## Business Logic Layer

Responsible for

- Rendering
- Searching
- Navigation
- Filtering
- UI updates

Contains

- JavaScript

No static data.

---

## Data Layer

Contains only

```
conference-data.json
```

No JavaScript.

No HTML.

No duplicated data.

---

# 5. Dashboard

The dashboard is considered FINAL.

No redesign is required.

No modifications should be made to:

- Wheel
- Animation
- Scroll behavior
- Swipe behavior
- Snap
- Half visible wheel concept

The dashboard is the identity of the project.

---

# 6. Application Modules

## Dashboard

Interactive navigation wheel.

Provides access to all modules.

---

## Lectures

Structure

Day 1

Day 2

Day 3

Each lecture contains

- Title
- Description
- Learning objectives
- Speaker (optional)

---

## Workshops

Structure identical to lectures.

---

## Program

Three day schedule.

Displayed as Timeline.

Each activity contains

- Time
- Activity
- Location

---

## Hymns

Contains

Conference Hymns

Prayer Hymns

Band Songs

Each hymn contains

- Title
- Lyrics

---

## Prayer

Contains

- Morning Prayer

- Night Prayer

---

## Accommodation

Split into

Boys

Girls

Each contains

Floors

↓

Rooms

↓

Beds

↓

Assigned Participant

---

## Buses

Visual bus layout.

Every seat displays

- Seat number
- Participant

---

## Groups

Four groups.

Each group contains

- Name
- Members

---

## Games

Interactive conference games.

---

# 7. Data Builder

A standalone tool.

```
data-builder.html
```

Not part of the website.

Used only before deployment.

Purpose

Generate

```
conference-data.json
```

---

# 8. Data Builder Modules

## Participants

Create

Edit

Delete

Participants.

---

## Groups

Visual group management.

Supports

Drag & Drop.

---

## Rooms

Visual room editor.

Each room displays beds.

Click bed

↓

Choose participant.

---

## Buses

Visual bus editor.

Each bus displays seats.

Click seat

↓

Choose participant.

---

## Conference Summary

Displays

- Total participants
- Total rooms
- Total buses
- Total groups
- Used beds
- Used seats

---

# 9. Data Validation

Before JSON generation.

System must validate

✓ Duplicate participant

✓ Duplicate seat

✓ Duplicate bed

✓ Missing room

✓ Missing bus

✓ Missing group

✓ Missing participant name

If any validation fails

JSON generation must stop.

Error report should be displayed.

---

# 10. JSON Architecture

Single file

```
conference-data.json
```

Contains

```json
{
  "meta": {},
  "participants": [],
  "groups": [],
  "rooms": [],
  "buses": [],
  "lectures": [],
  "workshops": [],
  "program": [],
  "hymns": [],
  "prayer": {}
}
```

---

# 11. Data Service

A dedicated JavaScript module.

```
data-service.js
```

Responsibilities

- Load JSON
- Cache data
- Provide helper methods

Examples

```
load()

getParticipants()

getParticipant()

getRooms()

getGroups()

getBuses()

getLectures()

getProgram()
```

No page should call JSON directly.

---

# 12. Search System

Global search.

Search by

- Name

Displays

- Group
- Room
- Bed
- Bus
- Seat

Used by

- Rooms
- Buses
- Groups
- Dashboard

---

# 13. Performance Requirements

- Mobile First
- Responsive
- Fast loading
- Lazy rendering when necessary
- Minimal JavaScript
- No frameworks required
- No backend requests

---

# 14. UI Requirements

Dark theme.

Glass UI.

Modern animations.

Consistent spacing.

Large touch targets.

Smooth transitions.

---

# 15. Accessibility

Large buttons.

Readable fonts.

RTL support.

Touch friendly.

---

# 16. Coding Standards

Separate

HTML

CSS

JavaScript

Never mix responsibilities.

Avoid inline JavaScript.

Avoid inline styles.

Use reusable components.

---

# 17. Known Issues (Current Version)

The following issues must be fixed.

## Data Conflict

Some pages still rely on old JavaScript data.

All pages must use

```
conference-data.json
```

only.

---

## Bus Module

Bus rendering currently conflicts with new JSON architecture.

Must be rewritten to use DataService.

---

## Data Duplication

Remove duplicated datasets from

- lectures-data.js
- workshops-data.js
- accommodation-data.js
- program-data.js

Replace with DataService.

---

## Separation of Logic

Business logic must never contain conference data.

Conference data belongs only to JSON.

---

# 18. Acceptance Criteria

The project is considered complete when:

✓ Dashboard works correctly.

✓ All modules read from JSON.

✓ Data Builder generates valid JSON.

✓ No duplicated data exists.

✓ Rooms display correctly.

✓ Buses display correctly.

✓ Search works globally.

✓ Groups display correctly.

✓ Mobile experience is smooth.

✓ Project runs without backend.

---

# 19. Future Roadmap

Possible future versions

Version 3.0

- QR Code
- Attendance
- PDF Export
- Notifications
- Statistics
- Admin Authentication (optional)
- Cloud Synchronization (optional)

---

# 20. Final Principle

This project follows one strict architectural rule.

> **Single Source of Truth**

The entire application must rely on one file only:

```
assets/data/conference-data.json
```

All JavaScript modules read from this file.

No duplicated data.

No embedded datasets.

No backend.

No database.

Only one JSON file powers the entire conference.