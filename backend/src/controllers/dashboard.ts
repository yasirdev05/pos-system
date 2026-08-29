import { Request, Response } from 'express';
import { getDb, ObjectId } from '../config/native-db';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales
    const todaySalesDocs = await db.collection('Sale').find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'COMPLETED',
    }).toArray();
    const todaySales = todaySalesDocs.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const todayOrders = todaySalesDocs.length;

    // Total revenue (all time)
    const allSales = await db.collection('Sale').find({ status: 'COMPLETED' }).toArray();
    const totalRevenue = allSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Counts
    const totalProducts = await db.collection('Product').countDocuments();
    const totalCustomers = await db.collection('Customer').countDocuments();

    // Low stock: products where stock <= minStock
    const allProducts = await db.collection('Product').find({}, { projection: { stock: 1, minStock: 1 } }).toArray();
    const lowStockProducts = allProducts.filter(p => (p.stock ?? 0) <= (p.minStock ?? 5)).length;

    // Recent 5 sales with customer name
    const recentSalesDocs = await db.collection('Sale')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Enrich with customer data
    const recentSales = await Promise.all(recentSalesDocs.map(async (s) => {
      let customer = null;
      if (s.customerId) {
        const c = await db.collection('Customer').findOne(
          { _id: s.customerId instanceof ObjectId ? s.customerId : new ObjectId(s.customerId.toString()) },
          { projection: { name: 1 } }
        );
        if (c) customer = { name: c.name };
      }
      return {
        id: s._id.toString(),
        invoiceNumber: s.invoiceNumber,
        totalAmount: s.totalAmount,
        paymentMethod: s.paymentMethod,
        customer,
        createdAt: s.createdAt,
      };
    }));

    res.json({
      todaySales,
      todayOrders,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      recentSales,
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
