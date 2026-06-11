var API = 'http://localhost:5001';
var ciphertext = '';

function hexToBytes(hex) {
    var b = new Uint8Array(hex.length >> 1);
    for (var i = 0; i < hex.length; i += 2)
        b[i >> 1] = parseInt(hex.slice(i, i + 2), 16);
    return b;
}

function bytesToHex(bytes) {
    return Array.from(bytes, function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function chiffrer() {
    var msg = document.getElementById('msgInput').value;
    if (!msg) return;

    var r = await fetch(API + '/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
    });
    var data = await r.json();
    ciphertext = data.ciphertext;

    document.getElementById('hexOut').textContent = ciphertext;

    var bytes = hexToBytes(ciphertext);
    var tbody = document.getElementById('blocksOut');
    tbody.innerHTML = '';
    for (var i = 0; i < bytes.length / 16; i++) {
        var tr = document.createElement('tr');
        var nom = i === 0 ? 'IV' : 'C[' + i + ']';
        var cls = i === 0 ? 'iv' : 'ct';
        var desc = i === 0 ? 'Vecteur d\'initialisation (aleatoire)' : 'Bloc chiffre ' + i;
        tr.innerHTML = '<td>' + nom + '</td><td class="' + cls + '">' + bytesToHex(bytes.slice(i * 16, i * 16 + 16)) + '</td><td class="dim">' + desc + '</td>';
        tbody.appendChild(tr);
    }

    document.getElementById('resultat').style.display = 'block';
}

function copierCiphertext() {
    if (!ciphertext) return;
    navigator.clipboard.writeText(ciphertext).then(function() {
        var fb = document.getElementById('copyFeedback');
        fb.textContent = 'Copie !';
        setTimeout(function() { fb.textContent = ''; }, 2000);
    });
}
