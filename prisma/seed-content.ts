// prisma/seed-content.ts
import { PrismaClient, PageKey } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Home placeholders
  const homeData = {
    heroBg: "/hero.jpg",
    ctaBg: "/images/cta/cta-bg.jpg",
    programmes: [
      {
        id: "youth-dev",
        title: "Youth Development",
        description: "Grassroots programs that grow the next generation of players and officials.",
        cta: "Explore",
        bgImage: "/images/home/programmes/youth.jpg",
      },
      {
        id: "coaching",
        title: "Coaching & Officiating",
        description: "Training and certification pathways for coaches and referees.",
        cta: "Learn more",
        bgImage: "/images/home/programmes/coaching.jpg",
      },
      {
        id: "competitions",
        title: "Competitions",
        description: "Leagues and tournaments that raise the standard of play nationwide.",
        cta: "See fixtures",
        bgImage: "/images/home/programmes/competitions.jpg",
      },
    ],
  }

  // About placeholders
  const aboutData = {
    heroBg: "/images/ABOUT_hero.jpg",
    missionVision: {
      sectionBg: "/images/ABOUT_mission_bg.jpg",
      missionBg: "/images/ABOUT_mission_card.jpg",
      visionBg: "/images/ABOUT_vision_card.jpg",
      motto: "One Board, One People",
      mission:
        "To develop and promote darts across Malawi through inclusive programs, strong governance, and partnerships.",
      vision:
        "A thriving darts ecosystem that nurtures talent and unites communities in every district.",
    },
    coreValues: {
      sectionBg: "/images/ABOUT_values_bg.jpg",
      items: [
        { title: "Integrity", desc: "We uphold fairness and transparency in all our activities.", bgImage: "/images/about/values/integrity.jpg" },
        { title: "Excellence", desc: "We strive for quality in coaching, officiating, and competition.", bgImage: "/images/about/values/excellence.jpg" },
        { title: "Inclusion", desc: "We welcome all ages and backgrounds to participate and lead.", bgImage: "/images/about/values/inclusion.jpg" },
        { title: "Community", desc: "We build strong local programs that serve people first.", bgImage: "/images/about/values/community.jpg" },
        { title: "Teamwork", desc: "We win together on and off the oche.", bgImage: "/images/about/values/teamwork.jpg" },
        { title: "Respect", desc: "We respect players, officials, and the game itself.", bgImage: "/images/about/values/respect.jpg" },
      ],
    },
  }

  // Upserts
  await prisma.siteContent.upsert({
    where: { page: PageKey.HOME },
    update: { data: homeData },
    create: { page: PageKey.HOME, data: homeData },
  })

  await prisma.siteContent.upsert({
    where: { page: PageKey.ABOUT },
    update: { data: aboutData },
    create: { page: PageKey.ABOUT, data: aboutData },
  })

  console.log("Seeded site content for HOME and ABOUT")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
