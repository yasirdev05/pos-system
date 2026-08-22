import { Request, Response } from 'express';
import { getDb, ObjectId } from '../config/native-db';

function mapCustomer(c: any) {
  return {
    id: c._id.toString(),
    name: c.name,
    phone: c.phone ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    notes: c.notes ?? null,
    createdAt: c.createdAt,
  };
}

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const customers = await db.collection('Customer').find({}).sort({ createdAt: -1 }).toArray();

    // Count sales per customer
    const sales = await db.collection('Sale').find({}, { projection: { customerId: 1 } }).toArray();
    const countMap: Record<string, number> = {};
    sales.forEach(s => {
      if (s.customerId) {
        const cid = s.customerId.toString();
        countMap[cid] = (countMap[cid] || 0) + 1;
      }
    });

    const result = customers.map(c => ({
      ...mapCustomer(c),
      _count: { sales: countMap[c._id.toString()] || 0 },
    }));

    res.json(result);
  } catch { res.status(500).json({ error: 'Failed to fetch customers' }); }
};

export const getCustomer = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const customer = await db.collection('Customer').findOne({ _id: new ObjectId(req.params.id) });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(mapCustomer(customer));
  } catch { res.status(500).json({ error: 'Failed to fetch customer' }); }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { name, phone, email, address, notes } = req.body;
    const doc = { _id: new ObjectId(), name, phone, email, address, notes, createdAt: new Date() };
    await db.collection('Customer').insertOne(doc);
    res.status(201).json({ ...mapCustomer(doc), id: doc._id.toString() });
  } catch { res.status(500).json({ error: 'Failed to create customer' }); }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { name, phone, email, address, notes } = req.body;
    await db.collection('Customer').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name, phone, email, address, notes } }
    );
    res.json({ id: req.params.id, name, phone, email, address, notes });
  } catch { res.status(500).json({ error: 'Failed to update customer' }); }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.collection('Customer').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Customer deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete customer' }); }
};
