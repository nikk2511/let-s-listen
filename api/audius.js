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
        const { query, limit = 10, artistId } = req.query;
        
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
            return res.status(400).json({ error: 'Missing query parameter or artist ID' });
        }
        
        console.log(logMessage);
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
        
        if (artistId) {
            console.log(`✅ Artist details fetched successfully`);
        } else {
            console.log(`✅ Found ${data.data ? data.data.length : 0} tracks`);
        }
        
        res.json(data);
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch data from Audius API',
            details: error.message 
        });
    }
}
