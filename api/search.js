export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { query, limit = 10 } = req.query;
        
        console.log('🔍 Search API called with query:', query);
        
        if (!query) {
            return res.status(400).json({ 
                error: 'Missing query parameter',
                message: 'Please provide a search query'
            });
        }

        const audiusUrl = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`;
        
        console.log('📡 Calling Audius API:', audiusUrl);
        
        // Fetch from Audius API
        const response = await fetch(audiusUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Lets-Listen/1.0.0'
            }
        });

        console.log('📊 Audius API Response:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`Audius API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Found tracks:', data.data ? data.data.length : 0);
        
        res.status(200).json(data);
        
    } catch (error) {
        console.error('❌ Search API Error:', error.message);
        
        res.status(500).json({ 
            error: 'Failed to search tracks',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
