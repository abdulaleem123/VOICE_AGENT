import "./env";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type IndustrySeed = {
  slug: string;
  name: string;
  industry: string;
  tagline: string;
  description: string;
  sortOrder: number;
  agent: {
    name: string;
    tone: string;
    description: string;
    titles: string;
    voiceId: string;
    greeting: string;
  };
  handoffs: { name: string; triggers: string[]; action: string; transferTo: string; description: string }[];
  knowledgeFile: string;
};

const INDUSTRIES: IndustrySeed[] = [
  {
    slug: "hospital",
    name: "Meridian Health Partners",
    industry: "hospital",
    tagline: "Inbound appointments · outbound reminders",
    description: "Hospital / clinic voice agent for appointments, departments, and patient callbacks.",
    sortOrder: 1,
    agent: {
      name: "Maya",
      tone: "warm",
      description:
        "A calm hospital front-desk voice agent who books appointments, answers department FAQs, and never gives medical advice.",
      titles: JSON.stringify(["Patient", "Caregiver", "Referring Physician", "Insurance Coordinator"]),
      voiceId: "nova",
      greeting: "Hello, Meridian Health Partners — this is Maya. How can I help you today?",
    },
    handoffs: [
      {
        name: "Emergency",
        triggers: ["emergency", "chest pain", "can't breathe", "stroke", "ambulance"],
        action: "transfer",
        transferTo: "Emergency desk",
        description: "Life-threatening symptoms — redirect to emergency services immediately.",
      },
      {
        name: "Appointment",
        triggers: ["appointment", "book", "reschedule", "cancel visit", "doctor"],
        action: "book_meeting",
        transferTo: "Scheduling",
        description: "Book or change clinic appointments.",
      },
      {
        name: "Billing",
        triggers: ["bill", "invoice", "insurance claim", "copay"],
        action: "transfer",
        transferTo: "Billing",
        description: "Account-specific billing — transfer to billing.",
      },
    ],
    knowledgeFile: "hospital.txt",
  },
  {
    slug: "restaurant",
    name: "Ember & Oak Bistro",
    industry: "restaurant",
    tagline: "Reservations · takeout · outbound confirmations",
    description: "Restaurant voice agent for tables, menus, takeout, and reservation confirmations.",
    sortOrder: 2,
    agent: {
      name: "Sofia",
      tone: "friendly",
      description: "A warm host who books tables, answers menu questions, and confirms reservations outbound.",
      titles: JSON.stringify(["Guest", "Party Host", "Corporate Booker"]),
      voiceId: "shimmer",
      greeting: "Hi, Ember & Oak — Sofia speaking. Table for tonight, or can I help with takeout?",
    },
    handoffs: [
      {
        name: "Reservation",
        triggers: ["reservation", "table", "book", "party of", "seating"],
        action: "book_meeting",
        transferTo: "Host stand",
        description: "Table booking and large-party planning.",
      },
      {
        name: "Allergy",
        triggers: ["allergy", "allergic", "gluten", "nut free", "vegan"],
        action: "transfer",
        transferTo: "Kitchen / Host",
        description: "Allergy questions may need kitchen confirmation.",
      },
      {
        name: "Complaint",
        triggers: ["complaint", "manager", "refund", "cold food"],
        action: "transfer",
        transferTo: "Manager",
        description: "Service issues escalate to manager.",
      },
    ],
    knowledgeFile: "restaurant.txt",
  },
  {
    slug: "supermart",
    name: "FreshLane Market",
    industry: "supermart",
    tagline: "Store hours · orders · outbound promos",
    description: "Supermarket voice agent for hours, stock, pickup orders, and promo outreach.",
    sortOrder: 3,
    agent: {
      name: "Leo",
      tone: "friendly",
      description: "A helpful market associate for hours, aisle info, pickup orders, and outbound deal reminders.",
      titles: JSON.stringify(["Shopper", "Store Manager", "Procurement"]),
      voiceId: "echo",
      greeting: "Thanks for calling FreshLane Market — Leo here. How can I help?",
    },
    handoffs: [
      {
        name: "Order",
        triggers: ["pickup", "order", "delivery", "curbside"],
        action: "book_meeting",
        transferTo: "Fulfillment",
        description: "Pickup / order status and scheduling.",
      },
      {
        name: "Stock",
        triggers: ["in stock", "aisle", "price check", "available"],
        action: "transfer",
        transferTo: "Floor desk",
        description: "Live inventory may need floor check.",
      },
      {
        name: "Complaint",
        triggers: ["expired", "refund", "manager", "wrong item"],
        action: "transfer",
        transferTo: "Customer care",
        description: "Product issues escalate to care.",
      },
    ],
    knowledgeFile: "supermart.txt",
  },
  {
    slug: "estate-agency",
    name: "Cornerstone Property Group",
    industry: "estate",
    tagline: "Viewings · listings · outbound follow-ups",
    description: "Estate agency voice agent for viewings, listings, and buyer/seller follow-ups.",
    sortOrder: 4,
    agent: {
      name: "Claire",
      tone: "professional",
      description: "A polished property consultant who qualifies buyers/renters and books viewings.",
      titles: JSON.stringify(["Buyer", "Seller", "Tenant", "Landlord", "Investor"]),
      voiceId: "coral",
      greeting: "Good day — Cornerstone Property Group, Claire speaking. Looking to buy, rent, or book a viewing?",
    },
    handoffs: [
      {
        name: "Viewing",
        triggers: ["viewing", "tour", "see the property", "schedule visit"],
        action: "book_meeting",
        transferTo: "Lettings / Sales",
        description: "Book property viewings.",
      },
      {
        name: "Offer",
        triggers: ["offer", "negotiate", "asking price", "deposit"],
        action: "book_meeting",
        transferTo: "Sales agent",
        description: "Pricing and offers need an agent.",
      },
      {
        name: "Legal",
        triggers: ["contract", "solicitor", "conveyancing", "nda"],
        action: "transfer",
        transferTo: "Legal desk",
        description: "Legal paperwork handoff.",
      },
    ],
    knowledgeFile: "estate-agency.txt",
  },
  {
    slug: "software-house",
    name: "Nimbus Forge Technologies",
    industry: "software",
    tagline: "Demos · inbound leads · outbound SDR",
    description: "Software house voice agent for demos, product FAQs, and outbound SDR qualification.",
    sortOrder: 5,
    agent: {
      name: "Aria",
      tone: "consultative",
      description:
        "A senior outbound and inbound specialist who qualifies executives, answers from the knowledge base, and books demos when pricing or NDA comes up.",
      titles: JSON.stringify(["CEO", "CFO", "CTO", "VP Engineering", "Founder", "Head of Product"]),
      voiceId: "shimmer",
      greeting: "Hey — Aria from Nimbus Forge. Thanks for connecting. How can I help today?",
    },
    handoffs: [
      {
        name: "Pricing",
        triggers: ["pricing", "price", "cost", "quote", "budget"],
        action: "book_meeting",
        transferTo: "Sales",
        description: "Pricing conversations book a sales call.",
      },
      {
        name: "NDA",
        triggers: ["nda", "non-disclosure", "security review"],
        action: "book_meeting",
        transferTo: "Legal / Sales",
        description: "NDA and security paperwork.",
      },
      {
        name: "Demo",
        triggers: ["demo", "meeting", "schedule", "pilot"],
        action: "book_meeting",
        transferTo: "Solutions",
        description: "Product demos and pilots.",
      },
      {
        name: "Human transfer",
        triggers: ["speak to a human", "transfer me", "talk to sales"],
        action: "transfer",
        transferTo: "On-call operator",
        description: "Live human transfer.",
      },
    ],
    knowledgeFile: "software-house.txt",
  },
];

