# Receive website questions and feedback

The landing page's **How can I help?** form sends name, email, optional phone and message to **vigneshpoloji@gmail.com**. The backend uses Brevo's HTTPS API. Clicking Reply in Gmail replies to the visitor. The website shows success only when Brevo accepts the email; inbox delivery still depends on the provider and spam filtering. Ask EdgeMart AI conversations are separate and are not forwarded.

## 1. Create the email service account

1. Open [Brevo](https://www.brevo.com/) and create your account using `vigneshpoloji@gmail.com`.
2. Choose the Free plan and verify your email. Complete any account/transactional-sending review required by Brevo.
3. Open **Settings → Senders, Domains & Dedicated IPs → Senders** (the wording may vary).
4. Add sender name **EdgeMart website**, sender email **vigneshpoloji@gmail.com**. Enter the verification code received in Gmail.
5. Gmail is a free email domain. Brevo may replace the sender domain with its own authenticated sending domain. For a branded sender later, verify a domain you own; the destination remains your Gmail inbox.

Brevo currently includes 300 sends/day on its Free plan. See [plan limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan), [sender verification](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email) and [free-domain handling](https://help.brevo.com/hc/en-us/articles/16045394674066-Troubleshooting-Domain-authentication).

## 2. Create and save the API key

1. Open **Settings → SMTP & API → API keys**.
2. Click **Generate a new API key**, name it **EdgeMart contact**, and copy it privately. Choose an **API key**, not an SMTP key. [Official instructions](https://developers.brevo.com/docs/api-key-authentication).
3. In PowerShell:

```powershell
cd "C:\Users\DELL\OneDrive\Desktop\EdgeMartAI\backend"
.\configure-contact.ps1
.\start-backend.ps1 -Restart
```

Paste the key only into the hidden prompt. The script first validates it using Brevo's read-only account API, without sending an email. Continue only after **Brevo API key validated successfully** appears. Rejected keys are not saved. The ignored `contact-local.properties` file is local-only. Never place it in frontend code or send it in chat.

If Brevo returns **401**, first run `check-contact.ps1`. It distinguishes an **IP security block** from a rejected API key without sending email. If it reports an IP block, keep your existing key, open **Brevo profile menu → Security → Authorized IPs** or its notification email, and authorize the IP for your own backend request. Run the check again. Brevo can block an unauthorized IP even when the key is valid. [Official IP security instructions](https://developers.brevo.com/docs/ip-security).

For a rejected key, check that you generated it under **API keys**, not **SMTP**. SMTP credentials do not authenticate the HTTPS email API. Generate an active API key, rerun `configure-contact.ps1`, then restart once to load it. An API-accepted message is not proof of Gmail delivery; check the inbox and Brevo delivery logs.

```powershell
cd "C:\Users\DELL\OneDrive\Desktop\EdgeMartAI\backend"
.\check-contact.ps1
```

Continue only after API validation succeeds and the sender is active. If only IP authorization changed, no backend restart is required. Development internet connections may change their public IP; review Brevo notifications again if that happens.

## 3. Verify receipt

1. Open `http://localhost:5173/landing.html#contact`.
2. Enter your name, a valid email and a message such as **Contact form delivery test**.
3. Click **Get in touch!** once. The form shows a delivery-accepted message and clears only after success.
4. Check `vigneshpoloji@gmail.com`, including Spam. Confirm the message and Reply destination.
5. If no email arrives, check **Brevo → Transactional → Logs** for accepted/delivered/bounced status. Check sender verification, account approval, credits and any API IP security confirmation. A provider rejection leaves the visitor's message in the form.

The form requires a CSRF token, validates fields, and restricts all messages to your inbox. It allows three accepted emails per IP per ten minutes, with a separate limit of twenty attempts per ten minutes and thirty accepted emails per hour for the website. Missing configuration consumes no quota; failed sends release their delivery reservation. It does not automatically retry an ambiguous email send, which avoids duplicate messages. On free Render hosting it uses HTTPS because SMTP ports are blocked.

## 4. Production values

In the hosting dashboard set `BREVO_API_KEY` and `CONTACT_SENDER_EMAIL=vigneshpoloji@gmail.com`. Authorize the hosting service's outbound IP ranges in Brevo's Authorized IPs as well as in Atlas. Do not upload the local properties file. Follow [deployment steps](../DEPLOYMENT.md) after local receipt is confirmed.
