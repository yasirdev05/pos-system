import { Request, Response } from 'express';
import { getDb, ObjectId } from '../config/native-db';

function mapSupplier(s: any) {
  return {
    id: s._id.toString(),
    companyName: s.companyName,
    contactPerson: s.contactPerson ?? null,
    phone: s.phone ?? null,
    email: s.email ?? null,
    address: s.address ?? null,
    _count: { products: 0, purchases: 0 },
  };
}

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const suppliers = await db.collection('Supplier').find({}).sort({ companyName: 1 }).toArray();

    // Count products per supplier
    const products = await db.collection('Product').find({}, { projection: { supplierId: 1 } }).toArray();
    const productCount: Record<string, number> = {};
    products.forEach(p => {
      const sid = p.supplierId?.toString();
      if (sid) productCount[sid] = (productCount[sid] || 0) + 1;
    });

    const result = suppliers.map(s => ({
      ...mapSupplier(s),
      _count: { products: productCount[s._id.toString()] || 0, purchases: 0 },
    }));

    res.json(result);
  } catch { res.status(500).json({ error: 'Failed to fetch suppliers' }); }
};

export const getSupplier = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const supplier = await db.collection('Supplier').findOne({ _id: new ObjectId(req.params.id) });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(mapSupplier(supplier));
  } catch { res.status(500).json({ error: 'Failed to fetch supplier' }); }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { companyName, contactPerson, phone, email, address } = req.body;
    const result = await db.collection('Supplier').insertOne({
      _id: new ObjectId(),
      companyName, contactPerson, phone, email, address,
    });
    res.status(201).json({ id: result.insertedId.toString(), companyName, contactPerson, phone, email, address });
  } catch { res.status(500).json({ error: 'Failed to create supplier' }); }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { companyName, contactPerson, phone, email, address } = req.body;
    await db.collection('Supplier').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { companyName, contactPerson, phone, email, address } }
    );
    res.json({ id: req.params.id, companyName, contactPerson, phone, email, address });
  } catch { res.status(500).json({ error: 'Failed to update supplier' }); }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.collection('Supplier').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Supplier deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete supplier' }); }
};
