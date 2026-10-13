# Machinery Information System — AI Assistant upgrade

## What was added
- Floating AI Assistant chat button and responsive chat panel.
- Sends questions to your own backend endpoint.
- Shares a limited MIS context summary (page, machine summary, counts, open tickets and low-stock items) to help answer app-specific questions.
- Does not send GitHub tokens, passwords, user lists, or audit logs.
- Includes an example Node.js backend using the OpenAI Responses API. The API key stays on the server.

## 1. Publish the frontend
Replace your repository files with `index.html`, `app.js`, `style.css`, `config.js`, and `ai-assistant.js`.
Your HTML loads the original app and then the new assistant script.

## 2. Deploy the backend
On a server/hosting service that supports Node.js:
1. Install Node.js 18 or newer.
2. In this folder run `npm install`.
3. Set environment variable `OPENAI_API_KEY` to your provider key (never add it to frontend files or GitHub Pages).
4. Set `ALLOWED_ORIGIN` to your exact published website origin, e.g. `https://YOUR-USERNAME.github.io`. Configure CORS appropriately for your deployment.
5. Optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`).
6. Run `npm start`, and expose the service via HTTPS.

The example uses the OpenAI API. Provider usage may incur charges; set spending limits/rate limits on your provider account. Add authentication/rate limiting before production use.

## 3. Connect the frontend
Edit `config.js` and replace the example `aiEndpoint` with your deployed backend URL, for example:
`aiEndpoint: 'https://your-backend.example.com/api/chat'`

Do not use the API key as the endpoint and do not put any API key in `config.js`, `app.js`, or `ai-assistant.js`.

## 4. Test
Open the website, click **AI Assistant**, and ask a question. If the backend is not deployed/configured yet, the widget explains what remains to be done.

## Important
This is a client-side chat widget connected to a sample backend. The assistant is not live until you deploy the backend and configure `aiEndpoint`. Treat AI answers as guidance, not as a replacement for approved maintenance procedures or qualified technicians. The MIS currently uses GitHub Pages, so a backend/serverless function is required to keep AI credentials private.
