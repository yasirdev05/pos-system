import { Request, Response } from 'express';
import { getDb, ObjectId } from '../config/native-db';

function mapExpense(e: any) {
  return {
    id: e._id.toString(),
    title: e.title,
    category: e.category,
    amount: e.amount,
    description: e.description ?? null,
    paymentMethod: e.paymentMethod,
    date: e.date,
    addedById: e.addedById?.toString() ?? null,
  };
}

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const expenses = await db.collection('Expense').find({}).sort({ date: -1 }).toArray();
    res.json(expenses.map(mapExpense));
  } catch { res.status(500).json({ error: 'Failed to fetch expenses' }); }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    // @ts-ignore
    const userId = req.user?.userId;
    const { title, category, amount, description, paymentMethod, date } = req.body;

    const doc = {
      _id: new ObjectId(),
      title,
      category,
      amount: Number(amount),
      description: description ?? null,
      paymentMethod,
      date: date ? new Date(date) : new Date(),
      addedById: userId ? new ObjectId(userId) : null,
    };

    await db.collection('Expense').insertOne(doc);
    res.status(201).json(mapExpense(doc));
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.collection('Expense').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Expense deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete expense' }); }
};
