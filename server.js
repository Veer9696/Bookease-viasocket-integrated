require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simulated Database
const db = {
    doctors: [
        { id: "DOC-001", name: 'Dr. Sarah Smith', specialty: 'Cardiology', experience: '15 years', qualifications: 'MD, FACC', clinic: 'HeartCare Center', rating: 4.9, fee: 100, image: 'https://i.pravatar.cc/150?img=1' },
        { id: "DOC-002", name: 'Dr. James Wilson', specialty: 'Neurology', experience: '12 years', qualifications: 'MD, PhD', clinic: 'Neuro Health', rating: 4.8, fee: 120, image: 'https://i.pravatar.cc/150?img=11' },
        { id: "DOC-003", name: 'Dr. Emily Chen', specialty: 'Dermatology', experience: '8 years', qualifications: 'MD, FAAD', clinic: 'Skin Wellness Clinic', rating: 4.7, fee: 80, image: 'https://i.pravatar.cc/150?img=5' },
        { id: "DOC-004", name: 'Dr. Michael Brown', specialty: 'Orthopedics', experience: '20 years', qualifications: 'MD, FAAOS', clinic: 'Ortho Institute', rating: 4.9, fee: 150, image: 'https://i.pravatar.cc/150?img=8' },
        { id: "DOC-005", name: 'Dr. Aisha Khan', specialty: 'Gynecology', experience: '10 years', qualifications: 'MD, FACOG', clinic: 'Women Health Center', rating: 4.6, fee: 90, image: 'https://i.pravatar.cc/150?img=9' },
        { id: "DOC-006", name: 'Dr. Robert Davis', specialty: 'Pediatrics', experience: '14 years', qualifications: 'MD, FAAP', clinic: 'Kids Care', rating: 4.8, fee: 95, image: 'https://i.pravatar.cc/150?img=12' },
        { id: "DOC-007", name: 'Dr. Chloe Adams', specialty: 'Cardiology', experience: '10 years', qualifications: 'MD', clinic: 'City Hospital', rating: 4.5, fee: 110, image: 'https://i.pravatar.cc/150?img=22' },
        { id: "DOC-008", name: 'Dr. Liam Perez', specialty: 'Neurology', experience: '5 years', qualifications: 'MD', clinic: 'Brain Center', rating: 4.4, fee: 95, image: 'https://i.pravatar.cc/150?img=33' }
    ]
};

