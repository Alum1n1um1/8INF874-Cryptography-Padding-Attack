from flask import Flask, request, jsonify, send_from_directory
import crypto

app = Flask(__name__)


@app.after_request
def addCorsHeaders(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/encrypt", methods=["POST"])
def encrypt():
    body = request.get_json(force=True)
    message = (body.get("message") or "").encode("utf-8")
    return jsonify({"ciphertext": crypto.cbcEncrypt(message).hex()})


@app.route("/paddingOracle", methods=["POST"])
def paddingOracle():
    body = request.get_json(force=True)
    try:
        data = bytes.fromhex(body.get("ciphertext") or "")
    except (ValueError, TypeError):
        return ("", 400)
    return ("", 200) if crypto.cbcCheckPadding(data) else ("", 403)


@app.route("/decryptCbc", methods=["POST"])
def decryptCbc():
    body = request.get_json(force=True)
    try:
        data = bytes.fromhex(body.get("ciphertext") or "")
        pt = crypto.cbcDecrypt(data)
        return jsonify({"plaintext": pt.decode("utf-8", errors="replace")})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/encryptCtr", methods=["POST"])
def encryptCtr():
    body = request.get_json(force=True)
    message = (body.get("message") or "").encode("utf-8")
    return jsonify({"ciphertext": crypto.ctrEncrypt(message).hex()})


@app.route("/decryptCtr", methods=["POST"])
def decryptCtr():
    body = request.get_json(force=True)
    try:
        data = bytes.fromhex(body.get("ciphertext") or "")
        pt = crypto.ctrDecrypt(data)
        return jsonify({"plaintext": pt.decode("utf-8", errors="replace")})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
