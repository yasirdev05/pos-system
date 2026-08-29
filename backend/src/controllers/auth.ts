import { Request, Response } from 'express';
import { getDb } from '../config/native-db';
import { comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const db = await getDb();
    const user = await db.collection('User').findOne({ email: String(email).toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userId = user._id.toString();
    const token = generateToken(userId, user.role);

    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.userId;

    const db = await getDb();
    const { ObjectId } = await import('mongodb');
    const user = await db.collection('User').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
