const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const DATA_DIR = path.join(__dirname, 'data');

const USER_FILE = path.join(DATA_DIR, 'users.json');
const PROJECT_FILE = path.join(DATA_DIR, 'projects.json');
const BUG_FILE = path.join(DATA_DIR, 'bugs.json');

const seedUsers = [
  {
    _id: '65f100000000000000000001',
    name: 'Admin User',
    email: 'admin@bugtracker.com',
    password: 'Admin@123456',
    role: 'admin',
    department: 'Management',
    isActive: true,
    createdAt: '2024-01-01T09:00:00.000Z'
  },
  {
    _id: '65f100000000000000000002',
    name: 'Arjun Sharma',
    email: 'dev@bugtracker.com',
    password: 'Dev@123456',
    role: 'developer',
    department: 'Engineering',
    isActive: true,
    createdAt: '2024-01-01T09:05:00.000Z'
  },
  {
    _id: '65f100000000000000000003',
    name: 'Priya Venkat',
    email: 'priya@bugtracker.com',
    password: 'Dev@123456',
    role: 'developer',
    department: 'Engineering',
    isActive: true,
    createdAt: '2024-01-01T09:10:00.000Z'
  },
  {
    _id: '65f100000000000000000004',
    name: 'Meena Raj',
    email: 'tester@bugtracker.com',
    password: 'Tester@123456',
    role: 'tester',
    department: 'QA',
    isActive: true,
    createdAt: '2024-01-01T09:15:00.000Z'
  },
  {
    _id: '65f100000000000000000005',
    name: 'Karan Das',
    email: 'karan@bugtracker.com',
    password: 'Dev@123456',
    role: 'developer',
    department: 'Backend',
    isActive: true,
    createdAt: '2024-01-01T09:20:00.000Z'
  }
];

const seedProjects = [
  {
    _id: '65f200000000000000000001',
    name: 'Authentication',
    key: 'AUTH',
    description: 'Login, OAuth, 2FA, session management',
    status: 'active',
    createdAt: '2024-01-01T10:00:00.000Z'
  },
  {
    _id: '65f200000000000000000002',
    name: 'Payments',
    key: 'PAY',
    description: 'Stripe/Razorpay integration, refunds',
    status: 'active',
    createdAt: '2024-01-01T10:05:00.000Z'
  },
  {
    _id: '65f200000000000000000003',
    name: 'Dashboard',
    key: 'DASH',
    description: 'Analytics UI, charts, filters, export',
    status: 'active',
    createdAt: '2024-01-01T10:10:00.000Z'
  },
  {
    _id: '65f200000000000000000004',
    name: 'API',
    key: 'API',
    description: 'REST & GraphQL, rate limiting, auth',
    status: 'active',
    createdAt: '2024-01-01T10:15:00.000Z'
  }
];

const bugSeeds = [
  ['65f300000000000000000001', 'Login crashes on Safari mobile', 'Authentication', 'critical', 'open', 'Arjun Sharma', '2024-01-15T10:00:00.000Z', 0.93, 98, 'production', 'Auth UI'],
  ['65f300000000000000000002', 'Payment fails silently for Visa cards', 'Payments', 'critical', 'in_progress', 'Priya Venkat', '2024-01-14T10:00:00.000Z', 0.89, 96, 'production', 'Checkout'],
  ['65f300000000000000000003', 'Dashboard charts not loading on Firefox', 'Dashboard', 'high', 'open', 'Karan Das', '2024-01-14T12:00:00.000Z', 0.81, 74, 'staging', 'Charts'],
  ['65f300000000000000000004', 'API rate limit not applied correctly', 'API', 'high', 'in_progress', 'Arjun Sharma', '2024-01-13T08:00:00.000Z', 0.84, 72, 'production', 'Gateway'],
  ['65f300000000000000000005', 'Password reset email not sent', 'Authentication', 'high', 'resolved', 'Meena Raj', '2024-01-12T08:00:00.000Z', 0.77, 71, 'production', 'Notifications'],
  ['65f300000000000000000006', 'Session expires too quickly', 'Authentication', 'medium', 'open', 'Karan Das', '2024-01-11T08:00:00.000Z', 0.71, 48, 'production', 'Sessions'],
  ['65f300000000000000000007', 'Currency formatting wrong for INR', 'Payments', 'medium', 'resolved', 'Priya Venkat', '2024-01-10T08:00:00.000Z', 0.68, 44, 'staging', 'Pricing'],
  ['65f300000000000000000008', 'Export button missing on mobile', 'Dashboard', 'low', 'resolved', 'Meena Raj', '2024-01-09T08:00:00.000Z', 0.62, 18, 'production', 'Responsive UI'],
  ['65f300000000000000000009', 'Tooltip text truncated on small screens', 'Dashboard', 'low', 'closed', 'Karan Das', '2024-01-08T08:00:00.000Z', 0.59, 12, 'production', 'Tooltips'],
  ['65f30000000000000000000a', 'GraphQL query timeout after 30s', 'API', 'high', 'in_progress', 'Arjun Sharma', '2024-01-07T08:00:00.000Z', 0.86, 73, 'production', 'GraphQL'],
  ['65f30000000000000000000b', '2FA code rejected on Google Auth', 'Authentication', 'critical', 'open', 'Priya Venkat', '2024-01-06T08:00:00.000Z', 0.91, 97, 'production', '2FA'],
  ['65f30000000000000000000c', 'Refund API returns 500 on retry', 'Payments', 'high', 'open', 'Arjun Sharma', '2024-01-05T08:00:00.000Z', 0.83, 75, 'production', 'Refunds']
];

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || '',
    isActive: user.isActive !== false,
    createdAt: user.createdAt
  };
}

