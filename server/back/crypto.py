import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

_cbc_key = os.urandom(16)
_ctr_key  = os.urandom(16)


def pkcs7_pad(data, block=16):
    n = block - (len(data) % block)
    return data + bytes([n] * n)


def pkcs7_unpad(data, block=16):
    if not data:
        raise ValueError("donnees vides")
    n = data[-1]
    if n == 0 or n > block or data[-n:] != bytes([n] * n):
        raise ValueError("padding invalide")
    return data[:-n]


def cbc_encrypt(plaintext):
    iv = os.urandom(16)
    c = Cipher(algorithms.AES(_cbc_key), modes.CBC(iv), backend=default_backend())
    enc = c.encryptor()
    return iv + enc.update(pkcs7_pad(plaintext)) + enc.finalize()


def cbc_decrypt(data):
    iv, ct = data[:16], data[16:]
    c = Cipher(algorithms.AES(_cbc_key), modes.CBC(iv), backend=default_backend())
    dec = c.decryptor()
    return pkcs7_unpad(dec.update(ct) + dec.finalize())


def cbc_check_padding(data):
    try:
        if len(data) < 32 or len(data) % 16 != 0:
            return False
        iv, ct = data[:16], data[16:]
        c = Cipher(algorithms.AES(_cbc_key), modes.CBC(iv), backend=default_backend())
        dec = c.decryptor()
        pkcs7_unpad(dec.update(ct) + dec.finalize())
        return True
    except Exception:
        return False


def ctr_encrypt(plaintext):
    nonce = os.urandom(16)
    c = Cipher(algorithms.AES(_ctr_key), modes.CTR(nonce), backend=default_backend())
    enc = c.encryptor()
    return nonce + enc.update(plaintext) + enc.finalize()


def ctr_decrypt(data):
    nonce, ct = data[:16], data[16:]
    c = Cipher(algorithms.AES(_ctr_key), modes.CTR(nonce), backend=default_backend())
    dec = c.decryptor()
    return dec.update(ct) + dec.finalize()
