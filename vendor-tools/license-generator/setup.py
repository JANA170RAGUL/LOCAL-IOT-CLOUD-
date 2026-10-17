import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

def setup_environment():
    base_dir = os.path.dirname(__file__)
    dirs_to_create = ["ui", "services", "keys", "output"]
    
    for d in dirs_to_create:
        os.makedirs(os.path.join(base_dir, d), exist_ok=True)
        print(f"Created directory: {d}")

    priv_path = os.path.join(base_dir, "keys", "private.pem")
    pub_path = os.path.join(base_dir, "keys", "public.pem")

    if not os.path.exists(priv_path) or not os.path.exists(pub_path):
        print("Generating new 3072-bit RSA keys...")
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=3072,
            backend=default_backend()
        )
        
        with open(priv_path, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
            
        public_key = private_key.public_key()
        with open(pub_path, "wb") as f:
            f.write(public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ))
        print("3072-bit RSA keys generated and saved.")
        
        # Copy public key ONLY to the backend
        backend_keys_dir = os.path.abspath(os.path.join(base_dir, "../../backend/app/modules/licensing/crypto/keys"))
        os.makedirs(backend_keys_dir, exist_ok=True)
        backend_pub_path = os.path.join(backend_keys_dir, "public.pem")
        backend_priv_path = os.path.join(backend_keys_dir, "private.pem")
        
        with open(backend_pub_path, "wb") as f:
            with open(pub_path, "rb") as pf:
                f.write(pf.read())
        
        if os.path.exists(backend_priv_path):
            os.remove(backend_priv_path)
            print("Removed private key from backend directory.")
            
        print("Copied public key to backend for license verification.")
    else:
        print("Keys already exist.")

if __name__ == "__main__":
    setup_environment()
