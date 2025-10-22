/* eslint-disable no-console */
import { PrismaClient, FixtureType, FixtureStatus } from "@prisma/client";

const prisma = new PrismaClient();

/** =========================
 * Types copied from your static file
 * ========================= */
type EventType =
  | "SMK Trading CRDL"
  | "Friendly"
  | "Tournament"
  | "Training"
  | "Community"
  | "Workshop";

type FixtureEvent = {
  id: string;
  type: EventType;
  title: string;
  date: string; // ISO
  endDate?: string;
  venue: string;
  city?: string;
  description?: string;
  homeTeam?: string;
  awayTeam?: string;
  kickoffTBA?: boolean;
  venueTBA?: boolean;
};

type FixturesWeek = {
  weekLabel: string;
  weekStartISO: string;
  events: FixtureEvent[];
};

/** =========================
 * Venue map copied from your data
 * ========================= */
const HOME_VENUE: Record<string, { venue: string; city?: string }> = {
  "C2K Crocs": { venue: "Area 18 Bar & Grill, Lilongwe", city: "Lilongwe" },
  "CIVO Darts": { venue: "Civil Service Stadium, Lilongwe", city: "Lilongwe" },
  "Bunda Arrows": { venue: "Watatu's Area 49 New Gulliver, Lilongwe", city: "Lilongwe" },
  SMEDI: { venue: "SMEDI, Mponela", city: "Mponela" },
  "Engineers Battalion": { venue: "Engineers Battalion, Kasungu", city: "Kasungu" },
  Airbourne: { venue: "Airbourne Salima", city: "Salima" },
  "LUANAR Staff": { venue: "LUANAR Bunda Campus, Lilongwe", city: "Lilongwe" },
  "VOX Populi Lions": { venue: "Vox Populi Old Wenela, Lilongwe", city: "Lilongwe" },
  RBM: { venue: "RBM Clubhouse, Area 47, Lilongwe", city: "Lilongwe" },
  "Green Shelter": { venue: "Green Shelter, Area 49 Shire, Lilongwe", city: "Lilongwe" },
  "KB Snippers": { venue: "Kamuzu Barracks, Lilongwe", city: "Lilongwe" },
  "Lilongwe Airbase": { venue: "Old Airport Club, Airwing, Lilongwe", city: "Lilongwe" },
  Hazards: { venue: "Mpaweni, Lilongwe", city: "Lilongwe" },
};

/** =========================
 * Full fixtures weeks copied from your data
 * Note: Week 27 has a Community info card with no teams.
 * We will skip it because the schema requires a homeTeamId.
 * ========================= */
const fixturesByWeek: FixturesWeek[] = [
  {
    weekLabel: "Sep 22 – Sep 28, 2025",
    weekStartISO: "2025-09-22T00:00:00Z",
    events: [
      ev("w14-1", "VOX Populi Lions", "CIVO Darts", "2025-09-27T12:00:00Z"),
      ev("w14-2", "Airbourne", "KB Snippers", "2025-09-27T12:00:00Z"),
      ev("w14-3", "RBM", "C2K Crocs", "2025-09-27T12:00:00Z"),
      ev("w14-4", "Green Shelter", "Engineers Battalion", "2025-09-27T12:00:00Z"),
      ev("w14-5", "Hazards", "Bunda Arrows", "2025-09-27T12:00:00Z"),
      ev("w14-6", "Lilongwe Airbase", "LUANAR Staff", "2025-09-27T12:00:00Z"),
      bye("w14-bye", "SMEDI", "2025-09-27T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Sep 29 – Oct 5, 2025",
    weekStartISO: "2025-09-29T00:00:00Z",
    events: [
      ev("w15-1", "LUANAR Staff", "Hazards", "2025-10-04T12:00:00Z"),
      ev("w15-2", "Bunda Arrows", "Green Shelter", "2025-10-04T12:00:00Z"),
      ev("w15-3", "Engineers Battalion", "RBM", "2025-10-04T12:00:00Z"),
      ev("w15-4", "C2K Crocs", "Airbourne", "2025-10-04T12:00:00Z"),
      ev("w15-5", "KB Snippers", "VOX Populi Lions", "2025-10-04T12:00:00Z"),
      ev("w15-6", "CIVO Darts", "SMEDI", "2025-10-04T12:00:00Z"),
      bye("w15-bye", "Lilongwe Airbase", "2025-10-04T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Oct 6 – Oct 12, 2025",
    weekStartISO: "2025-10-06T00:00:00Z",
    events: [
      ev("w16-1", "SMEDI", "KB Snippers", "2025-10-11T12:00:00Z"),
      ev("w16-2", "VOX Populi Lions", "C2K Crocs", "2025-10-11T12:00:00Z"),
      ev("w16-3", "Airbourne", "Engineers Battalion", "2025-10-11T12:00:00Z"),
      ev("w16-4", "RBM", "Bunda Arrows", "2025-10-11T12:00:00Z"),
      ev("w16-5", "Green Shelter", "LUANAR Staff", "2025-10-11T12:00:00Z"),
      ev("w16-6", "Hazards", "Lilongwe Airbase", "2025-10-11T12:00:00Z"),
      bye("w16-bye", "CIVO Darts", "2025-10-11T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Oct 13 – Oct 19, 2025",
    weekStartISO: "2025-10-13T00:00:00Z",
    events: [
      ev("w17-1", "Lilongwe Airbase", "Green Shelter", "2025-10-18T12:00:00Z"),
      ev("w17-2", "LUANAR Staff", "RBM", "2025-10-18T12:00:00Z"),
      ev("w17-3", "Bunda Arrows", "Airbourne", "2025-10-18T12:00:00Z"),
      ev("w17-4", "Engineers Battalion", "VOX Populi Lions", "2025-10-18T12:00:00Z"),
      ev("w17-5", "C2K Crocs", "SMEDI", "2025-10-18T12:00:00Z"),
      ev("w17-6", "KB Snippers", "CIVO Darts", "2025-10-18T12:00:00Z"),
      bye("w17-bye", "Hazards", "2025-10-18T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Oct 20 – Oct 26, 2025",
    weekStartISO: "2025-10-20T00:00:00Z",
    events: [
      ev("w18-1", "CIVO Darts", "C2K Crocs", "2025-10-25T12:00:00Z"),
      ev("w18-2", "SMEDI", "Engineers Battalion", "2025-10-25T12:00:00Z"),
      ev("w18-3", "VOX Populi Lions", "Bunda Arrows", "2025-10-25T12:00:00Z"),
      ev("w18-4", "Airbourne", "LUANAR Staff", "2025-10-25T12:00:00Z"),
      ev("w18-5", "RBM", "Lilongwe Airbase", "2025-10-25T12:00:00Z"),
      ev("w18-6", "Green Shelter", "Hazards", "2025-10-25T12:00:00Z"),
      bye("w18-bye", "KB Snippers", "2025-10-25T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Oct 27 – Nov 2, 2025",
    weekStartISO: "2025-10-27T00:00:00Z",
    events: [
      ev("w19-1", "Hazards", "RBM", "2025-11-01T12:00:00Z"),
      ev("w19-2", "Lilongwe Airbase", "Airbourne", "2025-11-01T12:00:00Z"),
      ev("w19-3", "LUANAR Staff", "VOX Populi Lions", "2025-11-01T12:00:00Z"),
      ev("w19-4", "Bunda Arrows", "SMEDI", "2025-11-01T12:00:00Z"),
      ev("w19-5", "Engineers Battalion", "CIVO Darts", "2025-11-01T12:00:00Z"),
      ev("w19-6", "C2K Crocs", "KB Snippers", "2025-11-01T12:00:00Z"),
      bye("w19-bye", "Green Shelter", "2025-11-01T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Nov 3 – Nov 9, 2025",
    weekStartISO: "2025-11-03T00:00:00Z",
    events: [
      ev("w20-1", "KB Snippers", "Engineers Battalion", "2025-11-08T12:00:00Z"),
      ev("w20-2", "CIVO Darts", "Bunda Arrows", "2025-11-08T12:00:00Z"),
      ev("w20-3", "SMEDI", "LUANAR Staff", "2025-11-08T12:00:00Z"),
      ev("w20-4", "VOX Populi Lions", "Lilongwe Airbase", "2025-11-08T12:00:00Z"),
      ev("w20-5", "Airbourne", "Hazards", "2025-11-08T12:00:00Z"),
      ev("w20-6", "RBM", "Green Shelter", "2025-11-08T12:00:00Z"),
      bye("w20-bye", "C2K Crocs", "2025-11-08T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Nov 10 – Nov 16, 2025",
    weekStartISO: "2025-11-10T00:00:00Z",
    events: [
      ev("w21-1", "Green Shelter", "Airbourne", "2025-11-15T12:00:00Z"),
      ev("w21-2", "Hazards", "VOX Populi Lions", "2025-11-15T12:00:00Z"),
      ev("w21-3", "Lilongwe Airbase", "SMEDI", "2025-11-15T12:00:00Z"),
      ev("w21-4", "LUANAR Staff", "CIVO Darts", "2025-11-15T12:00:00Z"),
      ev("w21-5", "Bunda Arrows", "KB Snippers", "2025-11-15T12:00:00Z"),
      ev("w21-6", "Engineers Battalion", "C2K Crocs", "2025-11-15T12:00:00Z"),
      bye("w21-bye", "RBM", "2025-11-15T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Nov 17 – Nov 23, 2025",
    weekStartISO: "2025-11-17T00:00:00Z",
    events: [
      ev("w22-1", "C2K Crocs", "Bunda Arrows", "2025-11-22T12:00:00Z"),
      ev("w22-2", "KB Snippers", "LUANAR Staff", "2025-11-22T12:00:00Z"),
      ev("w22-3", "CIVO Darts", "Lilongwe Airbase", "2025-11-22T12:00:00Z"),
      ev("w22-4", "SMEDI", "Hazards", "2025-11-22T12:00:00Z"),
      ev("w22-5", "VOX Populi Lions", "Green Shelter", "2025-11-22T12:00:00Z"),
      ev("w22-6", "Airbourne", "RBM", "2025-11-22T12:00:00Z"),
      bye("w22-bye", "Engineers Battalion", "2025-11-22T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Nov 24 – Nov 30, 2025",
    weekStartISO: "2025-11-24T00:00:00Z",
    events: [
      ev("w23-1", "RBM", "VOX Populi Lions", "2025-11-29T12:00:00Z"),
      ev("w23-2", "Green Shelter", "SMEDI", "2025-11-29T12:00:00Z"),
      ev("w23-3", "Hazards", "CIVO Darts", "2025-11-29T12:00:00Z"),
      ev("w23-4", "Lilongwe Airbase", "KB Snippers", "2025-11-29T12:00:00Z"),
      ev("w23-5", "LUANAR Staff", "C2K Crocs", "2025-11-29T12:00:00Z"),
      ev("w23-6", "Bunda Arrows", "Engineers Battalion", "2025-11-29T12:00:00Z"),
      bye("w23-bye", "Airbourne", "2025-11-29T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Dec 1 – Dec 7, 2025",
    weekStartISO: "2025-12-01T00:00:00Z",
    events: [
      ev("w24-1", "Engineers Battalion", "LUANAR Staff", "2025-12-06T12:00:00Z"),
      ev("w24-2", "C2K Crocs", "Lilongwe Airbase", "2025-12-06T12:00:00Z"),
      ev("w24-3", "KB Snippers", "Hazards", "2025-12-06T12:00:00Z"),
      ev("w24-4", "CIVO Darts", "Green Shelter", "2025-12-06T12:00:00Z"),
      ev("w24-5", "SMEDI", "RBM", "2025-12-06T12:00:00Z"),
      ev("w24-6", "VOX Populi Lions", "Airbourne", "2025-12-06T12:00:00Z"),
      bye("w24-bye", "Bunda Arrows", "2025-12-06T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Dec 8 – Dec 14, 2025",
    weekStartISO: "2025-12-08T00:00:00Z",
    events: [
      ev("w25-1", "Airbourne", "SMEDI", "2025-12-13T12:00:00Z"),
      ev("w25-2", "RBM", "CIVO Darts", "2025-12-13T12:00:00Z"),
      ev("w25-3", "Green Shelter", "KB Snippers", "2025-12-13T12:00:00Z"),
      ev("w25-4", "Hazards", "C2K Crocs", "2025-12-13T12:00:00Z"),
      ev("w25-5", "Lilongwe Airbase", "Engineers Battalion", "2025-12-13T12:00:00Z"),
      ev("w25-6", "LUANAR Staff", "Bunda Arrows", "2025-12-13T12:00:00Z"),
      bye("w25-bye", "VOX Populi Lions", "2025-12-13T12:00:00Z"),
    ],
  },
  {
    weekLabel: "Dec 15 – Dec 21, 2025",
    weekStartISO: "2025-12-15T00:00:00Z",
    events: [
      ev("w26-1", "Bunda Arrows", "Lilongwe Airbase", "2025-12-20T12:00:00Z"),
      ev("w26-2", "Engineers Battalion", "Hazards", "2025-12-20T12:00:00Z"),
      ev("w26-3", "C2K Crocs", "Green Shelter", "2025-12-20T12:00:00Z"),
      ev("w26-4", "KB Snippers", "RBM", "2025-12-20T12:00:00Z"),
      ev("w26-5", "CIVO Darts", "Airbourne", "2025-12-20T12:00:00Z"),
      ev("w26-6", "SMEDI", "VOX Populi Lions", "2025-12-20T12:00:00Z"),
      bye("w26-bye", "LUANAR Staff", "2025-12-20T12:00:00Z"),
    ],
  },
  // Week 27 is a Community info card with no teams. We skip it in seeding.
];

/** Helpers to build events exactly like your data file */
function ev(id: string, home: string, away: string, iso: string): FixtureEvent {
  const title = `${home} vs ${away}`;
  const mapped = HOME_VENUE[home];
  return {
    id,
    type: "SMK Trading CRDL",
    title,
    date: iso,
    venue: mapped?.venue ?? "TBA",
    city: mapped?.city,
    description: " ",
    homeTeam: home,
    awayTeam: away,
    kickoffTBA: true,
    venueTBA: !mapped,
  };
}

function bye(id: string, team: string, iso: string): FixtureEvent {
  return {
    id,
    type: "SMK Trading CRDL",
    title: `${team} Bye`,
    date: iso,
    venue: "N/A",
    description: `${team} has a bye this week.`,
    homeTeam: team,
    awayTeam: "N/A",
    kickoffTBA: true,
    venueTBA: true,
  };
}

/** =========================
 * Seed logic
 * ========================= */
const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const typeMap: Record<EventType, FixtureType> = {
  "SMK Trading CRDL": "SMK_TRADING_CRDL",
  Friendly: "FRIENDLY",
  Tournament: "TOURNAMENT",
  Training: "TRAINING",
  Community: "COMMUNITY",
  Workshop: "WORKSHOP",
};

async function main() {
  const season = "2025";

  // 1) Collect all team names from venue map and from fixtures
  const teamNames = new Set<string>(Object.keys(HOME_VENUE));
  for (const w of fixturesByWeek) {
    for (const e of w.events) {
      if (e.homeTeam) teamNames.add(e.homeTeam);
      if (e.awayTeam && e.awayTeam !== "N/A") teamNames.add(e.awayTeam);
    }
  }

  // 2) Upsert teams with home venue metadata
  const teamsByName: Record<string, string> = {};
  for (const name of Array.from(teamNames)) {
    const slug = toSlug(name);
    const hv = HOME_VENUE[name];
    const team = await prisma.team.upsert({
      where: { slug },
      update: {
        name,
        city: hv?.city,
        homeVenue: hv?.venue,
        homeCity: hv?.city,
        active: true,
      },
      create: {
        name,
        slug,
        city: hv?.city,
        homeVenue: hv?.venue,
        homeCity: hv?.city,
        active: true,
      },
      select: { id: true },
    });
    teamsByName[name] = team.id;
  }

  // 3) Create fixtures. Week numbers are 14 to 26 in order
  let weekNumber = 14;
  let created = 0;

  for (const w of fixturesByWeek) {
    for (const e of w.events) {
      const isBye = e.title.endsWith("Bye");
      // Skip the Week 27 community info card or any event without a real home team
      if (!e.homeTeam) continue;

      const homeId = teamsByName[e.homeTeam];
      const awayId = e.awayTeam && e.awayTeam !== "N/A" ? teamsByName[e.awayTeam] : undefined;
      const type = typeMap[e.type];

      // Idempotent create: rely on the unique constraint with connectOrCreate-like behavior
      // Prisma does not support connectOrCreate on unrelated unique, so we try create
      // and if it fails because it already exists, we ignore.
      try {
        await prisma.fixture.create({
          data: {
            season,
            week: weekNumber,
            title: e.title,
            date: new Date(e.date),
            endDate: e.endDate ? new Date(e.endDate) : null,
            type,
            venue: e.venue ?? "TBA",
            city: e.city ?? null,
            description: e.description ?? null,
            venueTBA: Boolean(e.venueTBA),
            kickoffTBA: Boolean(e.kickoffTBA),
            status: "SCHEDULED",
            isBye,

            homeTeam: { connect: { id: homeId } },
            ...(awayId ? { awayTeam: { connect: { id: awayId } } } : {}),
          },
        });
        created += 1;
      } catch (err: any) {
        // If you re-run seeds, duplicates will hit the unique constraint
        // We can safely ignore those
        if (String(err?.code) !== "P2002") {
          console.error("Failed to create fixture", e.id, err);
          throw err;
        }
      }
    }
    weekNumber += 1;
  }

  console.log(`Seed complete: ${Object.keys(teamsByName).length} teams upserted, ${created} fixtures created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