function loadKnowledge(file: string) {
  const path = resolve(process.cwd(), "samples", "tenants", file);
  return readFileSync(path, "utf8");
}

function chunkText(text: string, size = 900) {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const parts: string[] = [];
  let buf = "";
  for (const para of clean.split(/\n+/)) {
    if ((buf + "\n" + para).length > size && buf) {
      parts.push(buf.trim());
      buf = para;
    } else {
      buf = buf ? `${buf}\n${para}` : para;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.filter((p) => p.length > 20).slice(0, 80);
}

async function main() {
  const userEmail = process.env.USER_EMAIL || "operator@voiceagent.local";
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@voiceagent.local";

  // Wipe tenant-scoped data for clean multi-tenant seed
  await prisma.message.deleteMany();
  await prisma.handoff.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.voiceSession.deleteMany();
  await prisma.usageLog.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.knowledgeDoc.deleteMany();
  await prisma.handoffRule.deleteMany();
  await prisma.agentConfig.deleteMany();
  await prisma.tenant.deleteMany();
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

  let firstTenantId = "";
  for (const ind of INDUSTRIES) {
    const content = loadKnowledge(ind.knowledgeFile);
    const chunks = chunkText(content).map((text) => ({ text, embedding: [] as number[] }));

    const tenant = await prisma.tenant.create({
      data: {
        slug: ind.slug,
        name: ind.name,
        industry: ind.industry,
        tagline: ind.tagline,
        description: ind.description,
        sortOrder: ind.sortOrder,
        active: true,
        agent: {
          create: {
            name: ind.agent.name,
            tone: ind.agent.tone,
            description: ind.agent.description,
            targetTitles: ind.agent.titles,
            qualificationRounds: 3,
            collectName: true,
            collectCompany: true,
            collectEmail: true,
            emailRequiredOnChat: false,
            voiceId: ind.agent.voiceId,
            greeting: ind.agent.greeting,
            shortReplies: true,
            humanizedTone: true,
            interruptionEnabled: true,
            autoPauseEnabled: true,
            noiseCancelEnabled: true,
            lowLatencyMode: true,
            vadSilenceMs: 300,
          },
        },
        handoffRules: {
          create: ind.handoffs.map((h, i) => ({
            name: h.name,
            triggers: JSON.stringify(h.triggers),
            action: h.action,
            transferTo: h.transferTo,
            enabled: true,
            description: h.description,
            sortOrder: i + 1,
          })),
        },
        knowledgeDocs: {
          create: {
            filename: ind.knowledgeFile,
            mimeType: "text/plain",
            content,
            chunks: JSON.stringify(chunks),
            size: Buffer.byteLength(content, "utf8"),
          },
        },
      },
    });
    if (!firstTenantId) firstTenantId = tenant.id;
    console.log(`Tenant ready: ${tenant.slug} (${tenant.name})`);
  }

  const settings: { key: string; value: string }[] = [
    { key: "company_name", value: "Voice Agent Multi-Tenant" },
    { key: "company_website", value: "" },
    { key: "timezone", value: "UTC" },
    { key: "meeting_duration", value: "30" },
    { key: "notify_email", value: userEmail },
    { key: "active_tenant_id", value: firstTenantId },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("Seeded multi-tenant Voice Agent with 5 industries.");
  console.log(`Operator: ${userEmail}`);
  console.log(`Super admin: ${adminEmail}`);
  console.log("Select a tenant in the UI → /tenants");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
