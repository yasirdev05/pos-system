import { MongoClient, ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import prisma from '../config/db';

export const getSales = async (req: Request, res: Response) => {
  try {
    const { search, startDate, endDate, paymentMethod } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: String(search), mode: 'insensitive' } },
        { customer: { name: { contains: String(search), mode: 'insensitive' } } },
      ];
    }
    if (paymentMethod) where.paymentMethod = String(paymentMethod);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }
    const sales = await prisma.sale.findMany({
      where,
      include: { customer: true, user: { select: { id: true, name: true } }, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sales);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to fetch sales' }); }
};

export const getSale = async (req: Request, res: Response) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: { customer: true, user: { select: { id: true, name: true } }, items: { include: { product: { include: { category: true } } } } },
    });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch { res.status(500).json({ error: 'Failed to fetch sale' }); }
}; // ✅ missing brace added here

export const createSale = async (req: Request, res: Response) => {
  const client = new MongoClient(process.env.DATABASE_URL!);
  try {
    const { customerId, items, subtotal, taxAmount, discountAmount, totalAmount, paymentMethod, amountPaid, change } = req.body;
    // @ts-ignore
    const userId = req.user.userId;

    await client.connect();
    const db = client.db();

    // --- 1. Generate invoice number ---
    const count = await prisma.sale.count();
    const invoiceNumber = `TMP-${String(count + 1).padStart(6, '0')}`;

    // --- 2. Insert Sale ---
    const saleData = {
      invoiceNumber,
      customerId: customerId ? new ObjectId(customerId) : null,
      userId: new ObjectId(userId),
      subtotal,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      totalAmount,
      paymentMethod,
      amountPaid,
      change: change || 0,
      status: 'COMPLETED',
      createdAt: new Date(),
    };
    const saleResult = await db.collection('Sale').insertOne(saleData);
    const saleId = saleResult.insertedId;

    // --- 3. Insert SaleItems ---
    const saleItems = items.map((item: any) => ({
      saleId: saleId,
      productId: new ObjectId(item.productId),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
    }));
    await db.collection('SaleItem').insertMany(saleItems);

    // --- 4. Update product stock & log inventory (native) ---
    for (const item of items) {
      const productId = new ObjectId(item.productId);
      const product = await db.collection('Product').findOne({ _id: productId });
      if (!product) continue;

      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;

      await db.collection('Product').updateOne(
        { _id: productId },
        { $set: { stock: newStock, updatedAt: new Date() } }
      );

      await db.collection('InventoryTransaction').insertOne({
        productId: productId,
        type: 'OUT',
        quantity: item.quantity,
        previousStock,
        newStock,
        reason: 'Sale',
        userId: new ObjectId(userId),
        createdAt: new Date(),
      });
    }

    // --- 5. Fetch the complete sale using Prisma (read only) ---
    const newSale = await prisma.sale.findUnique({
      where: { id: saleId.toString() },
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });

    res.status(201).json(newSale);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create sale' });
  } finally {
    await client.close();
  }
};