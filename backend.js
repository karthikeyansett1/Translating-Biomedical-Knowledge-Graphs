const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

// --- CONFIGURATION ---
const ARS_CI_URL = "https://ars.ci.transltr.io";
// The PK for FAM177A1 -> NFKB1
const PRE_RUN_PK = "afb7349f-3422-4f22-bbd8-ad02667ca00d";

app.get('/api/query', async (req, res) => {
    console.log(`Received request. Fetching pre-run PK: ${PRE_RUN_PK}...`);

    try {
        // 1. Get Parent Message to find the Merged ID
        const parentRes = await axios.get(`${ARS_CI_URL}/ars/api/messages/${PRE_RUN_PK}`);
        const mergedId = parentRes.data.merged_version || parentRes.data.fields?.merged_version;

        if (!mergedId) throw new Error("No merged_version found.");
        console.log(`Found merged ID: ${mergedId}`);

        // 2. Get the Actual Data
        const mergedRes = await axios.get(`${ARS_CI_URL}/ars/api/messages/${mergedId}`);
        
        // 3. Extract the message object safely
        let message = mergedRes.data.fields?.data?.message || mergedRes.data.message;
        
        if (!message) throw new Error("Invalid message structure from ARS.");

        console.log(`Success. Sending ${Object.keys(message.knowledge_graph.nodes).length} nodes.`);
        res.json({ message });

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});