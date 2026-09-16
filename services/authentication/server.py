import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from http import HTTPStatus
from http.cookies import SimpleCookie
from urllib.parse import urlencode, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "0.0.0.0"
PORT = int(os.getenv("PORT", "8080"))
AUTH_SECRET = os.getenv("AUTH_SECRET", "")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
AUTH_SITE_URL = os.getenv("SITE_URL", "https://englishai-ecosystem-live.onrender.com").rstrip("/")
PUBLIC_SITE_URL = os.getenv("PUBLIC_SITE_URL", "https://burhanabdullah.github.io/EnglishAI-Ecosystem").rstrip("/")
COOKIE_NAME = "modern_english_session"
STATE_TTL = 600
ALLOWED_ORIGINS = {AUTH_SITE_URL, PUBLIC_SITE_URL}
ALLOWED_NEXT = {"learner.html", "profile.html", "dashboard.html"}


def b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def ub64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def sign(payload: dict) -> str:
    raw = b64(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    sig = hmac.new(AUTH_SECRET.encode(), raw.encode(), hashlib.sha256).digest()
    return raw + "." + b64(sig)


def verify(token: str):
    try:
        raw, sig = token.split(".", 1)
        expected = b64(hmac.new(AUTH_SECRET.encode(), raw.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(ub64(raw))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def github_request(url: str, method: str = "GET", data: bytes | None = None, headers=None):
    request = Request(url, data=data, method=method, headers=headers or {})
    with urlopen(request, timeout=15) as response:
        return response.read()


def configured():
    return bool(AUTH_SECRET and GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)


class Handler(BaseHTTPRequestHandler):
    server_version = "ModernEnglishAuth/1.2"

    def log_message(self, fmt, *args):
        print("[auth] " + (fmt % args))

    def cors_origin(self):
        origin = self.headers.get("Origin", "")
        return origin if origin in ALLOWED_ORIGINS else AUTH_SITE_URL

    def json(self, status: int, body: dict, extra_headers=None):
        encoded = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", self.cors_origin())
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Vary", "Origin")
        if extra_headers:
            for key, value in extra_headers:
                self.send_header(key, value)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def redirect(self, location: str, cookies=None):
        self.send_response(HTTPStatus.FOUND)
        self.send_header("Location", location)
        if cookies:
            for value in cookies:
                self.send_header("Set-Cookie", value)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", self.cors_origin())
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Methods", "GET,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/healthz":
            self.json(200, {"ok": True, "configured": configured(), "public_site": PUBLIC_SITE_URL})
            return
        if path == "/auth/github":
            self.start_github_login()
            return
        if path == "/auth/callback":
            self.github_callback()
            return
        if path == "/api/me":
            self.current_user()
            return
        if path == "/api/logout":
            self.logout()
            return
        self.json(404, {"error": "not_found"})

    def cookies(self):
        cookie = SimpleCookie()
        cookie.load(self.headers.get("Cookie", ""))
        return cookie

    def requested_next(self):
        query = parse_qs(self.path.split("?", 1)[1] if "?" in self.path else "")
        value = query.get("next", [""])[0]
        return value if value in ALLOWED_NEXT else "learner.html"

    def start_github_login(self):
        if not configured():
            self.redirect(PUBLIC_SITE_URL + "/signup.html?auth=not-configured")
            return
        next_page = self.requested_next()
        state = sign({"nonce": secrets.token_urlsafe(24), "next": next_page, "exp": int(time.time()) + STATE_TTL})
        params = urlencode({
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": self.callback_url(),
            "scope": "read:user user:email",
            "state": state,
        })
        self.redirect("https://github.com/login/oauth/authorize?" + params, [self.state_cookie(state)])

    def callback_url(self):
        explicit = os.getenv("GITHUB_CALLBACK_URL", "").strip()
        if explicit:
            return explicit
        return self.base_url() + "/auth/callback"

    def base_url(self):
        forwarded_proto = self.headers.get("X-Forwarded-Proto", "https").split(",")[0].strip()
        host = self.headers.get("Host", "")
        return f"{forwarded_proto}://{host}"

    def state_cookie(self, state):
        return f"modern_english_oauth_state={state}; Path=/; Max-Age={STATE_TTL}; HttpOnly; Secure; SameSite=Lax"

    def github_callback(self):
        query = parse_qs(self.path.split("?", 1)[1] if "?" in self.path else "")
        code = query.get("code", [""])[0]
        state = query.get("state", [""])[0]
        state_cookie = self.cookies().get("modern_english_oauth_state")
        expected_state = state_cookie.value if state_cookie else ""
        if not code or not state or not expected_state or not hmac.compare_digest(state, expected_state) or not verify(state):
            self.redirect(PUBLIC_SITE_URL + "/signup.html?auth=invalid-state")
            return
        state_payload = verify(state)
        next_page = state_payload.get("next", "learner.html") if state_payload else "learner.html"
        if next_page not in ALLOWED_NEXT:
            next_page = "learner.html"
        try:
            token_body = urlencode({
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": self.callback_url(),
            }).encode()
            token_raw = github_request(
                "https://github.com/login/oauth/access_token",
                method="POST",
                data=token_body,
                headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
            )
            token = json.loads(token_raw).get("access_token")
            if not token:
                raise RuntimeError("GitHub did not return an access token")
            user = json.loads(github_request(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json", "User-Agent": "Modern-English"},
            ))
            email = user.get("email")
            if not email:
                emails = json.loads(github_request(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json", "User-Agent": "Modern-English"},
                ))
                primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
                email = primary.get("email") if primary else None
            session = {
                "sub": str(user.get("id")),
                "login": user.get("login"),
                "name": user.get("name") or user.get("login"),
                "avatar": user.get("avatar_url"),
                "email": email,
                "iat": int(time.time()),
                "exp": int(time.time()) + 60 * 60 * 24 * 30,
            }
            token_cookie = f"{COOKIE_NAME}={sign(session)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=None"
            clear_state = "modern_english_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
            self.redirect(PUBLIC_SITE_URL + f"/{next_page}?login=success", [token_cookie, clear_state])
        except (HTTPError, OSError, ValueError, RuntimeError) as exc:
            print(f"[auth] GitHub callback failed: {exc}")
            self.redirect(PUBLIC_SITE_URL + "/signup.html?auth=failed")

    def current_user(self):
        cookie = self.cookies().get(COOKIE_NAME)
        user = verify(cookie.value) if cookie else None
        if not user:
            self.json(200, {"authenticated": False})
            return
        public = {k: user.get(k) for k in ("sub", "login", "name", "avatar", "email")}
        self.json(200, {"authenticated": True, "user": public})

    def logout(self):
        self.json(200, {"ok": True}, [
            ("Set-Cookie", f"{COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None")
        ])


if __name__ == "__main__":
    if not AUTH_SECRET:
        print("[auth] WARNING: AUTH_SECRET is not configured")
    print(f"[auth] listening on {HOST}:{PORT}; GitHub OAuth configured={configured()}; public site={PUBLIC_SITE_URL}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
