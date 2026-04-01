require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');

const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);


console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('ENV VARS:', Object.keys(process.env).filter(k => k.includes('SUPA')))

// Initialize Supabase Client for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin/backend actions
);

const io = new Server(server, {
  cors: {
    origin: ["https://boardnify.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Configure CORS specifically for Vercel and local dev
app.use(cors({
  origin: ["https://boardnify.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Ensure uploads directory exists (backup for ephemeral storage)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  console.log(`[Backend] Creating uploads directory: ${uploadDir}`);
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Multer setup for temporary file handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// --- API ROUTES ---

/**
 * User Registration Endpoint
 * Logic: Uses Supabase Auth to create a new user.
 */
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Backend] Registration attempt for: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://boardnify.vercel.app'
      }
    });

    if (error) {
      console.error(`[Backend] Registration error for ${email}:`, error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log(`[Backend] User created successfully: ${email}`);
    res.status(201).json({
      message: 'Registration successful. Please check your email for confirmation.',
      user: data.user
    });
  } catch (err) {
    console.error(`[Backend] Unexpected registration error:`, err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * File Upload Endpoint
 * Logic: Receives file via multer, uploads to Supabase Storage, and returns public URL.
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log(`[Backend] Upload attempt started`);

  if (!req.file) {
    console.error(`[Backend] Upload error: No file provided`);
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const fileName = req.file.filename;
  const bucketName = 'moodboard-assets';

  try {
    const fileContent = fs.readFileSync(filePath);
    console.log(`[Backend] Uploading to Supabase bucket: ${bucketName}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`public/${fileName}`, fileContent, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error(`[Backend] Supabase storage error:`, uploadError.message);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`public/${fileName}`);

    console.log(`[Backend] Upload successful. Public URL: ${publicUrlData.publicUrl}`);

    // Clean up local file (ephemeral storage)
    fs.unlinkSync(filePath);

    res.json({
      url: publicUrlData.publicUrl,
      type: req.file.mimetype
    });
  } catch (err) {
    console.error(`[Backend] Final upload error:`, err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: err.message || 'Failed to upload to cloud storage' });
  }
});

const requireApiKey = (req, res, next) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  next();
};

// AI Proxies
const anthropicProxy = (req, res, payload, apiKey, retries = 1) => {
  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    console.log("Anthropic Response Status:", proxyRes.statusCode);

    if (proxyRes.statusCode === 500 && retries > 0) {
      console.log("Anthropic returned 500, retrying once...");
      return anthropicProxy(req, res, payload, apiKey, retries - 1);
    }

    if (proxyRes.statusCode === 401) {
      console.error("Anthropic 401 Error: API key is invalid or missing");
      return res.status(401).json({ error: "API key is invalid or missing" });
    }

    if (proxyRes.statusCode === 429) {
      console.warn("Anthropic 429 Error: Rate limit hit");
      return res.status(429).json({ error: "Too many requests, please try again in a moment." });
    }

    if (proxyRes.statusCode >= 400) {
      let errorBody = '';
      proxyRes.on('data', chunk => errorBody += chunk);
      proxyRes.on('end', () => {
        console.error(`Anthropic ${proxyRes.statusCode} Error:`, errorBody);
        if (!res.headersSent) {
          res.status(proxyRes.statusCode).json({ error: `Anthropic API Error: ${errorBody}` });
        }
      });
      return;
    }

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error("Proxy Request Error:", e);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  });

  proxyReq.write(JSON.stringify(payload));
  proxyReq.end();
};

app.post('/api/generate-script', requireApiKey, (req, res) => {
  try {
    console.log("Incoming request body:", req.body);
    const { scriptType, targetAudience, description, tone, length, callToAction } = req.body;

    const systemPrompt = `You are a world-class creative copywriter specializing in ultra-converting video scripts.
Your scripts must sound completely human-written with natural speech patterns, conversational rhythm, imperfect sentence structures where appropriate, emotional language, and storytelling flow.
NEVER use corporate filler phrases, buzzwords, or robotic transitions.
BANNED PHRASES: "In conclusion", "In today's fast paced world", "Look no further", "Are you tired of", "Game changer", "Revolutionary", "Seamlessly", and anything that signals AI writing.
Open with a pattern-interrupting hook in the first 3 seconds that stops the viewer from scrolling.
Build emotional tension in the middle.
Close with a call to action that feels like a natural next step, not a hard sell.
The length must hit the target duration accurately based on average speaking pace of 130 words per minute.
Output ONLY valid HTML using <h3> for Scene Headings and <p> for speech/action. No markdown wrapping.`;

    const prompt = `Video Type: ${scriptType}\nTarget Audience: ${targetAudience}\nKey Message: ${description}\nTone: ${tone}\nLength: ${length}\nCall to Action: ${callToAction}\n\nWrite the exact script HTML now. No preamble.`;

    const payload = {
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
      system: systemPrompt
    };

    console.log("Anthropic Payload:", JSON.stringify(payload, null, 2));

    anthropicProxy(req, res, payload, process.env.ANTHROPIC_API_KEY);
  } catch (error) {
    console.error("Generate script error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/test-script', requireApiKey, (req, res) => {
  try {
    console.log("Incoming request body:", req.body);
    const { scriptContent } = req.body;

    const systemPrompt = `You are an elite script conversion analyst.
Read the provided script HTML and give a deep, specific analysis referencing actual lines.
You must return your analysis as a pure JSON object. No markdown, no HTML wrappers. 
Format:
{
  "score": 0,
  "verdict": "",
  "hook_strength": 0,
  "emotional_pull": 0,
  "clarity": 0,
  "cta_strength": 0,
  "pacing": 0,
  "what_works": [ "quoted line" ],
  "what_needs_fixing": [ 
    { "weak_quote": "exact weak line", "improved_version": "concrete improved line" }
  ]
}`;

    const payload = {
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      stream: false,
      messages: [{ role: 'user', content: scriptContent }],
      system: systemPrompt
    };

    console.log("Anthropic Payload:", JSON.stringify(payload, null, 2));

    const makeRequest = (retries = 1) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      };

      const proxyReq = https.request(options, (proxyRes) => {
        console.log("Anthropic Response Status:", proxyRes.statusCode);

        let body = '';
        proxyRes.on('data', chunk => body += chunk);
        proxyRes.on('end', () => {
          if (proxyRes.statusCode === 500 && retries > 0) {
            console.log("Anthropic returned 500, retrying once...");
            console.log("500 Error Body:", body);
            return makeRequest(retries - 1);
          }

          if (proxyRes.statusCode === 401) {
            console.error("Anthropic 401 Error: API key is invalid or missing");
            return res.status(401).json({ error: "API key is invalid or missing" });
          }

          if (proxyRes.statusCode === 429) {
            console.warn("Anthropic 429 Error: Rate limit hit");
            return res.status(429).json({ error: "Too many requests, please try again in a moment." });
          }

          if (proxyRes.statusCode >= 400) {
            console.error(`Anthropic ${proxyRes.statusCode} Error:`, body);
            return res.status(proxyRes.statusCode).json({ error: `Anthropic API Error: ${body}` });
          }

          try {
            const responseData = JSON.parse(body);
            let aiText = responseData.content[0].text;

            if (aiText.startsWith('\`\`\`json')) {
              aiText = aiText.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
            } else if (aiText.startsWith('\`\`\`')) {
              aiText = aiText.replace(/^\`\`\`/m, '').replace(/\`\`\`$/m, '').trim();
            }
            res.json(JSON.parse(aiText));
          } catch (err) {
            console.error("Parse Error:", err, "Raw Output:", body);
            res.status(500).json({ error: 'Failed to parse AI response' });
          }
        });
      });

      proxyReq.on('error', (e) => {
        console.error("Test Script Proxy Error:", e);
        res.status(500).json({ error: e.message });
      });
      proxyReq.write(JSON.stringify(payload));
      proxyReq.end();
    };

    makeRequest();

  } catch (error) {
    console.error("Test script error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/rewrite-script', requireApiKey, (req, res) => {
  try {
    console.log("Incoming request body:", req.body);
    const { scriptContent, conversionFeedback } = req.body;

    const systemPrompt = `You are an elite human-conversion script doctor.
Rewrite the provided script fixing the specific weak points. Preserve the original voice, tone, and intent. Keep core message intact.
The rewrite must never replace the entire script with something completely different.
Make it sound like a real human said it out loud. Do not use AI corporate buzzwords.
CRITICAL RULE: Output ONLY the exact rewritten script HTML. No introductions or pleasantries.
Wherever you changed something, wrap the removed old text in <del class="bg-red-100 text-red-800 line-through"> and the newly added text in <ins class="bg-green-100 text-green-800 underline">. Do not wrap unmodified text in anything.
Do not use markdown backticks or wrappers. ONLY raw HTML output.`;

    const payload = {
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      stream: true,
      messages: [{ role: 'user', content: `Original Script: \n\n${scriptContent}\n\nFeedback: \n\n${JSON.stringify(conversionFeedback)}` }],
      system: systemPrompt
    };

    console.log("Anthropic Payload:", JSON.stringify(payload, null, 2));

    anthropicProxy(req, res, payload, process.env.ANTHROPIC_API_KEY);
  } catch (error) {
    console.error("Rewrite script error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Real-time socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  socket.on('element-moved', (data) => {
    socket.to(data.projectId).emit('element-moved', data);
  });

  socket.on('element-added', (data) => {
    socket.to(data.projectId).emit('element-added', data);
  });

  socket.on('new-comment', (data) => {
    socket.to(data.projectId).emit('new-comment', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
