export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

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
};
