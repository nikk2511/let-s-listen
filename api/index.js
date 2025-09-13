export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, limit = 10, artistId, action } = req.query;
        
        console.log('🔍 API Request:', { query, limit, artistId, action, method: req.method });
        
        // Health check
        if (action === 'health' || !query && !artistId) {
            return res.status(200).json({
                status: 'OK',
                message: 'Let\'s Listen API is working!',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production'
            });
        }
        
        let audiusUrl;
        let logMessage;
        
        if (artistId) {
            // Artist details request
            audiusUrl = `https://discoveryprovider.audius.co/v1/users/${artistId}`;
            logMessage = `👤 Fetching artist details for ID: ${artistId}`;
        } else if (query) {
            // Track search request
            audiusUrl = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`;
            logMessage = `🔍 Searching Audius for: "${query}"`;
        } else {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                details: 'Please provide either "query" for search or "artistId" for artist details'
            });
        }
        
        console.log(logMessage);
        console.log(`📡 Audius API URL: ${audiusUrl}`);
        
        // Fetch from Audius API
        const response = await fetch(audiusUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Lets-Listen/1.0.0',
                'Content-Type': 'application/json'
            }
        });

        console.log(`📊 Audius API Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Audius API Error: ${response.status} - ${errorText}`);
            throw new Error(`Audius API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (artistId) {
            console.log(`✅ Artist details fetched successfully`);
        } else {
            console.log(`✅ Found ${data.data ? data.data.length : 0} tracks`);
        }
        
        // Return the data
        res.status(200).json(data);
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        res.status(500).json({ 
            error: 'Failed to fetch data from Audius API',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
