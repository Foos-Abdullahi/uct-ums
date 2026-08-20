# UCT UMS — Admin Module UI Design System

## Purpose

This document defines the shared UI, UX, component, interaction, loading, animation, responsive, accessibility, and testing standards for Admin portal pages.

This is a **style and implementation system**, not a feature specification. Individual pages should apply these standards consistently without introducing a different visual language.

---

# 1. Design Principles

- Clean, modern, professional university-management interface.
- Keep navigation simple; complexity belongs inside pages, tabs, detail views, and contextual actions.
- Prefer existing project components over creating duplicates.
- Prefer reusable patterns over page-specific implementations.
- Use progressive disclosure: show summaries first, detailed information after the user opens a record.
- Keep primary actions obvious and secondary actions contextual.
- Avoid visual clutter, excessive borders, excessive colors, and unnecessary animations.
- Every page must work well on desktop, tablet, and mobile.
- Every server-backed page must have loading, empty, error, and success states.
- Use consistent spacing, typography, iconography, status indicators, and interaction patterns.

---

# 2. Existing Stack and UI Foundations

Use the project's existing stack and components:

- React
- TypeScript
- Inertia.js
- Tailwind CSS
- shadcn/ui
- lucide-react
- Sonner
- Existing custom components
- Existing permission component
- Existing DataTable implementation
- Existing MetricCard implementation
- Existing skeleton components

Do not introduce another component library when an existing shadcn/custom component already solves the problem.

Do not introduce a new animation library unless the project already requires it.

---

# 3. Page Layout

Use a consistent page shell.

```text
Page
│
├── Header
│   ├── Title
│   ├── Description
│   └── Primary Action
│
├── Summary Area
│
├── Main Content
│
└── Contextual Dialogs / Sheets
```

Recommended page container:

```tsx
<div className="p-6">
```

Keep the existing application layout, breadcrumbs, sidebar, and header system.

Do not create a second layout system.

---

# 4. Page Header

Every management page should have a compact header.

Structure:

```text
Title
Short description

                                      Primary Action
```

Recommended typography:

```text
Title:
text-lg font-semibold

Description:
text-xs text-muted-foreground
```

Recommended header alignment:

```tsx
<div className="flex items-start justify-between gap-4">
```

On small screens, allow wrapping.

Primary actions should use the existing shadcn `Button`.

Keep button labels concise.

Examples of action patterns:

```text
+ Create
+ Add
Save
Cancel
```

Do not place multiple destructive or secondary actions directly beside the primary action unless they are genuinely important.

---

# 5. Summary / Metric Cards

Use the existing `MetricCard` component.

Summary cards should:

- Provide a quick operational overview.
- Use one clear number.
- Have a concise title.
- Have a short supporting description.
- Use a meaningful lucide icon.
- Use the existing metric-card color variants.
- Avoid unnecessary charts inside cards.

Recommended responsive layout:

```text
1 column → small screens
2 columns → medium screens
4–5 columns → large screens
```

Example:

```tsx
<div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
```

If a page genuinely needs five cards:

```tsx
lg:grid-cols-5
```

Do not force five cards when the information does not justify them.

---

# 6. Loading Summary Cards

Use `Deferred` when data can be loaded independently.

Pattern:

```tsx
<Deferred
    data="stats"
    fallback={<MetricCardsSkeleton />}
>
    ...
</Deferred>
```

Metric cards should enter subtly after their data becomes available.

Preferred animation:

```text
animate-in
fade-in
slide-in-from-top-6
duration-1000
ease-in-out
```

Do not animate every individual child independently.

---

# 7. Data Tables

Use the existing `DataTable` component as the standard table implementation.

Do not create page-specific table systems.

Every management table should support, where applicable:

- Search
- Server-side filters
- Pagination
- Page-size selection
- Sorting if supported by the existing component
- Row actions
- Empty state
- Loading state
- Responsive behavior