// viaSocket Authentication
app.get('/api/viasocket/token', (req, res) => {
    try {
        const org_id = process.env.VIASOCKET_ORG_ID || "4160";
        const project_id = process.env.VIASOCKET_PROJECT_ID || "projvB6ZLDza";
        const secret = process.env.VIASOCKET_EMBED_SECRET || "E3Q7LU3exGofAn";
        const payload = { org_id, project_id, unique_identifier: "bookease-demo-clinic" };
        const token = jwt.sign(payload, secret);
        res.type('text/plain').send(token);
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Manage Workflows
const flowsFilePath = path.join(__dirname, 'flows.json');
app.post('/api/flows', (req, res) => {
    const { action, id, title, webhookurl, payload, eventName } = req.body;
    if (!id) return res.status(400).send("Missing flow id");
    let flows = fs.existsSync(flowsFilePath) ? JSON.parse(fs.readFileSync(flowsFilePath, 'utf8')) : {};

    if (['published', 'updated'].includes(action)) {
        flows[id] = { id, title, webhookurl, payload, eventName, status: 'active' };
    } else if (action === 'paused' && flows[id]) {
        flows[id].status = 'paused';
    } else if (action === 'deleted') {
        delete flows[id];
    }
    fs.writeFileSync(flowsFilePath, JSON.stringify(flows, null, 2));
    res.status(200).send("Flow updated");
});

// Centralized viaSocket Event Sender
async function sendViaSocketEvent(eventName, payload) {
    let flows = {};
    if (fs.existsSync(flowsFilePath)) {
        try { flows = JSON.parse(fs.readFileSync(flowsFilePath, 'utf8')); } catch (e) { }
    }

    const flowPromises = [];
    for (const flowId in flows) {
        const flow = flows[flowId];
        // Only run flows that match the event type
        if (flow.status === 'active' && flow.webhookurl && flow.eventName === eventName) {

            // Function to fetch with retry for failure-resilient automation
            const fetchWithRetry = async (url, options, retries = 3) => {
                for (let i = 0; i < retries; i++) {
                    try {
                        const res = await fetch(url, options);
                        if (res.ok) return res;
                        console.error(`Webhook ${flowId} attempt ${i + 1} failed: ${res.status}`);
                    } catch (err) {
                        console.error(`Error triggering flow ${flowId} attempt ${i + 1}:`, err);
                    }
                    // Basic exponential backoff
                    await new Promise(r => setTimeout(r, Math.pow(2, i) * 100));
                }
                throw new Error(`Webhook ${flowId} failed after ${retries} attempts.`);
            };

            flowPromises.push(
                fetchWithRetry(flow.webhookurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.event_id },
                    body: JSON.stringify(payload)
                }).catch(err => console.error(`Failed to reliably send to ${flowId}:`, err))
            );
        }
    }
    await Promise.allSettled(flowPromises);
}

// -----------------------------------------------------
// BUSINESS LOGIC ENDPOINTS
// -----------------------------------------------------

// Get Doctors
app.get('/api/doctors', (req, res) => {
    res.json(db.doctors);
});

// API: Appointments
app.post('/api/appointments', async (req, res) => {
    const bookingData = req.body;
    if (!bookingData.patient || !bookingData.appointment || !bookingData.payment) {
        return res.status(400).json({ error: "Missing required details." });
    }

    const bookingId = "BK-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    const payload = {
        event: "appointment.created",
        event_id: `appointment.created:${bookingId}`,
        created_at: new Date().toISOString(),
        booking: {
            booking_id: bookingId,
            status: "confirmed",
            patient: bookingData.patient,
            doctor: {
                name: bookingData.appointment.doctor,
                specialty: bookingData.appointment.specialty
            },
            appointment: bookingData.appointment,
            insurance: bookingData.insurance,
            payment: bookingData.payment
        }
    };

    let automationTriggered = true;
    try {
        await sendViaSocketEvent("appointment.created", payload);
    } catch (e) {
        automationTriggered = false;
    }

    res.status(200).json({ bookingCreated: true, automationTriggered, bookingId });
});

// API: Symptoms
app.post('/api/symptoms', async (req, res) => {
    const { patient, symptom, appointmentId } = req.body;
    const symptomId = "SYM-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    const payload = {
        event: "symptom.progress.updated",
        event_id: `symptom.progress.updated:${symptomId}-${Date.now()}`,
        patient,
        symptom: {
            id: symptomId,
            ...symptom,
            updated_at: new Date().toISOString()
        },
        appointment: { id: appointmentId }
    };

    let automationTriggered = true;
    try { await sendViaSocketEvent("symptom.progress.updated", payload); }
    catch (e) { automationTriggered = false; }

    res.status(200).json({ success: true, automationTriggered, symptomId });
});

// API: Reports (Create)
app.post('/api/reports', async (req, res) => {
    const { patient, doctor, appointment, result } = req.body;
    const reportId = "REP-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    const payload = {
        event: "medical.report.created",
        event_id: `medical.report.created:${reportId}`,
        report: { id: reportId, status: "completed" },
        patient,
        doctor,
        appointment,
        result,
        created_at: new Date().toISOString()
    };

    let automationTriggered = true;
    try { await sendViaSocketEvent("medical.report.created", payload); }
    catch (e) { automationTriggered = false; }

    res.status(200).json({ success: true, automationTriggered, reportId, payload });
});

// API: Reports (Send)
app.post('/api/reports/:id/send', async (req, res) => {
    const { patient, doctor, appointment } = req.body;
    const reportId = req.params.id;

    const payload = {
        event: "medical.report.sent",
        event_id: `medical.report.sent:${reportId}-${Date.now()}`,
        report: { id: reportId, status: "sent" },
        patient,
        doctor,
        appointment,
        sent_at: new Date().toISOString()
    };

    let automationTriggered = true;
    try { await sendViaSocketEvent("medical.report.sent", payload); }
    catch (e) { automationTriggered = false; }

    res.status(200).json({ success: true, automationTriggered });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