function makeToken(user) {
  return Buffer.from(`${user._id}:${user.email}`).toString('base64url');
}

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const raw = Buffer.from(authHeader.slice(7), 'base64url').toString('utf8');
    const [id, email] = raw.split(':');
    return { id, email };
  } catch (_error) {
    return null;
  }
}

function predictAI(text) {
  const input = String(text || '').toLowerCase();
  const severityMap = {
    critical: { confidence: 0.88, priority_rank: 96 },
    high: { confidence: 0.77, priority_rank: 72 },
    medium: { confidence: 0.65, priority_rank: 45 },
    low: { confidence: 0.55, priority_rank: 16 }
  };

  let severity = 'low';

  if (['crash', 'data loss', 'security', 'null pointer', 'corrupt', 'breach', 'deadlock'].some((word) => input.includes(word))) {
    severity = 'critical';
  } else if (['error', 'exception', 'fail', 'broken', 'not working', '500', 'timeout'].some((word) => input.includes(word))) {
    severity = 'high';
  } else if (['slow', 'wrong', 'incorrect', 'missing', 'performance', 'latency'].some((word) => input.includes(word))) {
    severity = 'medium';
  }

  const base = severityMap[severity];
  const confidence = Math.min(0.97, base.confidence + 0.04);
  const remainder = (1 - confidence) / 3;
  const severity_scores = {
    low: severity === 'low' ? confidence : remainder,
    medium: severity === 'medium' ? confidence : remainder,
    high: severity === 'high' ? confidence : remainder,
    critical: severity === 'critical' ? confidence : remainder
  };

  return {
    severity,
    confidence,
    priority_rank: base.priority_rank,
    severity_scores,
    suggested_assignee_type: {
      critical: 'Lead Dev',
      high: 'Senior Dev',
      medium: 'Developer',
      low: 'Junior Dev'
    }[severity]
  };
}

function chooseAutoAssignee(users, bugs) {
  const developers = users.filter((user) => user.role === 'developer' && user.isActive);
  if (!developers.length) {
    return null;
  }

  return developers
    .map((user) => ({
      user,
      openCount: bugs.filter((bug) => bug.assignee && bug.assignee._id === user._id && ['open', 'in_progress'].includes(bug.status)).length
    }))
    .sort((a, b) => a.openCount - b.openCount || a.user.name.localeCompare(b.user.name))[0].user;
}

async function ensureFile(filePath, seedValue) {
  try {
    await fs.access(filePath);
  } catch (_error) {
    await fs.writeFile(filePath, JSON.stringify(seedValue, null, 2));
  }
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2));
}

async function ensureData() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const seedBugs = bugSeeds.map(([id, title, projectName, severity, status, assigneeName, createdAt, aiConfidenceScore, priorityRank, environment, component]) => {
    const project = seedProjects.find((entry) => entry.name === projectName);
    const user = seedUsers.find((entry) => entry.name === assigneeName);

    return {
      _id: id,
      title,
      description: title,
      environment,
      component,
      severity,
      status,
      project: project ? { _id: project._id, name: project.name, key: project.key } : null,
      assignee: user ? { _id: user._id, name: user.name, email: user.email } : null,
      aiConfidenceScore,
      priorityRank,
      createdAt,
      updatedAt: createdAt
    };
  });

  await ensureFile(USER_FILE, seedUsers);
  await ensureFile(PROJECT_FILE, seedProjects);
  await ensureFile(BUG_FILE, seedBugs);
}

app.use(express.json());
app.use(express.static(FRONTEND_DIR));

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, storage: 'json', realtime: true });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const users = await readJson(USER_FILE, seedUsers);
  const user = users.find((entry) => entry.email.toLowerCase() === String(email || '').trim().toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'User is inactive' });
  }

  res.json({
    accessToken: makeToken(user),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || ''
    }
  });
});

app.post('/api/auth/logout', async (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/users', async (_req, res) => {
  const users = await readJson(USER_FILE, seedUsers);
  res.json({ users: users.map(publicUser) });
});

