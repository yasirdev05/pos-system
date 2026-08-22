import { Request, Response } from 'express';
import prisma from '../config/db';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySalesAgg, todayOrders, totalRevenueAgg, totalProducts, lowStockProducts, totalCustomers, recentSales] =
      await Promise.all([
        prisma.sale.aggregate({ where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' }, _sum: { totalAmount: true } }),
        prisma.sale.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
        prisma.sale.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalAmount: true } }),
        prisma.product.count(),
        prisma.product.count({ where: { stock: { lte: prisma.product.fields.minStock } } }),
        prisma.customer.count(),
        prisma.sale.findMany({
  take: 5,
  orderBy: { createdAt: "desc" },
  select: {
    id: true,
    invoiceNumber: true,
    totalAmount: true,
    paymentMethod: true,
    customer: {
      select: { name: true }
    },
    createdAt: true
  }
}),
      ]);

    res.json({
      todaySales: todaySalesAgg._sum.totalAmount || 0,
      todayOrders,
      totalRevenue: totalRevenueAgg._sum.totalAmount || 0,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      recentSales,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to fetch dashboard stats' }); }
};
