import "dotenv/config";

import status from "http-status";
import bcrypt from "bcrypt";

import { prisma } from "../src/app/lib/prisma";
import { auth } from "../src/app/lib/auth";
import { Role } from "../src/generated/prisma/enums";

const seedSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@hishabflow.local";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@12345";
  const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: Role.SUPER_ADMIN,
        status: "ACTIVE",
      },
    });

    await prisma.superAdminProfile.upsert({
      where: { userId: existingUser.id },
      create: {
        userId: existingUser.id,
        displayName: name,
      },
      update: {
        displayName: name,
      },
    });

    return;
  }

  const created = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
      role: Role.SUPER_ADMIN,
    },
  });

  if (!created.user) {
    throw new Error("Failed to create super admin user");
  }

  await prisma.superAdminProfile.create({
    data: {
      userId: created.user.id,
      displayName: name,
      note: "Seeded super admin account",
    },
  });
};

const seedSubscriptionPlans = async () => {
  const plans = [
    {
      code: "STARTER",
      name: "Starter Plan",
      billingCycle: "MONTHLY",
      price: 499,
      durationDays: 30,
      maxStaff: 1,
      maxProducts: 50,
      maxInvoices: 100,
      maxReports: false,
      maxDiscounts: 0,
      features: {
        description: "Perfect for solo entrepreneurs",
        invoicing: true,
        inventory: true,
        reports: false,
        advancedSettings: false,
      },
    },
    {
      code: "PROFESSIONAL",
      name: "Professional Plan",
      billingCycle: "MONTHLY",
      price: 999,
      durationDays: 30,
      maxStaff: 5,
      maxProducts: 500,
      maxInvoices: 1000,
      maxReports: true,
      maxDiscounts: 10,
      features: {
        description: "For growing businesses",
        invoicing: true,
        inventory: true,
        reports: true,
        advancedSettings: true,
        staffManagement: true,
        customBranding: false,
      },
    },
    {
      code: "ENTERPRISE",
      name: "Enterprise Plan",
      billingCycle: "YEARLY",
      price: 9999,
      durationDays: 365,
      maxStaff: 999,
      maxProducts: -1, // Unlimited
      maxInvoices: -1, // Unlimited
      maxReports: true,
      maxDiscounts: 999,
      features: {
        description: "For large-scale operations",
        invoicing: true,
        inventory: true,
        reports: true,
        advancedSettings: true,
        staffManagement: true,
        customBranding: true,
        api: true,
        webhooks: true,
        prioritySupport: true,
      },
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { code: plan.code },
    });

    if (!existing) {
      await prisma.subscriptionPlan.create({
        data: {
          code: plan.code,
          name: plan.name,
          billingCycle: plan.billingCycle as "MONTHLY" | "YEARLY",
          price: plan.price,
          currencyCode: "BDT",
          durationDays: plan.durationDays,
          maxStaff: plan.maxStaff,
          maxProducts: plan.maxProducts,
          maxInvoices: plan.maxInvoices,
          maxReports: plan.maxReports,
          maxDiscounts: plan.maxDiscounts,
          features: plan.features,
          isActive: true,
        },
      });
      console.log(`Created subscription plan: ${plan.name}`);
    }
  }
};

const main = async () => {
  await seedSuperAdmin();
  console.log("Super admin seed completed successfully");
  await seedSubscriptionPlans();
  console.log("Subscription plans seeded successfully");
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });