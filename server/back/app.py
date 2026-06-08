from flask import Flask, request, jsonify
import crypto

app = Flask(__name__)


@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/encrypt", methods=["POST"])
def encrypt():
    body = request.get_json(force=True)
    msg = (body.get("message") or "").encode()
    return jsonify({"ciphertext": crypto.cbc_encrypt(msg).hex()})


@app.route("/paddingOracle", methods=["POST"])
def padding_oracle():
    body = request.get_json(force=True)
    try:
        data = bytes.fromhex(body.get("ciphertext") or "")
    except (ValueError, TypeError):
        return ("", 400)
    return ("", 200) if crypto.cbc_check_padding(data) else ("", 403)


@app.route("/decryptCbc", methods=["POST"])
def decrypt_cbc():
    body = request.get_json(force=True)
    try:
        data = bytes.fromhex(body.get("ciphertext") or "")
        pt = crypto.cbc_decrypt(data)
        return jsonify({"plaintext": pt.decode("utf-8", errors="replace")})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
