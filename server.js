#!/usr/bin/env node
/**
 * Node.js HTTP server to serve the Let's Listen Music App locally.
 * This helps avoid CORS issues when testing the application.
 * 
 * Usage:
 *     npm start
 *     or
 *     node server.js
 * 
 * Then open: http://localhost:8000
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// API proxy for Audius API to avoid CORS issues
app.get('/api/audius/search', async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Missing query parameter' });
        }

        const audiusUrl = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`;
        
        console.log(`🔍 Searching Audius for: "${query}"`);
        console.log(`📡 API URL: ${audiusUrl}`);
        
        // Fetch from Audius API
        const response = await fetch(audiusUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Audius-Music-Search/1.0.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Audius API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Found ${data.data ? data.data.length : 0} tracks`);
        
        res.json(data);
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch tracks from Audius API',
            details: error.message 
        });
    }
});

// API proxy for artist details
app.get('/api/audius/artist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'Missing artist ID' });
        }

        const audiusUrl = `https://discoveryprovider.audius.co/v1/users/${id}`;
        
        console.log(`👤 Fetching artist details for ID: ${id}`);
        console.log(`📡 API URL: ${audiusUrl}`);
        
        // Fetch from Audius API
        const response = await fetch(audiusUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Audius-Music-Search/1.0.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Audius API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Artist details fetched successfully`);
        
        res.json(data);
        
    } catch (error) {
        console.error('❌ Artist API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch artist details from Audius API',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Let\'s Listen Music Server'
    });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log('🚀 Let\'s Listen Music App server running!');
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log(`⏹️  Press Ctrl+C to stop the server`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
    
    // Try to open browser automatically (Windows)
    if (process.platform === 'win32') {
        exec(`start http://localhost:${PORT}`, (error) => {
            if (error) {
                console.log('💡 Could not open browser automatically');
            } else {
                console.log('🌐 Browser opened automatically');
            }
        });
    }
    // Try to open browser automatically (macOS)
    else if (process.platform === 'darwin') {
        exec(`open http://localhost:${PORT}`, (error) => {
            if (error) {
                console.log('💡 Could not open browser automatically');
            } else {
                console.log('🌐 Browser opened automatically');
            }
        });
    }
    // Try to open browser automatically (Linux)
    else {
        exec(`xdg-open http://localhost:${PORT}`, (error) => {
            if (error) {
                console.log('💡 Could not open browser automatically');
            } else {
                console.log('🌐 Browser opened automatically');
            }
        });
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server gracefully...');
    process.exit(0);
});