Recommended table structure:

```text
Table Header
│
├── Title
├── Search
├── Filters
└── Optional toolbar controls

Table Body

Pagination
```

---

# 8. Table Search

Search should be server-side for large datasets.

Search fields should match the page's useful identifiers.

Use a concise placeholder.

Examples:

```text
Search...
Search records...
Search by name...
```

Do not use long explanatory placeholders.

Preserve search state when navigating pagination.

---

# 9. Server-side Filters

Use the existing DataTable filter system.

Preferred behavior:

```text
Select filter
    ↓
Request server data
    ↓
Update table
```

When filters change:

- Reset to page 1.
- Preserve other active filters.
- Preserve page size.
- Preserve the current page state when appropriate.
- Preserve scroll position.

Use the existing `router.get` pattern.

---

# 10. Clear Filters

Provide a clear/reset mechanism whenever multiple filters are available.

Clear behavior should:

- Remove active filters.
- Preserve page size where useful.
- Return to page 1.
- Preserve the current layout state.

Avoid manually clearing individual UI states if the existing DataTable filter API can manage them centrally.

---

# 11. Pagination

Use server-side pagination.

Do not load an entire large dataset into the browser simply to paginate it client-side.

Expected pagination information:

```ts
{
    current_page,
    last_page,
    per_page,
    total
}
```

Page-size changes should reset the page to 1.

---

# 12. Table Actions

Keep actions inside the row action area.

Use a compact action menu when multiple actions exist.

Preferred pattern:

```text
View
Edit
More
```

The `More` menu can contain contextual actions.

Destructive actions must be visually separated from normal actions.

Do not put destructive actions beside the primary page action unless necessary.

---

# 13. Destructive Actions

Use the existing confirmation dialog pattern.

Preferred component:

```tsx
<ConfirmDeleteDialog />
```

Destructive operations must:

1. Open confirmation.
2. Explain what will happen.
3. Identify the affected record.
4. Show processing state.
5. Disable repeated submission.
6. Display success feedback.
7. Display error feedback.
8. Refresh or preserve the current page state correctly.

Never perform destructive actions silently.

---

# 14. Forms

All forms should use a consistent structure.

```text
Form
│
├── Section
│   ├── Label
│   ├── Input
│   └── Helper / Error
│
├── Section
│
└── Form Actions
```

Use shadcn form controls wherever available.

Prefer:

- Clear labels
- Helpful placeholders
- Inline validation
- Required indicators where appropriate
- Server validation messages
- Disabled state during submission

Do not rely on placeholder text as the only field label.

---

# 15. Create and Edit Pages

Create and edit pages should share the same form design.

Avoid building two completely different form UIs.

Preferred architecture:

```text
Create Page
    ↓
Reusable Form

Edit Page
    ↓
Same Reusable Form
```

Only the initial data and submit behavior should differ where possible.

---

# 16. Detail Pages

Detail pages should prioritize information hierarchy.

Preferred structure:

```text
Header
│
├── Identity / Title
├── Status
└── Contextual Actions
│
├── Summary Cards
│
└── Tabs
    ├── Overview
    ├── Related Information
    ├── History
    └── Other Context
```

Use tabs when the record contains several logically distinct areas.

Do not place every piece of information into one extremely long page.

---

# 17. Detail Page Tabs

Use shadcn tabs.

Recommended behavior:

- Keep tab labels short.
- Preserve the selected tab when appropriate.
- Use badges for counts only when useful.
- Avoid more tabs than users can understand at a glance.
- Group related information logically.

Tabs should represent meaningful sections, not individual fields.

---

# 18. Cards and Content Sections

Use shadcn `Card` for grouped information.

Card structure:

```text
Card
├── Header
│   ├── Title
│   └── Description
├── Content
└── Optional Footer
```

Avoid nesting many cards inside cards.

Use simple sections when a card does not add meaningful visual separation.

---

# 19. Status Indicators

Use consistent status badges.

Recommended semantic states:

```text
Active
Pending
Inactive
Suspended
Approved
Rejected
Completed
Paid
Unpaid
Overdue
```

Do not create arbitrary colors for each page.

Use the project's existing semantic badge/color system.

Status should be readable from text, not color alone.

---

# 20. Empty States

Every list and table must have a useful empty state.

Structure:

```text
Icon

No records found

Short explanation

Optional primary action
```

Example:

```text
No records found

There are no records matching the current filters.

[Clear Filters]
```

When there are genuinely no records at all, the empty state may offer the relevant creation action.

---

# 21. Skeleton Loading

Use skeletons instead of blank spaces while server data is loading.

Create page-specific skeletons only when the existing generic skeleton is insufficient.

Examples:

```text
MetricCardsSkeleton
TableSkeleton
FormSkeleton
DetailSkeleton
```

Skeletons should approximate the final layout.

Do not use a spinner as the only loading experience for an entire page.

---

# 22. Deferred Data

Use Inertia `Deferred` for independent or expensive page data.

Preferred pattern:

```tsx
<Deferred
    data="records"
    fallback={<TableSkeleton />}
>
    <DataTable ... />
</Deferred>
```

This allows the page shell and lightweight information to appear quickly.

Use separate deferred blocks when summary and main dataset have different loading characteristics.

---

# 23. Animation System

Use subtle Tailwind enter animations consistent with the existing project.

For summary content:

```text
fade-in
slide-in-from-top-6
```

For main content:

```text
fade-in
slide-in-from-bottom-6
```

Recommended duration:

```text
duration-700
```

to

```text
duration-1000
```

Use `ease-in-out`.

Animations should communicate page entrance and loading completion.

Avoid:

- Bouncing cards
- Excessive scaling
- Large movement
- Continuous animations
- Animating every table row

---

# 24. Navigation / Page Transition

Use the existing application's navigation transition behavior.

If no page transition exists, use a subtle opacity/position transition that does not delay interaction.

Do not add a large transition library solely for page navigation.

Navigation should feel:

```text
Fast
Smooth
Subtle
Professional
```

---

# 25. Dialogs

Use shadcn dialogs for focused interactions.

Use dialogs for:

- Confirmations
- Small forms
- Quick updates
- Short workflows

Do not put large multi-section forms into small dialogs.

For complex workflows, use a dedicated page.

---

# 26. Sheets / Drawers

Use a sheet/drawer when the user needs contextual information without leaving the current table.

Good use cases:

```text
Quick details
Preview
Small edit
Activity information
```

Do not use a drawer when the content requires extensive editing.

---

# 27. Toast Notifications

Use Sonner consistently.

Success:

```text
toast.success(...)
```

Error:

```text
toast.error(...)
```

Use concise messages.

Good:

```text
Record created successfully.
Payment approved successfully.
Changes saved successfully.
```

Avoid long toast messages.

---

# 28. Permissions

Use the existing permission component for UI visibility.

Example:

```tsx
<PermissionCheck requiredPermission="...">
    <Button>...</Button>
</PermissionCheck>
```

However, UI permission checks are not security by themselves.

Laravel authorization must also protect:

- Routes
- Controllers
- Form requests
- Actions
- Mutations
- Destructive operations

Never trust frontend permissions as the security boundary.

---

# 29. Responsive Design

Desktop is the primary management environment, but every page must remain usable on smaller screens.

### Desktop

Use:

```text
Full sidebar
Full table
Multiple metric cards
Toolbar layout
```

### Tablet

Use:

```text
Wrapped toolbar
2-column metric cards
Responsive table behavior
```

### Mobile

Use:

```text
Single-column cards
Stacked page header
Compact actions
Horizontal table scrolling or responsive table transformation
```

Avoid fixed-width layouts that break the application.

---

# 30. Accessibility

