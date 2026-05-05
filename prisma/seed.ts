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

const main = async () => {
  await seedSuperAdmin();
  console.log("Super admin seed completed successfully");
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });