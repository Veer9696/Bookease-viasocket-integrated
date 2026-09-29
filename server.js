require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to generate viaSocket embed token
app.get('/api/viasocket/token', (req, res) => {
    try {
        const org_id = process.env.VIASOCKET_ORG_ID;
        const project_id = process.env.VIASOCKET_PROJECT_ID;
        const secret = process.env.VIASOCKET_EMBED_SECRET;

        if (!org_id || !project_id || !secret) {
            console.error("Missing viaSocket environment variables.");
            return res.status(500).send("Missing viaSocket configuration");
        }

        const payload = {
            org_id: org_id,
            project_id: project_id,
            unique_identifier: "bookease-demo-clinic"
        };

        // Sign token using HS256 with no 'exp', per viaSocket rules
        const token = jwt.sign(payload, secret);
        
        res.type('text/plain').send(token);
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Endpoint to handle flow lifecycle events from the embed UI
const flowsFilePath = path.join(__dirname, 'flows.json');

app.post('/api/flows', (req, res) => {
    const { action, id, title, webhookurl, payload } = req.body;
    
    if (!id) return res.status(400).send("Missing flow id");

    let flows = {};
    if (fs.existsSync(flowsFilePath)) {
        try {
            flows = JSON.parse(fs.readFileSync(flowsFilePath, 'utf8'));
        } catch (e) {
            console.error("Error reading flows file:", e);
        }
    }

    if (action === 'published' || action === 'updated') {
        flows[id] = { id, title, webhookurl, payload, status: 'active' };
    } else if (action === 'paused') {
        if (flows[id]) flows[id].status = 'paused';
    } else if (action === 'deleted') {
        delete flows[id];
    } else {
        return res.status(200).send("Ignored action");
    }

    fs.writeFileSync(flowsFilePath, JSON.stringify(flows, null, 2));
    res.status(200).send("Flow updated");
});

// Endpoint to handle booking form submissions and trigger viaSocket flows
app.post('/api/booking', async (req, res) => {
    const bookingData = req.body;
    
    let flows = {};
    if (fs.existsSync(flowsFilePath)) {
        try {
            flows = JSON.parse(fs.readFileSync(flowsFilePath, 'utf8'));
        } catch (e) {
            console.error("Error reading flows file:", e);
        }
    }

    const flowPromises = [];
    for (const flowId in flows) {
        const flow = flows[flowId];
        if (flow.status === 'active' && flow.webhookurl) {
            flowPromises.push(
                fetch(flow.webhookurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                }).catch(err => console.error(`Error triggering flow ${flowId}:`, err))
            );
        }
    }

    await Promise.allSettled(flowPromises);
    res.status(200).json({ success: true, message: "Booking confirmed" });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
