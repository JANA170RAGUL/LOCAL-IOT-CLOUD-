# Security & Tradeoffs

## Authentication & JWT

Currently, the Local IoT Cloud Platform stores JWT bearer tokens in the browser's `localStorage`.

### The LocalStorage Tradeoff
**Why it's done this way:**
- **Simplicity**: Easy to implement out-of-the-box and integrates smoothly with SPAs (React) and Axios interceptors.
- **Statelessness**: The backend does not need to handle CSRF tokens or complex cookie configurations, making it easier to expose the API to 3rd party scripts or mobile apps.

**The Risk (XSS):**
- Any Cross-Site Scripting (XSS) vulnerability in the dashboard (e.g., an unescaped Markdown widget, or a malicious third-party NPM package) would allow an attacker to read the JWT from `localStorage` and fully impersonate the user. For an IoT platform capable of sending physical hardware commands, this is a high-value target.

### Future Mitigation: HttpOnly Cookies + CSRF
For production enterprise deployments, the roadmap includes migrating to an `HttpOnly` cookie-based authentication flow.

1. **HttpOnly Cookies**: The backend sets the JWT as an `HttpOnly` cookie. This completely prevents JavaScript (and thus XSS attacks) from reading the token.
2. **CSRF Tokens**: To prevent Cross-Site Request Forgery (CSRF) — a vulnerability introduced by using cookies where a malicious site tricks the user's browser into making authenticated requests — the backend will also issue a CSRF token. The frontend will read this token (usually from a non-HttpOnly cookie or a meta tag) and attach it as an HTTP header (e.g., `X-CSRF-Token`) on all mutating requests (POST, PUT, DELETE).

### Short-Term Mitigations
While relying on `localStorage`:
- Ensure strictly typed and sanitized rendering in React (React automatically escapes text to prevent XSS by default).
- Actively scan NPM dependencies (`npm audit`) for compromised packages.
- Avoid the use of `dangerouslySetInnerHTML` unless passed through a robust sanitizer like `DOMPurify`.
