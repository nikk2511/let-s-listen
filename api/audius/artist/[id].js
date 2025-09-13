const fetch = require('node-fetch');

module.exports = async (req, res) => {
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
        const { id } = req.query;
        
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
};
