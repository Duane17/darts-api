/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * SRDL 2025 team list
 * Source of truth: SRDL logtable and fixtures PDF (as at 10 Oct 2025)
 * Groups are included for reference only. We do not store group on Team.
 */
const SRDL_GROUP_A = [
  "Cobbe Stingers",
  "White Eagles",
  "Kapichira",
  "BSC",
  "Nkula Bees",
  "Katimba",
  "BWB",
] as const;

const SRDL_GROUP_B = [
  "MUBAS Ice",
  "Mighty Arrows",
  "NTE Arrows",
  "Tedzani",
  "Newlands Socials",
  "MUBAS Falcons",
] as const;

const SRDL_TEAMS: string[] = [...SRDL_GROUP_A, ...SRDL_GROUP_B];

/** Slug generator consistent with your other seeds */
function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding SRDL teams...");

  const results = [];
  for (const name of SRDL_TEAMS) {
    const slug = toSlug(name);

    const team = await prisma.team.upsert({
      where: { slug },
      update: {
        name,
        // Leave city, homeVenue, homeCity null for now. The PDF has no venues.
        active: true,
      },
      create: {
        name,
        slug,
        active: true,
      },
      select: { id: true, name: true, slug: true },
    });

    results.push(team);
  }

  console.log(`Seed complete. ${results.length} SRDL teams upserted:`);
  for (const t of results) {
    console.log(`- ${t.name} (${t.slug})`);
  }
}

main()
  .catch((e) => {
    console.error("Seed SRDL teams failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
