import { Prisma } from "../../../generated/prisma/client";
import { Role, ShopStatus, SubscriptionStatus, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

type DashboardUser = {
    userId: string;
    role: Role;
    email: string;
    shopId?: string;
};

type MonthPoint = {
    label: string;
    value: number;
    count: number;
};

type DashboardResponse = Record<string, unknown>;

const toNumber = (value: Prisma.Decimal | number | null | undefined) => Number(value ?? 0);

const formatMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const buildMonthSeries = (months: number, rows: Array<{ createdAt: Date; grandTotal?: Prisma.Decimal | null; totalProfit?: Prisma.Decimal | null }>, valueKey: "grandTotal" | "totalProfit") => {
    const labels: string[] = [];
    const buckets = new Map<string, { value: number; count: number }>();

    const cursor = new Date();
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    cursor.setMonth(cursor.getMonth() - (months - 1));

    for (let index = 0; index < months; index += 1) {
        const point = new Date(cursor);
        point.setMonth(cursor.getMonth() + index);
        const key = formatMonthKey(point);
        labels.push(key);
        buckets.set(key, { value: 0, count: 0 });
    }

    for (const row of rows) {
        const key = formatMonthKey(new Date(row.createdAt));
        if (!buckets.has(key)) continue;

        const bucket = buckets.get(key)!;
        bucket.count += 1;
        bucket.value += valueKey === "grandTotal" ? toNumber(row.grandTotal) : toNumber(row.totalProfit);
    }

    return labels.map((label) => ({
        label,
        value: buckets.get(label)?.value ?? 0,
        count: buckets.get(label)?.count ?? 0,
    }));
};

const buildCountSeries = <T extends string>(labels: T[], rows: Array<{ key: T }>) => {
    const counts = new Map<T, number>(labels.map((label) => [label, 0]));

    for (const row of rows) {
        counts.set(row.key, (counts.get(row.key) ?? 0) + 1);
    }

    return labels.map((label) => ({ label, count: counts.get(label) ?? 0 }));
};

const getAdminDashboard = async (): Promise<DashboardResponse> => {
    const [
        totalUsers,
        totalActiveUsers,
        totalInactiveUsers,
        totalSuspendedUsers,
        totalShops,
        totalActiveShops,
        totalPendingShops,
        totalSuspendedShops,
        totalProducts,
        totalCategories,
        totalInvoices,
        totalStaff,
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        canceledSubscriptions,
        pausedSubscriptions,
        products,
        invoices,
        shops,
        subscriptions,
        recentInvoices,
        recentShops,
        topShopGroups,
    ] = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { status: UserStatus.ACTIVE, isDeleted: false } }),
        prisma.user.count({ where: { status: UserStatus.INACTIVE, isDeleted: false } }),
        prisma.user.count({ where: { status: UserStatus.SUSPENDED, isDeleted: false } }),
        prisma.shop.count(),
        prisma.shop.count({ where: { status: ShopStatus.ACTIVE } }),
        prisma.shop.count({ where: { status: ShopStatus.PENDING } }),
        prisma.shop.count({ where: { status: ShopStatus.SUSPENDED } }),
        prisma.product.count(),
        prisma.category.count(),
        prisma.invoice.count(),
        prisma.staffProfile.count(),
        prisma.shopSubscription.count(),
        prisma.shopSubscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
        prisma.shopSubscription.count({ where: { status: SubscriptionStatus.TRIAL } }),
        prisma.shopSubscription.count({ where: { status: SubscriptionStatus.EXPIRED } }),
        prisma.shopSubscription.count({ where: { status: SubscriptionStatus.CANCELED } }),
        prisma.shopSubscription.count({ where: { status: SubscriptionStatus.PAST_DUE } }),
        prisma.product.findMany({ select: { id: true, name: true, stock: true, reorderLevel: true } }),
        prisma.invoice.findMany({ select: { createdAt: true, grandTotal: true, totalProfit: true, shopId: true, shop: { select: { shopName: true } } }, orderBy: { createdAt: "asc" } }),
        prisma.shop.findMany({ select: { id: true, shopName: true, status: true, subscriptionStatus: true, createdAt: true } }),
        prisma.shopSubscription.findMany({ select: { status: true, createdAt: true } }),
        prisma.invoice.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
                id: true,
                invoiceNumber: true,
                grandTotal: true,
                totalProfit: true,
                createdAt: true,
                shop: { select: { shopName: true } },
                createdByUser: { select: { name: true, email: true } },
            },
        }),
        prisma.shop.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
                id: true,
                shopName: true,
                status: true,
                subscriptionStatus: true,
                createdAt: true,
                ownerProfile: {
                    select: {
                        user: { select: { name: true, email: true } },
                    },
                },
            },
        }),
        prisma.invoice.groupBy({
            by: ["shopId"],
            _sum: { grandTotal: true, totalProfit: true },
            _count: { _all: true },
        }),
    ]);

    const lowStockProducts = products.filter((product) => product.stock <= product.reorderLevel);

    const topShopMap = new Map<string, { shopName: string; revenue: number; profit: number; invoices: number }>();
    const shopNameMap = new Map(shops.map((shop) => [shop.id, shop.shopName]));
    for (const group of topShopGroups) {
        const shopName = shopNameMap.get(group.shopId) ?? "Unknown Shop";
        topShopMap.set(group.shopId, {
            shopName,
            revenue: toNumber(group._sum.grandTotal),
            profit: toNumber(group._sum.totalProfit),
            invoices: group._count._all,
        });
    }

    const revenueSeries = buildMonthSeries(12, invoices, "grandTotal");

    return {
        viewMode: "admin",
        overview: {
            users: {
                total: totalUsers,
                active: totalActiveUsers,
                inactive: totalInactiveUsers,
                suspended: totalSuspendedUsers,
            },
            shops: {
                total: totalShops,
                active: totalActiveShops,
                pending: totalPendingShops,
                suspended: totalSuspendedShops,
            },
            commerce: {
                products: totalProducts,
                categories: totalCategories,
                invoices: totalInvoices,
                revenue: invoices.reduce((sum, invoice) => sum + toNumber(invoice.grandTotal), 0),
                profit: invoices.reduce((sum, invoice) => sum + toNumber(invoice.totalProfit), 0),
                lowStockProducts: lowStockProducts.length,
            },
            subscriptions: {
                total: totalSubscriptions,
                active: activeSubscriptions,
                trial: trialSubscriptions,
                expired: expiredSubscriptions,
                canceled: canceledSubscriptions,
                pastDue: pausedSubscriptions,
            },
            staff: totalStaff,
        },
        charts: {
            revenueByMonth: revenueSeries,
            shopStatus: buildCountSeries([ShopStatus.ACTIVE, ShopStatus.PENDING, ShopStatus.SUSPENDED, "CLOSED"], shops.map((shop) => ({ key: shop.status } as { key: ShopStatus | "CLOSED" }))) ,
            subscriptionStatus: buildCountSeries([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PAST_DUE, SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELED, SubscriptionStatus.SUSPENDED], subscriptions.map((subscription) => ({ key: subscription.status }))),
            topShops: Array.from(topShopMap.values())
                .sort((left, right) => right.revenue - left.revenue)
                .slice(0, 6),
        },
        recent: {
            invoices: recentInvoices,
            shops: recentShops,
        },
        lowStockProducts,
    };
};