Use semantic HTML and accessible shadcn components.

Requirements:

- Every input has a label.
- Buttons have clear accessible names.
- Icon-only buttons require `aria-label`.
- Keyboard navigation must work.
- Dialog focus must be managed correctly.
- Color must not be the only way to communicate status.
- Focus states must remain visible.
- Tables must remain understandable with assistive technology.
- Destructive confirmations must clearly identify the affected record.

---

# 31. Typography

Follow the existing Tailwind typography system.

Preferred hierarchy:

```text
Page title:
text-lg font-semibold

Section title:
text-sm or text-base font-medium

Description:
text-xs text-muted-foreground

Table text:
text-sm

Supporting metadata:
text-xs text-muted-foreground
```

Avoid oversized dashboard typography.

The application should feel compact and information-dense without becoming difficult to scan.

---

# 32. Spacing

Use a consistent spacing scale.

Typical page:

```text
p-6
mt-6
gap-2
gap-4
```

Use larger spacing only between major sections.

Avoid arbitrary spacing values unless the design specifically requires them.

---

# 33. Color Usage

Use the project's theme tokens.

Prefer:

```text
background
foreground
muted
muted-foreground
border
primary
destructive
success
warning
```

Do not hardcode colors repeatedly.

Support the existing light/dark theme.

Status colors should follow semantic meaning.

---

# 34. Icons

Use `lucide-react`.

Icons should:

- Support the meaning of the action.
- Remain visually consistent.
- Use standard sizing.

Typical icon size:

```text
h-4 w-4
```

Do not use icons merely as decoration when they add no meaning.

---

# 35. Data Architecture for UI

Pages should receive server-generated data through Inertia props.

Keep large datasets paginated.

Prefer:

```text
records
stats
filters
pagination
```

rather than sending unrelated data to every page.

Type all Inertia props with TypeScript.

Avoid `any` unless unavoidable and explicitly justified.

---

# 36. URL State

Search, filters, pagination, and sorting should be reflected in the URL when they are server-side concerns.

Benefits:

- Refreshable state
- Shareable URLs
- Browser back/forward support
- Predictable navigation

Use Inertia router methods consistently.

---

# 37. Preserve State

When changing table filters or pagination:

```text
preserveState: true
preserveScroll: true
```

where appropriate.

Do not reset unrelated page state after every request.

---

# 38. Error Handling

Every mutation should handle:

```text
Success
Validation error
Authorization error
Server error
Network/request failure
```

Display user-friendly feedback.

Do not expose raw Laravel exceptions to users.

Development logs may contain detailed diagnostics, but UI messages should remain clear.

---

# 39. Performance

Use:

- Server-side pagination
- Deferred props
- Lazy loading where appropriate
- Reusable components
- Minimal unnecessary React state
- Stable table column definitions
- Proper Laravel query optimization

Avoid:

- Loading entire datasets unnecessarily
- Repeated API requests
- Large duplicated components
- Rendering expensive content before it is needed

---

# 40. Component Reuse Rules

Before creating a component:

1. Search the existing codebase.
2. Check shadcn/ui.
3. Check existing custom components.
4. Reuse if the behavior and design are close enough.
5. Extend an existing component when practical.
6. Create a new component only when the pattern is genuinely reusable or domain-specific.

Avoid duplicate components such as:

```text
CustomButton
NewButton
AdminButton
StudentButton
TableButton
```

when the existing shadcn `Button` already handles the requirement.

---

# 41. Testing Requirements

Every implemented Admin module must include appropriate automated tests.

## PHP / Laravel Tests

Use the project's existing PHP testing framework.

Test:

- Authorization
- Validation
- Database behavior
- CRUD operations
- Business rules
- Status transitions
- Relationships
- Permissions
- Destructive actions
- Important workflows

Run the PHP test suite before considering the implementation complete.

Use the project's configured test command rather than assuming a new testing setup.

Example:

