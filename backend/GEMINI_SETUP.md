# Connect Gemini to Ask EdgeMart

The chatbot calls this project's Spring Boot backend. The backend calls Google's Gemini API; the browser never receives your key. Without a configured key, the local store guide still handles products, ordering, offers and delivery.

1. Sign in to [Google AI Studio](https://aistudio.google.com/apikey), create/select your project and create an API key. Review that project's API access and usage limits. Google's [API setup guide](https://ai.google.dev/gemini-api/docs/get-started) describes key creation.
2. Open PowerShell in `backend` and run `./configure-gemini.ps1`. Choose a model available to your project, then enter the key in the hidden prompt. The default model is `gemini-3.1-flash-lite`, verified with this project's key for a live response. Select another supported model when needed; availability and project access can differ.
3. Run `./start-backend.ps1 -Restart`. Keep the terminal open. This clears sign-in sessions; sign in again.
4. Open `http://localhost:8081/api/assistant/config`. It should report `configured: true`. This confirms that a key is loaded, not that Google has accepted it.
5. Open a buyer or seller dashboard, select **Ask EdgeMart**, and send **Suggest a simple daily reading routine**. A successful general-question response comes from Gemini. Offers, payment, order navigation and medical questions keep using the store guide so the application's rules stay consistent.
6. If it falls back to the store guide, check the key, project API access, selected model, quota and backend internet connection. The UI shows a fallback notice. Provider errors and credentials are never returned to the browser.

The backend makes at most two attempts for temporary network errors, rate limits and server failures. Each attempt has an eight-second timeout. The chat request allows up to thirty seconds so it can wait for the retry. Authentication and model-configuration errors are not retried. A busy-service notice identifies provider overload without exposing its response body. See Google's [retry guidance](https://ai.google.dev/gemini-api/docs/troubleshooting).

Local credentials are saved in ignored `backend/gemini-local.properties`. Do not put this key in frontend `.env` files, source code, screenshots or chat. Gemini requests use the documented `generateContent` REST endpoint and the `x-goog-api-key` header. [Gemini API reference](https://ai.google.dev/api/generate-content).

For deployment, set these secrets/settings in the backend host's environment and restart the service:

```text
GEMINI_API_KEY=<your private API key>
GEMINI_MODEL=<model available to your project>
```

Build/redeploy the frontend with its deployed API URL. Verify `https://api.your-domain.example/api/assistant/config`, then repeat the general-question test. The backend enforces login, CSRF, message limits, timeouts and request rate limits. It sends chat messages and a limited public product catalogue to Google. It does not add account identities, private order records, delivery addresses or GPS coordinates to prompts. Users should avoid putting sensitive information into chat messages themselves. This setup does not deploy the site or register billing on your behalf.
