import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const router = express.Router();

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
    
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '8h' }
    );
    
    res.json({ accessToken, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// For testing purposes: create an initial admin user if none exist
router.post('/setup', async (req, res) => {
  try {
    const count = await prisma.user.count();
    if (count > 0) return res.status(400).json({ error: 'Setup already complete' });

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cybersentinel.local',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    res.json({ message: 'Admin user created', email: admin.email });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
