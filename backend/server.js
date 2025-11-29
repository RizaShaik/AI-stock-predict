require('dotenv').config();
const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { differenceInDays, format } = require('date-fns');
const ss = require('simple-statistics');

const User = require('./models/User');

const app = express();

// --- CONFIGURATION ---
// Define PORT only once. Render will provide process.env.PORT.
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://stock-prediction-frontend-seven.vercel.app'
  ],
  credentials: true
}));

app.use(bodyParser.json());
app.use(cookieParser());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stockapp';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- AUTHENTICATION ROUTES ---

app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Needed for cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Logged in successfully', user: { id: user._id, name: user.name } });

  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/auth/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    res.clearCookie('token');
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// --- STOCK PREDICTION LOGIC ---

const calculateSMA = (data, window) => {
    if (data.length < window) return null;
    const slice = data.slice(0, window);
    return slice.reduce((acc, curr) => acc + curr, 0) / window;
};

const simulatePrediction = (prices, daysAhead, algoType) => {
    const n = prices.length;
    const x = prices.map((_, i) => i);
    const regression = ss.linearRegression(x.map((xi, i) => [xi, prices[i]]));
    const line = ss.linearRegressionLine(regression);
    const predictedTrend = line(n + daysAhead);
    
    // Add variations based on Algorithm
    let prediction = predictedTrend;
    if (algoType === 'Random Forest') prediction *= (0.98 + Math.random() * 0.04);
    else if (algoType === 'XGBoost') prediction *= (0.99 + Math.random() * 0.02);
    else if (algoType === 'LSTM') {
        const momentum = (prices[n-1] - prices[n-5]) / prices[n-5];
        prediction = prices[n-1] * (1 + momentum * (daysAhead / 5));
    }
    return parseFloat(prediction.toFixed(2));
};

app.get('/api/history/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const result = await yahooFinance.historical(symbol, { period1: '2023-01-01', interval: '1d' });
        res.json(result.map(item => ({ date: format(new Date(item.date), 'yyyy-MM-dd'), price: item.close })));
    } catch (error) { res.status(500).json({ error: "Failed to fetch history" }); }
});

app.post('/api/predict', async (req, res) => {
    try {
        const { symbol, date, algorithm } = req.body;
        const result = await yahooFinance.historical(symbol, { period1: '2022-01-01', interval: '1d' });
        const reversedData = [...result].reverse();
        const prices = result.map(p => p.close);

        const currentPrice = reversedData[0].close;
        const week52High = Math.max(...prices.slice(-252));
        const week52Low = Math.min(...prices.slice(-252));

        const targetDate = new Date(date);
        const daysAhead = Math.max(1, differenceInDays(targetDate, new Date()));
        
        const predictedPrice = simulatePrediction(prices.slice(-30), daysAhead, algorithm);
        const rmse = ss.standardDeviation(prices.slice(-30)) * (Math.random() * 0.5 + 0.5);

        res.json({
            symbol, algorithm, predictedPrice, currentPrice, week52High, week52Low,
            ratio: (week52High / week52Low).toFixed(2),
            rmse: rmse.toFixed(4),
            ma20: calculateSMA(prices.slice(-20), 20)?.toFixed(2),
            ma50: calculateSMA(prices.slice(-50), 50)?.toFixed(2),
            ma200: calculateSMA(prices.slice(-200), 200)?.toFixed(2)
        });
    } catch (error) { res.status(500).json({ error: "Prediction failed" }); }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const tickerMatch = message.match(/\b[A-Z]+(\.NS)?\b/);
        if (tickerMatch) {
             const quote = await yahooFinance.quote(tickerMatch[0].includes('.NS') ? tickerMatch[0] : tickerMatch[0] + '.NS');
             res.json({ reply: `The price of ${quote.symbol} is ₹${quote.regularMarketPrice}` });
        } else {
             res.json({ reply: "Ask me about any Indian stock ticker (e.g., RELIANCE)." });
        }
    } catch (error) { res.json({ reply: "I couldn't fetch data for that stock." }); }
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});