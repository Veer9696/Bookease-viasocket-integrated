# BookEase demo: prompts for Antigravity (Gemini)

Paste these one at a time. Check the result before sending the next one.
Never paste the contents of `.env` into the chat.

---

## Start of every new chat

> First read `.claude/skills/viasocket-integrations/SKILL.md` and `.claude/skills/viasocket-prebuilt-ui/SKILL.md`, and follow them exactly for anything related to viaSocket. The `.env` file already exists with `VIASOCKET_ORG_ID`, `VIASOCKET_PROJECT_ID` and `VIASOCKET_EMBED_SECRET`. Do not change it, print it or copy the secret anywhere else.

---

## Prompt 1: the website

> Build a simple, modern, professional website called **"BookEase"**, an appointment booking app for clinics. Use only plain HTML, CSS and JavaScript (no React or other frameworks), and put all pages in a `public` folder. Create these pages with a shared top navigation bar:
> 1. `index.html`: home page with a hero section ("Smart appointment booking for modern clinics"), 3 feature cards and a "Book Now" button.
> 2. `book.html`: a booking form with Name, Phone, Email, Doctor (dropdown with 3 doctors), Date, Time and Notes. On submit, show a success message for now.
> 3. `integrations.html`: a page titled "Automate your clinic" with a short explanation and an empty `<div id="integrations" style="height:700px"></div>` where an automation widget will go later.
>
> Use a clean blue and white colour theme, and make it work on mobile.

Check: open the pages and make sure they look good.

---

## Prompt 2: the secure backend

> Add a Node.js + Express server (`server.js`) that serves the pages from the `public` folder on port 3000. Add `GET /api/viasocket/token`, which returns (as plain text) an HS256 JWT signed with the `jsonwebtoken` package using exactly the three claims from the skill file: `org_id`, `project_id` and `unique_identifier` (use `"bookease-demo-clinic"`), with no `exp`. Read the values from `.env` using `dotenv`. Create `package.json` with a `start` script, and tell me which commands to run.

Check: run `npm install`, then `npm start`, then open http://localhost:3000

---

## Prompt 3: viaSocket embed on the Integrations page

> On `integrations.html`, mount the viaSocket prebuilt UI exactly as the prebuilt-ui skill shows (`viaSocket.mount` from `https://embed.viasocket.com/prod-embedcomponent.js`) inside `#integrations`. Fetch the token from `/api/viasocket/token`. Use config `{ pageheading: "Automation", pagesubheading: "Connect BookEase to the apps your clinic already uses", showTemplates: true, themeJson: { "--primary-color": "<our blue>" } }`. Add the `embed.on("flow")` listener: on `published` or `updated`, send `flow.id`, `flow.title`, `flow.webhookurl` and `flow.payload` to a new `POST /api/flows` endpoint that saves them in `flows.json` on the server. On `paused`, mark the entry paused. On `deleted`, remove it.

Check: the viaSocket screen appears inside the page. If it doesn't, right-click → Inspect → Console, copy the red error and paste it to Gemini.

---

## Prompt 4: booking form → viaSocket

> When the booking form on `book.html` is submitted, send it with fetch to `POST /api/booking`. On the server, send the booking as JSON (name, phone, email, doctor, date, time, notes) to every active flow URL saved in `flows.json`. Show "Booking confirmed!" on success and a friendly error if it fails.

Check:
1. On the Integrations page, build a flow (for example Webhook → Google Sheets "Add row" + Gmail "Send email") and publish it.
2. Book an appointment.
3. The row and the email should appear.

---

## Demo script (5 minutes)

1. The problem: clinics waste hours copying bookings into sheets and sending reminders.
2. Show BookEase, a normal booking app.
3. Open Integrations: the clinic owner connects their own apps here, branded as BookEase.
4. Build or publish a flow live: new booking → Google Sheet + email.
5. Book an appointment. The row and the email arrive.
6. The pitch: your product gets 2,300+ integrations without your developers building any.
