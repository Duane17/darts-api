/* prisma/seed.announcements.ts
   Seeds announcements with deterministic UUIDs so re runs are idempotent.
   Usage:
     pnpm ts-node prisma/seed.announcements.ts
*/

import { PrismaClient, AnnouncementPriority } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

/** RFC 4122 v5 UUID from a name and namespace using SHA 1 */
function uuidv5(name: string, namespace: string) {
  const ns = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = crypto.createHash("sha1").update(ns).update(name).digest();

  // Take first 16 bytes to form UUID
  const bytes = Buffer.from(hash.slice(0, 16));

  // Set version to 5
  bytes[6] = (bytes[6] & 0x0f) | 0x50;

  // Set variant to RFC 4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/** Fixed namespace for your project to keep IDs stable across environments */
const NAMESPACE = "6ba7b811-9dad-11d1-80b4-00c04fd430c8"; // standard DNS namespace

/** Helper to build a deterministic ID from title + published date */
function makeId(title: string, publishedAtISO: string) {
  return uuidv5(`${title}::${publishedAtISO}`, NAMESPACE);
}

/** Canonical seed block. Keep dates explicit so ids remain stable. */
const ANNOUNCEMENTS: Array<{
  title: string;
  body: string;
  priority: AnnouncementPriority;
  publishedAt: string; // ISO
  expiresAt?: string;  // ISO
}> = [
  {
    title: "Week 19 Fixtures Confirmed",
    body:
      "SMK Trading CRDL week 19 fixtures are confirmed. Check the fixtures page for kickoff times. Good luck to all teams.",
    priority: "NORMAL",
    publishedAt: "2025-10-16T09:00:00.000Z",
    expiresAt: "2025-11-02T23:59:59.000Z",
  },
  {
    title: "Postponement Notice",
    body:
      "Due to venue availability, one league fixture has been postponed. The new date will be communicated on the fixtures page and WhatsApp groups.",
    priority: "HIGH",
    publishedAt: "2025-10-18T08:00:00.000Z",
    expiresAt: "2025-11-10T23:59:59.000Z",
  },
  {
    title: "Coaching Clinic Registration",
    body:
      "Free coaching clinic for new players and team captains. Limited slots. Register via the form on our site by Friday.",
    priority: "NORMAL",
    publishedAt: "2025-10-20T07:30:00.000Z",
    expiresAt: "2025-11-05T23:59:59.000Z",
  },
  {
    title: "Tournament Sign ups Open",
    body:
      "Mid season open tournament entries are now live. Teams and individual players can register. Rules and format posted on the tournaments page.",
    priority: "LOW",
    publishedAt: "2025-10-22T10:00:00.000Z",
    expiresAt: "2025-11-20T23:59:59.000Z",
  },
  {
    title: "Website Maintenance Window",
    body:
      "We will perform platform maintenance tonight between 22:00 and 23:00 CAT. Brief downtime is possible.",
    priority: "LOW",
    publishedAt: "2025-10-23T16:00:00.000Z",
    expiresAt: "2025-10-24T21:00:00.000Z",
  },
  {
    title: "Safety and Conduct Reminder",
    body:
      "Please respect venue rules and officials. Unsporting behavior will lead to sanctions per league regulations.",
    priority: "HIGH",
    publishedAt: "2025-10-24T07:00:00.000Z",
    expiresAt: "2025-12-31T23:59:59.000Z",
  },
  {
    title: "Community Outreach Day",
    body:
      "Join our outreach at local youth centers next weekend. Volunteers welcome. Sign up on the community page.",
    priority: "NORMAL",
    publishedAt: "2025-10-25T09:30:00.000Z",
    expiresAt: "2025-11-15T23:59:59.000Z",
  },
  {
    title: "Results Publishing Schedule",
    body:
      "Match results are published within 24 hours of verification. If something looks off, report via the results page feedback button.",
    priority: "LOW",
    publishedAt: "2025-10-26T12:00:00.000Z",
    expiresAt: "2025-12-31T23:59:59.000Z",
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  await prisma.$transaction(async (trx) => {
    for (const a of ANNOUNCEMENTS) {
      const id = makeId(a.title, a.publishedAt);

      // Upsert by deterministic id so this is re runnable
      const result = await trx.announcement.upsert({
        where: { id },
        create: {
          id,
          title: a.title,
          body: a.body,
          priority: a.priority,
          publishedAt: new Date(a.publishedAt),
          expiresAt: a.expiresAt ? new Date(a.expiresAt) : undefined,
        },
        update: {
          body: a.body,
          priority: a.priority,
          expiresAt: a.expiresAt ? new Date(a.expiresAt) : null,
        },
      });

      if ((result as any).createdAt && result.createdAt.toISOString() === a.publishedAt) {
        // When first created, createdAt equals publishedAt only if run immediately with same ISO.
        // We will simply track created vs updated using a separate check
      }
      // Simple heuristic to count created vs updated
      if (result.updatedAt.getTime() === result.createdAt.getTime()) {
        created += 1;
      } else {
        updated += 1;
      }
    }
  });

  console.log(`Announcements seeded. Created: ${created}, Updated: ${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
