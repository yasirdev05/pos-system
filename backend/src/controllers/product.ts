import { Request, Response } from 'express';
import { getDb, ObjectId } from '../config/native-db';

async function enrichProduct(db: any, p: any) {
  const category = p.categoryId
    ? await db.collection('Category').findOne({ _id: new ObjectId(p.categoryId.toString()) })
    : null;
  const supplier = p.supplierId
    ? await db.collection('Supplier').findOne({ _id: new ObjectId(p.supplierId.toString()) })
    : null;

  return {
    id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    categoryId: p.categoryId?.toString() ?? null,
    supplierId: p.supplierId?.toString() ?? null,
    description: p.description ?? null,
    imageUrl: p.imageUrl ?? null,
    purchasePrice: p.purchasePrice,
    sellingPrice: p.sellingPrice,
    stock: p.stock,
    minStock: p.minStock,
    status: p.status ?? 'ACTIVE',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: category ? { id: category._id.toString(), name: category.name, description: category.description ?? null } : null,
    supplier: supplier ? { id: supplier._id.toString(), companyName: supplier.companyName } : null,
  };
}

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, categoryId } = req.query;
    const db = await getDb();

    const query: any = {};
    if (categoryId) {
      query.categoryId = new ObjectId(String(categoryId));
    }
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { sku: { $regex: String(search), $options: 'i' } },
      ];
    }

    const products = await db.collection('Product').find(query).sort({ createdAt: -1 }).toArray();

    // Batch-fetch categories and suppliers
    const catIds = [...new Set(products.map(p => p.categoryId?.toString()).filter(Boolean))];
    const supIds = [...new Set(products.map(p => p.supplierId?.toString()).filter(Boolean))];

    const cats = catIds.length > 0
      ? await db.collection('Category').find({ _id: { $in: catIds.map(id => new ObjectId(id!)) } }).toArray()
      : [];
    const sups = supIds.length > 0
      ? await db.collection('Supplier').find({ _id: { $in: supIds.map(id => new ObjectId(id!)) } }).toArray()
      : [];

    const catMap: Record<string, any> = {};
    cats.forEach(c => { catMap[c._id.toString()] = c; });
    const supMap: Record<string, any> = {};
    sups.forEach(s => { supMap[s._id.toString()] = s; });

    const result = products.map(p => {
      const cat = catMap[p.categoryId?.toString() ?? ''];
      const sup = supMap[p.supplierId?.toString() ?? ''];
      return {
        id: p._id.toString(),
        name: p.name,
        sku: p.sku,
        categoryId: p.categoryId?.toString() ?? null,
        supplierId: p.supplierId?.toString() ?? null,
        description: p.description ?? null,
        imageUrl: p.imageUrl ?? null,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        minStock: p.minStock,
        status: p.status ?? 'ACTIVE',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        category: cat ? { id: cat._id.toString(), name: cat.name } : null,
        supplier: sup ? { id: sup._id.toString(), companyName: sup.companyName } : null,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const product = await db.collection('Product').findOne({ _id: new ObjectId(req.params.id) });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(await enrichProduct(db, product));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const data = req.body;

    // Check duplicate SKU
    const existing = await db.collection('Product').findOne({ sku: data.sku });
    if (existing) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    const doc = {
      _id: new ObjectId(),
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId ? new ObjectId(data.categoryId) : null,
      supplierId: data.supplierId ? new ObjectId(data.supplierId) : null,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      purchasePrice: parseFloat(data.purchasePrice),
      sellingPrice: parseFloat(data.sellingPrice),
      stock: parseInt(data.stock ?? '0'),
      minStock: parseInt(data.minStock ?? '5'),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('Product').insertOne(doc);
    res.status(201).json(await enrichProduct(db, doc));
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const data = req.body;

    const updates: any = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.sku !== undefined) updates.sku = data.sku;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId ? new ObjectId(data.categoryId) : null;
    if (data.supplierId !== undefined) updates.supplierId = data.supplierId ? new ObjectId(data.supplierId) : null;
    if (data.description !== undefined) updates.description = data.description;
    if (data.purchasePrice !== undefined) updates.purchasePrice = parseFloat(data.purchasePrice);
    if (data.sellingPrice !== undefined) updates.sellingPrice = parseFloat(data.sellingPrice);
    if (data.stock !== undefined) updates.stock = parseInt(data.stock);
    if (data.minStock !== undefined) updates.minStock = parseInt(data.minStock);
    if (data.status !== undefined) updates.status = data.status;
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;

    await db.collection('Product').updateOne({ _id: new ObjectId(id) }, { $set: updates });
    const updated = await db.collection('Product').findOne({ _id: new ObjectId(id) });
    res.json(await enrichProduct(db, updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.collection('Product').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
