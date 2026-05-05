import status from "http-status";
import { Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { auth } from "../../lib/auth";
import { randomBytes } from "crypto";
import { AuthService } from "../auth/auth.service";

interface IAuthenticatedUser {
  userId: string;
  role: Role;
  email: string;
  shopId?: string;
}

interface ICreateStaffPayload {
  email: string;
  password?: string;
  displayName?: string;
  phone?: string;
  designation?: string;
}

const createStaff = async (owner: IAuthenticatedUser, payload: ICreateStaffPayload) => {
  // Only shop owners can create staff
  if (owner.role !== Role.SHOP_OWNER) {
    throw new AppError(status.FORBIDDEN, "Only shop owners can add staff");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({
    where: { userId: owner.userId },
    include: { shop: { include: { currentPlan: true } } },
  });

  if (!ownerProfile || !ownerProfile.shop) {
    throw new AppError(status.BAD_REQUEST, "Shop not found for owner");
  }

  const shop = ownerProfile.shop;

  const plan = shop.currentPlan;
  const maxStaff = plan?.maxStaff ?? -1;

  if (typeof maxStaff === "number" && maxStaff >= 0) {
    const activeCount = await prisma.staffProfile.count({ where: { shopId: shop.id, isActive: true } });
    if (activeCount >= maxStaff) {
      throw new AppError(status.CONFLICT, "Staff limit reached for current plan");
    }
  }

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  // If user doesn't exist, create via better-auth (generate password if not provided)
  let createdUserFromAuth: { id: string } | null = null;
  if (!user) {
    const password = payload.password ?? randomBytes(8).toString("hex");
    const data = await auth.api.signUpEmail({
      body: {
        name: payload.displayName ?? payload.email,
        email: payload.email,
        password,
        role: Role.STAFF,
      },
    });

    if (!data.user) {
      throw new AppError(status.BAD_REQUEST, "Failed to create staff user");
    }

    createdUserFromAuth = { id: data.user.id };
    user = await prisma.user.findUnique({ where: { id: data.user.id } });
  }

  const result = await prisma.$transaction(async (tx) => {
    // Ensure role is STAFF (idempotent)
    await tx.user.update({ where: { id: user!.id }, data: { role: Role.STAFF } });

    const staff = await tx.staffProfile.create({
      data: {
        userId: user!.id,
        shopId: shop.id,
        displayName: payload.displayName ?? user!.name ?? user!.email,
        phone: payload.phone,
        designation: payload.designation,
        canSell: true,
        canViewReports: false,
        canManageInventory: false,
      },
    });

    return staff;
  }).catch(async (err) => {
    // If we created the user via auth and staff creation failed, remove the created user
    if (createdUserFromAuth) {
      await prisma.user.delete({ where: { id: createdUserFromAuth.id } }).catch(() => undefined);
    }
    throw err;
  });

  await AuthService.sendVerificationEmail({
    email: user!.email,
    name: user!.name,
  }).catch((error) => {
    console.error("Failed to send staff verification email:", error);
  });

  return result;
};

interface ICreateStaffAccountPayload extends ICreateStaffPayload {
  password: string;
}

const createStaffAccount = async (owner: IAuthenticatedUser, payload: ICreateStaffAccountPayload) => {
  if (owner.role !== Role.SHOP_OWNER) {
    throw new AppError(status.FORBIDDEN, "Only shop owners can add staff");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({
    where: { userId: owner.userId },
    include: { shop: { include: { currentPlan: true } } },
  });

  if (!ownerProfile || !ownerProfile.shop) {
    throw new AppError(status.BAD_REQUEST, "Shop not found for owner");
  }

  const shop = ownerProfile.shop;
  const plan = shop.currentPlan;
  const maxStaff = plan?.maxStaff ?? -1;

  if (typeof maxStaff === "number" && maxStaff >= 0) {
    const activeCount = await prisma.staffProfile.count({ where: { shopId: shop.id, isActive: true } });
    if (activeCount >= maxStaff) {
      throw new AppError(status.CONFLICT, "Staff limit reached for current plan");
    }
  }

  // Create user via better-auth sign up
  const data = await auth.api.signUpEmail({
    body: {
      name: payload.displayName ?? payload.email,
      email: payload.email,
      password: payload.password,
      role: Role.STAFF,
    },
  });

  if (!data.user) {
    throw new AppError(status.BAD_REQUEST, "Failed to create staff user");
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const staff = await tx.staffProfile.create({
        data: {
          userId: data.user!.id,
          shopId: shop.id,
          displayName: payload.displayName ?? data.user!.name ?? data.user!.email,
          phone: payload.phone,
          designation: payload.designation,
          canSell: true,
          canViewReports: false,
          canManageInventory: false,
        },
      });

      return staff;
    });

    await AuthService.sendVerificationEmail({
      email: data.user.email,
      name: data.user.name,
    }).catch((error) => {
      console.error("Failed to send staff verification email:", error);
    });

    return created;
  } catch (err) {
    // Compensating delete: remove created user if profile creation failed
    await prisma.user.delete({ where: { id: data.user.id } }).catch(() => undefined);
    throw err instanceof AppError ? err : new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create staff profile");
  }
};

const deactivateStaff = async (owner: IAuthenticatedUser, staffId: string) => {
  if (owner.role !== Role.SHOP_OWNER) {
    throw new AppError(status.FORBIDDEN, "Only shop owners can modify staff");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({ where: { userId: owner.userId }, include: { shop: true } });
  if (!ownerProfile || !ownerProfile.shop) {
    throw new AppError(status.BAD_REQUEST, "Shop not found for owner");
  }

  const staff = await prisma.staffProfile.findUnique({ where: { id: staffId } });
  if (!staff || staff.shopId !== ownerProfile.shop!.id) {
    throw new AppError(status.NOT_FOUND, "Staff not found for this shop");
  }

  await prisma.staffProfile.update({ where: { id: staffId }, data: { isActive: false } });

  return { success: true };
};

const listStaff = async (owner: IAuthenticatedUser) => {
  if (owner.role !== Role.SHOP_OWNER) {
    throw new AppError(status.FORBIDDEN, "Only shop owners can list staff");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({ where: { userId: owner.userId }, include: { shop: true } });
  if (!ownerProfile || !ownerProfile.shop) {
    throw new AppError(status.BAD_REQUEST, "Shop not found for owner");
  }

  const staff = await prisma.staffProfile.findMany({ where: { shopId: ownerProfile.shop!.id }, include: { user: true } });
  return staff;
};

export const StaffService = {
  createStaff,
  createStaffAccount,
  deactivateStaff,
  listStaff,
};
