import "./env";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userEmail = process.env.USER_EMAIL || "operator@voiceagent.local";
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@voiceagent.local";

  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: userEmail,
      password: await bcrypt.hash(process.env.USER_PASSWORD || "Operator123!", 10),
      name: process.env.USER_NAME || "Operator",
      role: "user",
    },
  });

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || "Admin123!", 10),
      name: process.env.SUPER_ADMIN_NAME || "Super Admin",
      role: "super_admin",
    },
  });

  await prisma.agentConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Aria",
      tone: "professional",
      description:
        "A senior outbound and inbound voice specialist who qualifies executives, answers from the knowledge base, and books meetings when the conversation turns to pricing, NDAs, or next steps.",
      targetTitles: JSON.stringify(["CEO", "CFO", "CTO", "COO", "VP Sales", "VP Marketing", "Founder", "Director"]),
      qualificationRounds: 3,
      collectName: true,
      collectCompany: true,
      collectEmail: true,
      emailRequiredOnChat: false,
      voiceId: "shimmer",
      greeting:
        "Hey there — I'm Aria! Great to connect. Who am I chatting with today, and what brought you here?",
    },
  });

  await prisma.handoffRule.deleteMany();
  await prisma.handoffRule.createMany({
    data: [
      {
        name: "Pricing",
        triggers: JSON.stringify(["pricing", "price", "cost", "quote", "how much", "budget", "proposal"]),
        action: "book_meeting",
        transferTo: "Sales",
        enabled: true,
        description: "When the caller asks about pricing, quotes, or budget — qualify, then book a pricing meeting.",
        sortOrder: 1,
      },
      {
        name: "NDA",
        triggers: JSON.stringify(["nda", "non-disclosure", "confidential", "legal review", "paperwork"]),
        action: "book_meeting",
        transferTo: "Legal / Sales",
        enabled: true,
        description: "When NDA or legal paperwork comes up — capture details and schedule an NDA review.",
        sortOrder: 2,
      },
      {
        name: "Meeting",
        triggers: JSON.stringify(["meeting", "demo", "call back", "schedule", "calendar", "book time", "intro call"]),
        action: "book_meeting",
        transferTo: "Calendar",
        enabled: true,
        description: "When they want a live conversation — offer times and create a meeting.",
        sortOrder: 3,
      },
      {
        name: "Human transfer",
        triggers: JSON.stringify(["speak to a human", "real person", "transfer me", "talk to sales", "escalate"]),
        action: "transfer",
        transferTo: "On-call operator",
        enabled: true,
        description: "Warm-handoff the live call to a human when the visitor asks to speak to someone.",
        sortOrder: 4,
      },
    ],
  });

  const settings: { key: string; value: string }[] = [
    { key: "company_name", value: "Voice Agent" },
    { key: "company_website", value: "" },
    { key: "timezone", value: "UTC" },
    { key: "meeting_duration", value: "30" },
    { key: "notify_email", value: userEmail },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log("Seeded single-tenant Voice Agent.");
  console.log(`Operator login:  ${userEmail}`);
  console.log(`Super admin:     ${adminEmail}  →  /admin/login`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