const getShopDashboard = async (user: DashboardUser): Promise<DashboardResponse> => {
    const shopId = user.shopId;
    if (!shopId) {
        return {
            viewMode: "shop",
            overview: {},
            charts: {},
            recent: {},
        };
    }

    const [
        shop,
        products,
        categories,
        staffCount,
        invoices,
        stockMovements,
        recentInvoices,
        recentProducts,
        recentStaff,
        invoiceItems,
        invoiceStatusRows,
        movementRows,
        currentMonthInvoices,
    ] = await prisma.$transaction([
        prisma.shop.findUnique({
            where: { id: shopId },
            include: {
                currentPlan: true,
                ownerProfile: { include: { user: true } },
                subscriptions: { orderBy: { createdAt: "desc" }, take: 3, include: { plan: true } },
            },
        }),
        prisma.product.findMany({ where: { shopId }, select: { id: true, name: true, stock: true, reorderLevel: true, isActive: true } }),
        prisma.category.count({ where: { shopId } }),
        prisma.staffProfile.count({ where: { shopId } }),
        prisma.invoice.findMany({ where: { shopId }, select: { createdAt: true, grandTotal: true, totalProfit: true, status: true } , orderBy: { createdAt: "asc" } }),
        prisma.stockMovement.count({ where: { shopId } }),
        prisma.invoice.findMany({
            where: { shopId },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
                id: true,
                invoiceNumber: true,
                grandTotal: true,
                totalProfit: true,
                createdAt: true,
                status: true,
                createdByUser: { select: { name: true, email: true } },
            },
        }),
        prisma.product.findMany({
            where: { shopId },
            orderBy: { updatedAt: "desc" },
            take: 8,
            select: { id: true, name: true, stock: true, reorderLevel: true, isActive: true, updatedAt: true },
        }),
        prisma.staffProfile.findMany({
            where: { shopId },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
                id: true,
                displayName: true,
                designation: true,
                canSell: true,
                canViewReports: true,
                canManageInventory: true,
                isActive: true,
                user: { select: { name: true, email: true } },
            },
        }),
        prisma.invoiceItem.groupBy({
            by: ["productId"],
            where: { invoice: { shopId } },
            _sum: { quantity: true, lineTotal: true, lineProfit: true },
        }),
        prisma.invoice.groupBy({
            by: ["status"],
            where: { shopId },
            _count: { _all: true },
        }),
        prisma.stockMovement.groupBy({
            by: ["movementType"],
            where: { shopId },
            _count: { _all: true },
        }),
        prisma.invoice.findMany({
            where: {
                shopId,
                createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
            select: { createdAt: true, grandTotal: true, totalProfit: true },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    const lowStockProducts = products.filter((product) => product.stock <= product.reorderLevel);
    const revenueSeries = buildMonthSeries(12, invoices, "grandTotal");

    const productIds = invoiceItems.map((item) => item.productId);
    const productNames = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
    const productNameMap = new Map(productNames.map((product) => [product.id, product.name]));

    const topProducts = invoiceItems
        .map((item) => ({
            productId: item.productId,
            name: productNameMap.get(item.productId) ?? "Unknown Product",
            soldQuantity: item._sum.quantity ?? 0,
            revenue: toNumber(item._sum.lineTotal),
            profit: toNumber(item._sum.lineProfit),
        }))
        .sort((left, right) => right.revenue - left.revenue)
        .slice(0, 6);

    const stockMovementChart = ["PURCHASE", "SALE", "ADJUSTMENT", "RETURN"].map((movementType) => ({
        label: movementType,
        count: movementRows.find((row) => row.movementType === movementType)?._count._all ?? 0,
    }));

    const invoiceStatusChart = ["PAID", "PARTIALLY_PAID", "VOID", "DRAFT"].map((status) => ({
        label: status,
        count: invoiceStatusRows.find((row) => row.status === status)?._count._all ?? 0,
    }));

    const currentMonthRevenue = currentMonthInvoices.reduce((sum, invoice) => sum + toNumber(invoice.grandTotal), 0);
    const currentMonthProfit = currentMonthInvoices.reduce((sum, invoice) => sum + toNumber(invoice.totalProfit), 0);

    return {
        viewMode: user.role === Role.STAFF ? "staff" : "shop",
        permissions: {
            canViewReports: user.role !== Role.STAFF || !!(await prisma.staffProfile.findUnique({ where: { userId: user.userId }, select: { canViewReports: true } }))?.canViewReports,
        },
        shop: shop
            ? {
                  id: shop.id,
                  name: shop.shopName,
                  status: shop.status,
                  subscriptionStatus: shop.subscriptionStatus,
                  isDashboardLocked: shop.isDashboardLocked,
                  currentPlan: shop.currentPlan?.name ?? null,
                  ownerName: shop.ownerProfile?.user?.name ?? null,
              }
            : null,
        overview: {
            products: products.length,
            activeProducts: products.filter((product) => product.isActive).length,
            categories,
            staff: staffCount,
            invoices: invoices.length,
            revenue: invoices.reduce((sum, invoice) => sum + toNumber(invoice.grandTotal), 0),
            profit: invoices.reduce((sum, invoice) => sum + toNumber(invoice.totalProfit), 0),
            currentMonthRevenue,
            currentMonthProfit,
            lowStockProducts: lowStockProducts.length,
            stockMovements,
        },
        charts: {
            revenueByMonth: revenueSeries,
            topProducts,
            stockMovements: stockMovementChart,
            invoiceStatus: invoiceStatusChart,
        },
        recent: {
            invoices: recentInvoices,
            products: recentProducts,
            staff: recentStaff,
        },
        lowStockProducts,
        recentPerformance: {
            monthToDateRevenue: currentMonthRevenue,
            monthToDateProfit: currentMonthProfit,
        },
    };
};

const getDashboardStats = async (user: DashboardUser) => {
    if (user.role === Role.SUPER_ADMIN) {
        return getAdminDashboard();
    }

    return getShopDashboard(user);
};

export const DashboardService = {
    getDashboardStats,
};