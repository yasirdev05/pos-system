import { Request, Response } from 'express';
import { getDb, ObjectId } from '../config/native-db';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const categories = await db.collection('Category').find({}).toArray();
    
    // Count products per category
    const products = await db.collection('Product').find({}, { projection: { categoryId: 1 } }).toArray();
    const countMap: Record<string, number> = {};
    products.forEach(p => {
      const catId = p.categoryId?.toString();
      if (catId) countMap[catId] = (countMap[catId] || 0) + 1;
    });

    const result = categories.map(c => ({
      id: c._id.toString(),
      name: c.name,
      description: c.description,
      _count: { products: countMap[c._id.toString()] || 0 },
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const db = await getDb();

    const existing = await db.collection('Category').findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    const result = await db.collection('Category').insertOne({
      _id: new ObjectId(),
      name,
      description: description || null,
    });

    res.status(201).json({ id: result.insertedId.toString(), name, description });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const db = await getDb();

    await db.collection('Category').updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, description } }
    );

    res.json({ id, name, description });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.collection('Category').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