app.post('/api/users', async (req, res) => {
  const users = await readJson(USER_FILE, seedUsers);
  const { name, email, password, role, department } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password and role are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const user = {
    _id: crypto.randomUUID().replace(/-/g, '').slice(0, 24),
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password),
    role: String(role),
    department: String(department || '').trim(),
    isActive: true,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await writeJson(USER_FILE, users);
  res.status(201).json({ user: publicUser(user) });
});

app.patch('/api/users/:id/toggle', async (req, res) => {
  const users = await readJson(USER_FILE, seedUsers);
  const user = users.find((entry) => entry._id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isActive = !user.isActive;
  await writeJson(USER_FILE, users);
  res.json({ user: publicUser(user) });
});

app.delete('/api/users/:id', async (req, res) => {
  const users = await readJson(USER_FILE, seedUsers);
  const bugs = await readJson(BUG_FILE, []);
  const user = users.find((entry) => entry._id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const nextUsers = users.filter((entry) => entry._id !== req.params.id);
  const nextBugs = bugs.map((bug) => {
    if (bug.assignee && bug.assignee._id === req.params.id) {
      return { ...bug, assignee: null, updatedAt: new Date().toISOString() };
    }
    return bug;
  });

  await writeJson(USER_FILE, nextUsers);
  await writeJson(BUG_FILE, nextBugs);
  res.json({ ok: true });
});

app.get('/api/projects', async (_req, res) => {
  const projects = await readJson(PROJECT_FILE, seedProjects);
  res.json({ projects });
});

app.post('/api/projects', async (req, res) => {
  const projects = await readJson(PROJECT_FILE, seedProjects);
  const { name, key, description } = req.body || {};

  if (!name || !key) {
    return res.status(400).json({ message: 'Name and key are required' });
  }

  if (projects.some((project) => project.name.toLowerCase() === String(name).trim().toLowerCase() || project.key.toLowerCase() === String(key).trim().toLowerCase())) {
    return res.status(409).json({ message: 'Project already exists' });
  }

  const project = {
    _id: crypto.randomUUID().replace(/-/g, '').slice(0, 24),
    name: String(name).trim(),
    key: String(key).trim().toUpperCase(),
    description: String(description || '').trim(),
    status: 'active',
    createdAt: new Date().toISOString()
  };

  projects.push(project);
  await writeJson(PROJECT_FILE, projects);
  res.status(201).json({ project });
});

app.get('/api/bugs', async (_req, res) => {
  const bugs = await readJson(BUG_FILE, []);
  res.json({ bugs: bugs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post('/api/bugs', async (req, res) => {
  const bugs = await readJson(BUG_FILE, []);
  const users = await readJson(USER_FILE, seedUsers);
  const projects = await readJson(PROJECT_FILE, seedProjects);
  const { title, description, environment, component, projectId, assignee } = req.body || {};

  if (!title || !description || !projectId) {
    return res.status(400).json({ message: 'Project, title and description are required' });
  }

  const project = projects.find((entry) => entry._id === projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const selectedAssignee = assignee
    ? users.find((entry) => entry._id === assignee && entry.isActive)
    : chooseAutoAssignee(users, bugs);

  const ai = predictAI(`${title} ${description} ${component || ''} ${environment || ''}`);
  const now = new Date().toISOString();
  const bug = {
    _id: crypto.randomUUID().replace(/-/g, '').slice(0, 24),
    title: String(title).trim(),
    description: String(description).trim(),
    environment: String(environment || 'production').trim(),
    component: String(component || '').trim(),
    severity: ai.severity,
    status: 'open',
    project: { _id: project._id, name: project.name, key: project.key },
    assignee: selectedAssignee ? { _id: selectedAssignee._id, name: selectedAssignee.name, email: selectedAssignee.email } : null,
    aiConfidenceScore: ai.confidence,
    priorityRank: ai.priority_rank,
    createdAt: now,
    updatedAt: now
  };

  bugs.unshift(bug);
  await writeJson(BUG_FILE, bugs);
  res.status(201).json({ bug });
});

app.patch('/api/bugs/:id/status', async (req, res) => {
  const bugs = await readJson(BUG_FILE, []);
  const bug = bugs.find((entry) => entry._id === req.params.id);
  const allowed = ['open', 'in_progress', 'resolved', 'closed', 'rejected'];

  if (!bug) {
    return res.status(404).json({ message: 'Bug not found' });
  }

  if (!allowed.includes(req.body?.status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  bug.status = req.body.status;
  bug.updatedAt = new Date().toISOString();
  await writeJson(BUG_FILE, bugs);
  res.json({ bug });
});

app.post('/api/ai/predict', async (req, res) => {
  const { title, description, environment } = req.body || {};
  res.json(predictAI(`${title || ''} ${description || ''} ${environment || ''}`));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

ensureData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`BugTracker AI running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
