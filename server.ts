import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

type UserRole = 'Wisatawan' | 'Kurator Katalog';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  salt: string;
  passwordHash: string;
  createdAt: string;
  isDemo?: boolean;
}

interface UserSavedData {
  favorit: unknown[];
  itinerary: Record<string, unknown> | null;
  updatedAt: string;
}

interface UsersStore {
  users: StoredUser[];
  userData: Record<string, UserSavedData>;
}

interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jti: string;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  authUser?: AuthSessionUser;
}

const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET && process.env.AUTH_SESSION_SECRET.trim().length >= 16
    ? process.env.AUTH_SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.resolve(DATA_DIR, 'users-store.json');

if (!STORE_FILE.startsWith(DATA_DIR + path.sep)) {
  throw new Error('Invalid store file path outside .data directory.');
}

const revokedJtis = new Map<string, number>();

function hashPassword(password: string, salt?: string): { salt: string; passwordHash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64);
  return { salt: actualSalt, passwordHash: derived.toString('hex') };
}

function verifyPassword(password: string, salt: string, expectedHashHex: string): boolean {
  if (!password || !salt || !expectedHashHex) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHashHex, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function verifyEnvPasscode(candidate: string, configuredSecret: string): boolean {
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(configuredSecret).digest();
  return crypto.timingSafeEqual(a, b);
}

function loadStore(): UsersStore {
  let store: UsersStore = { users: [], userData: {} };
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<UsersStore>;
      if (Array.isArray(parsed.users)) {
        store.users = parsed.users;
      }
      if (parsed.userData && typeof parsed.userData === 'object') {
        store.userData = parsed.userData;
      }
    }
  } catch {
    store = { users: [], userData: {} };
  }

  // Ensure non-privileged demo traveler account is available for preview login
  const hasDemoTraveler = store.users.some((u) => u.id === 'demo-traveler');
  if (!hasDemoTraveler) {
    const { salt, passwordHash } = hashPassword('hihu-wisatawan');
    store.users.push({
      id: 'demo-traveler',
      name: 'Aisyah Rahma (Wisatawan Demo)',
      email: 'wisatawan@hihueksplor.demo',
      role: 'Wisatawan',
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      isDemo: true,
    });
    saveStore(store);
  }

  return store;
}

function saveStore(store: UsersStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = path.resolve(DATA_DIR, `users-store.${process.pid}.tmp`);
  if (!tmpFile.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid temp store path.');
  }
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

let store: UsersStore = loadStore();

function toPublicUser(user: Pick<StoredUser, 'id' | 'name' | 'email' | 'role' | 'isDemo'>) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isDemo: Boolean(user.isDemo),
  };
}