```bash
php artisan test
```

If the project uses Pest directly, run the configured Pest suite as appropriate.

---

# 42. Frontend Tests

Where frontend tests already exist in the project, cover important UI behavior such as:

- Rendering
- Search behavior
- Filter behavior
- Pagination interaction
- Dialog behavior
- Form validation
- Permission-based visibility
- Loading states

Do not introduce a new frontend testing framework without first checking the existing project setup.

---

# 43. End-to-End Testing

Important user journeys should be tested at the browser level where the project already supports E2E testing.

Examples of critical workflows:

```text
Open management page
Search record
Filter records
Open detail
Create record
Edit record
Perform important status change
Confirm destructive action
Complete important approval workflow
```

Use the existing E2E framework in the project.

---

# 44. Test Data

Use factories and seeders for repeatable test data.

Do not depend on manually created database records.

Test data should cover:

```text
Empty dataset
Single record
Large dataset
Different statuses
Validation failures
Unauthorized user
Authorized user
Edge cases
```

---

# 45. PHP Test Requirement

PHP tests are mandatory for backend functionality.

Before completion:

```bash
php artisan test
```

must pass.

If the project uses Pest:

```bash
./vendor/bin/pest
```

may be used according to the existing project configuration.

Do not skip backend tests because the UI appears to work.

---

# 46. Quality Checklist

Before marking a page complete:

### UI

- [ ] Page header is consistent.
- [ ] Typography follows the design system.
- [ ] Spacing follows the design system.
- [ ] Existing components are reused.
- [ ] Icons use lucide-react.
- [ ] Dark mode works.
- [ ] Responsive layout works.

### Data

- [ ] Server-side pagination works.
- [ ] Search works.
- [ ] Filters work.
- [ ] URL state is preserved where appropriate.
- [ ] Empty state exists.
- [ ] Loading skeleton exists.
- [ ] Error state is handled.

### Interactions

- [ ] Primary action is obvious.
- [ ] Row actions are contextual.
- [ ] Destructive actions require confirmation.
- [ ] Success feedback uses Sonner.
- [ ] Error feedback uses Sonner or inline validation.
- [ ] Buttons show processing/disabled state.

### Security

- [ ] Backend authorization exists.
- [ ] Permissions are checked server-side.
- [ ] UI permission checks are used where appropriate.
- [ ] Unauthorized actions cannot be performed through direct requests.

### Testing

- [ ] PHP/Laravel tests pass.
- [ ] Pest tests pass if configured.
- [ ] Existing frontend tests pass.
- [ ] Existing E2E tests pass.
- [ ] Important workflows are covered.

---

# 47. Visual Reference Pattern

The existing management page pattern should remain the baseline:

```text
┌─────────────────────────────────────────────────────────────┐
│ Page Title                                  + Primary Action │
│ Short description                                           │
└─────────────────────────────────────────────────────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Metric     │ │ Metric     │ │ Metric     │ │ Metric     │
│ Value      │ │ Value      │ │ Value      │ │ Value      │
│ Supporting │ │ Supporting │ │ Supporting │ │ Supporting │
└────────────┘ └────────────┘ └────────────┘ └────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Table Title                         Search     Filters      │
├─────────────────────────────────────────────────────────────┤
│ Column       Column       Column       Status       Actions │
│                                                             │
│ Data rows                                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Pagination                              Page size           │
└─────────────────────────────────────────────────────────────┘
```

This pattern should be reused across the Admin portal so users learn the interface once and can operate every module consistently.

---

# 48. Final Standard

The Admin portal should feel like one application, not a collection of independently designed pages.

The standard interaction should be:

```text
Summary
   ↓
Search / Filter
   ↓
DataTable
   ↓
View / Edit
   ↓
Detail
   ↓
Contextual Action
   ↓
Toast / Updated State
```

Every new Admin page should follow this system unless there is a strong UX reason to use a different pattern.
