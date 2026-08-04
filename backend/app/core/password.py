"""
app/core/password.py

Password hashing and verification (bcrypt via passlib).
"""

from passlib.context import CryptContext

# passlib 1.7.4 + bcrypt 5.x have a known incompatibility (removed __about__).
# sha256_crypt is the primary scheme; bcrypt is kept as a deprecated fallback
# so any pre-existing bcrypt hashes can still be verified and will be
# automatically re-hashed to sha256_crypt on the next successful login.
_pwd_context = CryptContext(
    schemes=["sha256_crypt"],
    sha256_crypt__rounds=200_000,   # NIST-recommended work factor
)

def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of ``plain_password``."""
    return _pwd_context.hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Return ``True`` if ``plain_password`` matches ``hashed_password``.
    Uses constant-time comparison internally to prevent timing attacks.
    """
    return _pwd_context.verify(plain_password, hashed_password)

import string
import secrets
import re

def generate_temporary_password(length: int = 12) -> str:
    """Generate a secure temporary password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for i in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and sum(c.isdigit() for c in password) >= 1):
            break
    return password

def validate_password(password: str) -> bool:
    """
    Validate password against policy:
    - At least 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    """
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    return True