function issueToken(user: Pick<StoredUser, 'id' | 'name' | 'email' | 'role'>): string {
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    jti: crypto.randomUUID(),
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${sig}`;
}

function pruneRevokedTokens(): void {
  const now = Date.now();
  for (const [jti, exp] of revokedJtis.entries()) {
    if (exp <= now) {
      revokedJtis.delete(jti);
    }
  }
}

function verifyToken(token: string): AuthSessionUser | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, sig] = parts;
  if (!encodedPayload || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      sub?: string;
      name?: string;
      email?: string;
      role?: UserRole;
      jti?: string;
      exp?: number;
    };
    if (!parsed.sub || !parsed.email || !parsed.role || !parsed.jti || !parsed.exp) {
      return null;
    }
    if (parsed.exp <= Date.now()) {
      return null;
    }
    pruneRevokedTokens();
    if (revokedJtis.has(parsed.jti)) {
      return null;
    }
    return {
      id: parsed.sub,
      name: String(parsed.name || ''),
      email: parsed.email,
      role: parsed.role === 'Kurator Katalog' ? 'Kurator Katalog' : 'Wisatawan',
      jti: parsed.jti,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, errorCode: 'UNAUTHORIZED' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ ok: false, errorCode: 'UNAUTHORIZED' });
    return;
  }
  req.authUser = user;
  next();
}

function isValidEmail(email: string): boolean {
  return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAuthStatusPayload() {
  const adminEnvConfigured = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim());
  const adminClaimed = store.users.some((u) => u.role === 'Kurator Katalog');
  return {
    adminEnvConfigured,
    adminClaimed,
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '128kb' }));

  app.get('/api/auth/status', (_req: Request, res: Response) => {
    res.json({ ok: true, ...getAuthStatusPayload() });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (name.length < 2 || name.length > 80 || !isValidEmail(email) || password.length < 6 || password.length > 128) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_INPUT' });
      return;
    }

    if (store.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ ok: false, errorCode: 'EMAIL_EXISTS' });
      return;
    }

    const { salt, passwordHash } = hashPassword(password);
    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID()}`,
      name,
      email,
      role: 'Wisatawan',
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    store.users.unshift(newUser);
    saveStore(store);

    const token = issueToken(newUser);
    res.status(201).json({ ok: true, token, user: toPublicUser(newUser) });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      res.status(400).json({ ok: false, errorCode: 'EMPTY_FIELDS' });
      return;
    }

    const found = store.users.find((u) => u.email.toLowerCase() === email);
    if (!found || !verifyPassword(password, found.salt, found.passwordHash)) {
      res.status(401).json({ ok: false, errorCode: 'INVALID_CREDENTIALS' });
      return;
    }

    const token = issueToken(found);
    res.json({ ok: true, token, user: toPublicUser(found) });
  });

  app.post('/api/auth/demo-login', (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const accountId = typeof body.accountId === 'string' ? body.accountId : '';
    if (accountId !== 'demo-traveler') {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN' });
      return;
    }

    const found = store.users.find((u) => u.id === 'demo-traveler' && u.role === 'Wisatawan');
    if (!found) {
      res.status(404).json({ ok: false, errorCode: 'NOT_FOUND' });
      return;
    }

    const token = issueToken(found);
    res.json({ ok: true, token, user: toPublicUser(found) });
  });

  app.post('/api/auth/claim-admin', (req: Request, res: Response) => {
    const status = getAuthStatusPayload();
    if (status.adminEnvConfigured || status.adminClaimed) {
      res.status(409).json({ ok: false, errorCode: 'ADMIN_ALREADY_CONFIGURED' });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (name.length < 2 || name.length > 80 || !isValidEmail(email) || password.length < 6 || password.length > 128) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_INPUT' });
      return;
    }

    if (store.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ ok: false, errorCode: 'EMAIL_EXISTS' });
      return;
    }

    const { salt, passwordHash } = hashPassword(password);
    const curatorUser: StoredUser = {
      id: `cur-${crypto.randomUUID()}`,
      name,
      email,
      role: 'Kurator Katalog',
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    store.users.unshift(curatorUser);
    saveStore(store);

    const token = issueToken(curatorUser);
    res.status(201).json({ ok: true, token, user: toPublicUser(curatorUser), ...getAuthStatusPayload() });
  });

  app.post('/api/auth/admin-login', (req: Request, res: Response) => {
    const configuredPasscode = process.env.ADMIN_PASSCODE ? process.env.ADMIN_PASSCODE.trim() : '';
    if (!configuredPasscode) {
      res.status(400).json({ ok: false, errorCode: 'PASSCODE_NOT_CONFIGURED' });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const passcode = typeof body.passcode === 'string' ? body.passcode : '';
    if (!passcode || !verifyEnvPasscode(passcode, configuredPasscode)) {
      res.status(401).json({ ok: false, errorCode: 'INVALID_CREDENTIALS' });
      return;
    }

    const envCurator = {
      id: 'env-curator',
      name: 'Kurator Katalog',
      email: 'kurator@hihueksplor.local',
      role: 'Kurator Katalog' as UserRole,
      isDemo: false,
    };
    const token = issueToken(envCurator);
    res.json({ ok: true, token, user: toPublicUser(envCurator) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const stored = store.users.find((u) => u.id === authUser.id);
    const user = stored
      ? toPublicUser(stored)
      : { id: authUser.id, name: authUser.name, email: authUser.email, role: authUser.role, isDemo: false };
    res.json({ ok: true, user });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const body = (req.body || {}) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (name.length < 2 || name.length > 80) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_INPUT' });
      return;
    }

    const stored = store.users.find((u) => u.id === authUser.id);
    if (stored) {
      stored.name = name;
      saveStore(store);
    }

    const updatedUser = {
      id: authUser.id,
      name,
      email: authUser.email,
      role: authUser.role,
      isDemo: Boolean(stored?.isDemo),
    };
    const token = issueToken(updatedUser);
    res.json({ ok: true, token, user: toPublicUser(updatedUser) });
  });

  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    revokedJtis.set(authUser.jti, authUser.exp);
    res.json({ ok: true });
  });

  app.get('/api/user/data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const data = store.userData[authUser.id] || null;
    res.json({ ok: true, data });
  });

  app.put('/api/user/data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const body = (req.body || {}) as Record<string, unknown>;
    const rawFav = Array.isArray(body.favorit) ? body.favorit.slice(0, 100) : [];
    const rawItin =
      body.itinerary && typeof body.itinerary === 'object' && !Array.isArray(body.itinerary)
        ? (body.itinerary as Record<string, unknown>)
        : null;

    store.userData[authUser.id] = {
      favorit: rawFav,
      itinerary: rawItin,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    res.json({ ok: true });
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ ok: false, errorCode: 'NOT_FOUND' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hihu Eksplor server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
