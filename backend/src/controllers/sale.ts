import { Request, Response } from 'express';
import { getDb, ObjectId } from '../config/native-db';

async function enrichSale(db: any, s: any) {
  let customer = null;
  if (s.customerId) {
    const c = await db.collection('Customer').findOne({ _id: s.customerId instanceof ObjectId ? s.customerId : new ObjectId(s.customerId.toString()) });
    if (c) customer = { id: c._id.toString(), name: c.name, phone: c.phone ?? null, email: c.email ?? null };
  }

  let user = null;
  if (s.userId) {
    const u = await db.collection('User').findOne(
      { _id: s.userId instanceof ObjectId ? s.userId : new ObjectId(s.userId.toString()) },
      { projection: { name: 1 } }
    );
    if (u) user = { id: u._id.toString(), name: u.name };
  }

  const items = await db.collection('SaleItem').find({
    saleId: s._id instanceof ObjectId ? s._id : new ObjectId(s._id.toString()),
  }).toArray();

  const enrichedItems = await Promise.all(items.map(async (item: any) => {
    const product = item.productId
      ? await db.collection('Product').findOne({ _id: item.productId instanceof ObjectId ? item.productId : new ObjectId(item.productId.toString()) })
      : null;
    return {
      id: item._id.toString(),
      productId: item.productId?.toString(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      product: product ? {
        id: product._id.toString(),
        name: product.name,
        sku: product.sku,
        sellingPrice: product.sellingPrice,
      } : null,
    };
  }));

  return {
    id: s._id.toString(),
    invoiceNumber: s.invoiceNumber,
    customerId: s.customerId?.toString() ?? null,
    userId: s.userId?.toString(),
    subtotal: s.subtotal,
    taxAmount: s.taxAmount,
    discountAmount: s.discountAmount,
    totalAmount: s.totalAmount,
    paymentMethod: s.paymentMethod,
    amountPaid: s.amountPaid,
    change: s.change,
    status: s.status,
    createdAt: s.createdAt,
    customer,
    user,
    items: enrichedItems,
  };
}

export const getSales = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { search, startDate, endDate, paymentMethod } = req.query;

    const query: any = {};
    if (paymentMethod) query.paymentMethod = String(paymentMethod);
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(String(startDate));
      if (endDate) query.createdAt.$lte = new Date(String(endDate));
    }

    let salesDocs = await db.collection('Sale').find(query).sort({ createdAt: -1 }).toArray();

    // Search filter (by invoice number)
    if (search) {
      const s = String(search).toLowerCase();
      salesDocs = salesDocs.filter((sale: any) =>
        sale.invoiceNumber?.toLowerCase().includes(s)
      );
    }

    // Batch-load customers and users
    const customerIds = [...new Set(salesDocs.map((s: any) => s.customerId?.toString()).filter(Boolean))];
    const userIds     = [...new Set(salesDocs.map((s: any) => s.userId?.toString()).filter(Boolean))];

    const customers = customerIds.length > 0
      ? await db.collection('Customer').find({ _id: { $in: customerIds.map((id: any) => new ObjectId(id)) } }).toArray()
      : [];
    const users = userIds.length > 0
      ? await db.collection('User').find({ _id: { $in: userIds.map((id: any) => new ObjectId(id)) } }, { projection: { name: 1 } }).toArray()
      : [];

    const customerMap: Record<string, any> = {};
    customers.forEach((c: any) => { customerMap[c._id.toString()] = c; });
    const userMap: Record<string, any> = {};
    users.forEach((u: any) => { userMap[u._id.toString()] = u; });

    const result = salesDocs.map((s: any) => {
      const cust = customerMap[s.customerId?.toString() ?? ''];
      const usr  = userMap[s.userId?.toString() ?? ''];
      return {
        id: s._id.toString(),
        invoiceNumber: s.invoiceNumber,
        customerId: s.customerId?.toString() ?? null,
        userId: s.userId?.toString(),
        subtotal: s.subtotal,
        taxAmount: s.taxAmount,
        discountAmount: s.discountAmount,
        totalAmount: s.totalAmount,
        paymentMethod: s.paymentMethod,
        amountPaid: s.amountPaid,
        change: s.change,
        status: s.status,
        createdAt: s.createdAt,
        customer: cust ? { id: cust._id.toString(), name: cust.name } : null,
        user: usr ? { id: usr._id.toString(), name: usr.name } : null,
      };
    });

    res.json(result);
  } catch (e) {
    console.error('getSales error:', e);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

export const getSale = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const sale = await db.collection('Sale').findOne({ _id: new ObjectId(req.params.id) });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(await enrichSale(db, sale));
  } catch (e) {
    console.error('getSale error:', e);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { customerId, items, subtotal, taxAmount, discountAmount, totalAmount, paymentMethod, amountPaid, change } = req.body;
    // @ts-ignore
    const userId = req.user?.userId;

    // Generate invoice number
    const count = await db.collection('Sale').countDocuments();
    const invoiceNumber = `TMP-${String(count + 1).padStart(6, '0')}`;

    const saleId = new ObjectId();

    // Insert sale
    await db.collection('Sale').insertOne({
      _id: saleId,
      invoiceNumber,
      customerId: customerId ? new ObjectId(customerId) : null,
      userId: userId ? new ObjectId(userId) : null,
      subtotal: Number(subtotal),
      taxAmount: Number(taxAmount || 0),
      discountAmount: Number(discountAmount || 0),
      totalAmount: Number(totalAmount),
      paymentMethod,
      amountPaid: Number(amountPaid),
      change: Number(change || 0),
      status: 'COMPLETED',
      createdAt: new Date(),
    });

    // Insert sale items & update stock
    for (const item of items) {
      const productId = new ObjectId(item.productId);

      await db.collection('SaleItem').insertOne({
        _id: new ObjectId(),
        saleId,
        productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.unitPrice) * Number(item.quantity),
      });

      const product = await db.collection('Product').findOne({ _id: productId });
      if (product) {
        const previousStock = product.stock;
        const newStock = Math.max(0, previousStock - Number(item.quantity));

        await db.collection('Product').updateOne(
          { _id: productId },
          { $set: { stock: newStock, updatedAt: new Date() } }
        );

        await db.collection('InventoryTransaction').insertOne({
          _id: new ObjectId(),
          productId,
          type: 'OUT',
          quantity: Number(item.quantity),
          previousStock,
          newStock,
          reason: 'Sale',
          userId: userId ? new ObjectId(userId) : null,
          createdAt: new Date(),
        });
      }
    }

    // Return enriched sale
    const created = await db.collection('Sale').findOne({ _id: saleId });
    res.status(201).json(await enrichSale(db, created));
  } catch (e) {
    console.error('createSale error:', e);
    res.status(500).json({ error: 'Failed to create sale' });
  }
};