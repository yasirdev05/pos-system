import { Request, Response } from 'express';
import prisma from '../config/db';

export const getInventory = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, supplier: true },
      orderBy: { stock: 'asc' },
    });
    res.json(products);
  } catch { res.status(500).json({ error: 'Failed to fetch inventory' }); }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, type, reason } = req.body;
    // @ts-ignore
    const userId = req.user?.userId;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let newStock = product.stock;
    if (type === 'IN' || type === 'ADD') newStock += Number(quantity);
    else if (type === 'OUT' || type === 'REMOVE') newStock -= Number(quantity);
    else if (type === 'ADJUSTMENT' || type === 'SET') newStock = Number(quantity);

    if (newStock < 0) return res.status(400).json({ error: 'Stock cannot be negative' });

    const updated = await prisma.product.update({ where: { id: productId }, data: { stock: newStock } });
    await prisma.inventoryTransaction.create({
      data: { productId, type: type === 'ADD' ? 'IN' : type === 'REMOVE' ? 'OUT' : 'ADJUSTMENT', quantity: Number(quantity), previousStock: product.stock, newStock, reason, userId },
    });
    res.json(updated);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to adjust stock' }); }
};

export const getInventoryHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.inventoryTransaction.findMany({
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(history);
  } catch { res.status(500).json({ error: 'Failed to fetch inventory history' }); }
};
