/**
 * Permission slug from the `permissions` table, e.g. `students.view`.
 *
 * Slugs are seeded by `Database\Seeders\RolePermissionSeeder` and are editable
 * per role at runtime, so this deliberately stays a string rather than a union
 * that would drift out of sync with the database.
 */
export type PermissionSlug = string;
