import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

# Clés générées aléatoirement au démarrage — conservées uniquement en mémoire
_cbcKey = os.urandom(16)
_ctrKey = os.urandom(16)


def pkcs7Pad(data: bytes, blockSize: int = 16) -> bytes:
    padLen = blockSize - (len(data) % blockSize)
    return data + bytes([padLen] * padLen)


def pkcs7Unpad(data: bytes, blockSize: int = 16) -> bytes:
    if not data:
        raise ValueError("données vides")
    padLen = data[-1]
    if padLen == 0 or padLen > blockSize:
        raise ValueError("longueur de rembourrage invalide")
    if data[-padLen:] != bytes([padLen] * padLen):
        raise ValueError("octets de rembourrage incorrects")
    return data[:-padLen]


def cbcEncrypt(plaintext: bytes) -> bytes:
    iv = os.urandom(16)
    padded = pkcs7Pad(plaintext)
    cipher = Cipher(algorithms.AES(_cbcKey), modes.CBC(iv), backend=default_backend())
    enc = cipher.encryptor()
    return iv + enc.update(padded) + enc.finalize()


def cbcDecrypt(data: bytes) -> bytes:
    iv, ct = data[:16], data[16:]
    cipher = Cipher(algorithms.AES(_cbcKey), modes.CBC(iv), backend=default_backend())
    dec = cipher.decryptor()
    return pkcs7Unpad(dec.update(ct) + dec.finalize())


def cbcCheckPadding(data: bytes) -> bool:
    # Oracle de rembourrage : retourne True uniquement si le dernier bloc déchiffré a un rembourrage PKCS#7 valide
    try:
        if len(data) < 32 or len(data) % 16 != 0:
            return False
        iv, ct = data[:16], data[16:]
        cipher = Cipher(algorithms.AES(_cbcKey), modes.CBC(iv), backend=default_backend())
        dec = cipher.decryptor()
        pkcs7Unpad(dec.update(ct) + dec.finalize())
        return True
    except Exception:
        return False


def ctrEncrypt(plaintext: bytes) -> bytes:
    nonce = os.urandom(16)
    cipher = Cipher(algorithms.AES(_ctrKey), modes.CTR(nonce), backend=default_backend())
    enc = cipher.encryptor()
    return nonce + enc.update(plaintext) + enc.finalize()


def ctrDecrypt(data: bytes) -> bytes:
    nonce, ct = data[:16], data[16:]
    cipher = Cipher(algorithms.AES(_ctrKey), modes.CTR(nonce), backend=default_backend())
    dec = cipher.decryptor()
    return dec.update(ct) + dec.finalize()
