import { Request, Response } from 'express';
import { getDb, ObjectId } from '../config/native-db';

async function enrichProduct(db: any, p: any) {
  const category = p.categoryId
    ? await db.collection('Category').findOne({ _id: p.categoryId instanceof ObjectId ? p.categoryId : new ObjectId(p.categoryId.toString()) })
    : null;
  return {
    id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    minStock: p.minStock,
    sellingPrice: p.sellingPrice,
    purchasePrice: p.purchasePrice,
    status: p.status ?? 'ACTIVE',
    categoryId: p.categoryId?.toString() ?? null,
    category: category ? { id: category._id.toString(), name: category.name } : null,
  };
}

export const getInventory = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const products = await db.collection('Product').find({}).sort({ stock: 1 }).toArray();

    // Batch-load categories
    const catIds = [...new Set(products.map((p: any) => p.categoryId?.toString()).filter(Boolean))];
    const cats = catIds.length > 0
      ? await db.collection('Category').find({ _id: { $in: catIds.map((id: any) => new ObjectId(id)) } }).toArray()
      : [];
    const catMap: Record<string, any> = {};
    cats.forEach((c: any) => { catMap[c._id.toString()] = c; });

    const result = products.map((p: any) => {
      const cat = catMap[p.categoryId?.toString() ?? ''];
      return {
        id: p._id.toString(),
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
        sellingPrice: p.sellingPrice,
        purchasePrice: p.purchasePrice,
        status: p.status ?? 'ACTIVE',
        categoryId: p.categoryId?.toString() ?? null,
        category: cat ? { id: cat._id.toString(), name: cat.name } : null,
      };
    });

    res.json(result);
  } catch (e) {
    console.error('Inventory fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { productId, quantity, type, reason } = req.body;
    // @ts-ignore
    const userId = req.user?.userId;

    const product = await db.collection('Product').findOne({ _id: new ObjectId(productId) });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const previousStock = product.stock;
    let newStock = previousStock;
    const resolvedType = String(type).toUpperCase();

    if (resolvedType === 'IN' || resolvedType === 'ADD') {
      newStock += Number(quantity);
    } else if (resolvedType === 'OUT' || resolvedType === 'REMOVE') {
      newStock -= Number(quantity);
    } else if (resolvedType === 'ADJUSTMENT' || resolvedType === 'SET') {
      newStock = Number(quantity);
    }

    if (newStock < 0) return res.status(400).json({ error: 'Stock cannot be negative' });

    await db.collection('Product').updateOne(
      { _id: new ObjectId(productId) },
      { $set: { stock: newStock, updatedAt: new Date() } }
    );

    await db.collection('InventoryTransaction').insertOne({
      _id: new ObjectId(),
      productId: new ObjectId(productId),
      type: resolvedType === 'ADD' ? 'IN' : resolvedType === 'REMOVE' ? 'OUT' : resolvedType,
      quantity: Number(quantity),
      previousStock,
      newStock,
      reason: reason || 'Manual adjustment',
      userId: userId ? new ObjectId(userId) : null,
      createdAt: new Date(),
    });

    res.json({ id: productId, stock: newStock, previousStock });
  } catch (e) {
    console.error('Adjust stock error:', e);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
};

export const getInventoryHistory = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const history = await db.collection('InventoryTransaction')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    // Batch-load product names
    const prodIds = [...new Set(history.map((h: any) => h.productId?.toString()).filter(Boolean))];
    const prods = prodIds.length > 0
      ? await db.collection('Product').find({ _id: { $in: prodIds.map((id: any) => new ObjectId(id)) } }, { projection: { name: 1, sku: 1 } }).toArray()
      : [];
    const prodMap: Record<string, any> = {};
    prods.forEach((p: any) => { prodMap[p._id.toString()] = p; });

    const result = history.map((h: any) => ({
      id: h._id.toString(),
      productId: h.productId?.toString(),
      type: h.type,
      quantity: h.quantity,
      previousStock: h.previousStock,
      newStock: h.newStock,
      reason: h.reason,
      createdAt: h.createdAt,
      product: prodMap[h.productId?.toString()] ? {
        name: prodMap[h.productId.toString()].name,
        sku: prodMap[h.productId.toString()].sku,
      } : null,
    }));

    res.json(result);
  } catch (e) {
    console.error('Inventory history error:', e);
    res.status(500).json({ error: 'Failed to fetch inventory history' });
  }
};
