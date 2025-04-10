require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('./models/User');
const fetch = require('node-fetch');

const app = express();
const port = 3001;

// Update CORS to allow requests from any origin during development
app.use(cors({
  // Allow all origins in development mode
  origin: '*', 
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('GenAI initialized with API key:', genAI.apiKey ? 'Present' : 'Missing');

const searchCache = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Add this near the top with other initializations
console.log('YouTube API key:', process.env.YOUTUBE_API_KEY ? 'Present' : 'Missing');

// Registration route
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Received registration request for username:', username);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    
    await user.save();
    
    console.log('User registered successfully');
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in /register route:', error);
    res.status(500).json({ error: 'Error registering user', details: error.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for user:', username);
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    console.log('Login successful for user:', username);
    res.json({ token });
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ error: 'Error logging in', details: error.message });
  }
});

// Middleware to verify JWT - Improved error reporting
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
  
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    console.log('Token verified for user ID:', user.userId);
    next();
  });
}

app.post('/ask', authenticateToken, async (req, res) => {
    const { message } = req.body;
    console.log('Received message:', message);

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Verify API key is available
        if (!process.env.GEMINI_API_KEY) {
            console.error('Gemini API key is missing');
            return res.status(500).json({ error: 'API configuration error' });
        }

        // Try the updated model name (Gemini 1.5 Pro is the latest as of August 2023)
        // If this fails, we'll fall back to other model options
        let model;
        let text;
        
        try {
            // Try with gemini-1.5-pro first (latest model)
            model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            console.log('Trying with model: gemini-1.5-pro');
            const result = await model.generateContent(message);
            const response = await result.response;
            text = response.text();
        } catch (modelError) {
            console.log('First model attempt failed, trying alternative model');
            
            try {
                // Fall back to gemini-pro-vision if the first one fails
                model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
                console.log('Trying with model: gemini-pro-vision');
                const result = await model.generateContent(message);
                const response = await result.response;
                text = response.text();
            } catch (fallbackError) {
                console.log('Second model attempt failed, trying final alternative');
                
                // Final fallback to gemini-1.0-pro
                model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
                console.log('Trying with model: gemini-1.0-pro');
        const result = await model.generateContent(message);
        const response = await result.response;
                text = response.text();
            }
        }
        
        console.log('Gemini API response received successfully');
        res.json({ response: text });
    } catch (error) {
        console.error('Error in /ask route:', error);
        
        // More structured error handling
        let errorMessage = 'An error occurred while processing your request.';
        let errorDetails = error.message || 'Unknown error';
        
        // Check if this is a model-specific error
        if (error.message && error.message.includes('models/')) {
            errorMessage = 'The AI model specified is not available. This may be due to API version changes.';
            errorDetails = 'Please update the @google/generative-ai package to the latest version: npm install @google/generative-ai@latest';
        }
        
        res.status(500).json({ 
            error: errorMessage, 
            details: errorDetails,
            suggestion: 'Please check the console logs on the server for more details.'
        });
    }
});

// Add a simple test endpoint that doesn't require authentication
app.get('/api-test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Add a diagnostic endpoint to check available Gemini models
app.get('/check-models', async (req, res) => {
    try {
        console.log('Checking available Gemini models...');
        // This endpoint lists all available models for the provided API key
        const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GEMINI_API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Available models:', data);
        
        // Extract just the model names for easier reading
        const modelNames = data.models ? data.models.map(model => model.name) : [];
        
        res.json({ 
            message: 'Models retrieved successfully',
            count: modelNames.length,
            availableModels: modelNames
        });
    } catch (error) {
        console.error('Error checking Gemini models:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve models', 
            details: error.message 
        });
    }
});

app.get('/test-db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Update the YouTube search route with caching
app.get('/api/youtube/search', authenticateToken, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Check cache first
        const cacheKey = `youtube:${query}`;
        const cachedResult = searchCache.get(cacheKey);
        if (cachedResult) {
            const { data, timestamp } = cachedResult;
            if (Date.now() - timestamp < CACHE_DURATION) {
                return res.json(data);
            }
            // Cache expired, remove it
            searchCache.delete(cacheKey);
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}&maxResults=10&type=video`
        );

        if (!response.ok) {
            throw new Error('YouTube API request failed');
        }

        const data = await response.json();
        
        // Store in cache
        searchCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        res.json(data);
    } catch (error) {
        console.error('YouTube search error:', error);
        res.status(500).json({ error: 'Failed to fetch YouTube results' });
    }
});

// Add this new endpoint to check YouTube API status
app.get('/api/youtube/status', async (req, res) => {
    try {
        if (!process.env.YOUTUBE_API_KEY) {
            return res.status(500).json({ 
                status: 'error',
                message: 'YouTube API key is not configured'
            });
        }

        // Test the API key with a simple search
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=${process.env.YOUTUBE_API_KEY}&maxResults=1`
        );

        const data = await response.json();

        if (response.ok) {
            res.json({
                status: 'success',
                message: 'YouTube API is working correctly',
                quota: response.headers.get('x-quota-used') || 'Unknown'
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: data.error ? data.error.message : 'YouTube API request failed',
                details: data
            });
        }
    } catch (error) {
        console.error('YouTube API status check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check YouTube API status',
            details: error.message
        });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`);
});