/**
 * test-smoke.mjs — test rapide du backend TROXT.
 *
 * Usage :
 *   1. Démarrer engine-lab/server/index.mjs (npm run server)
 *   2. Dans un autre terminal :
 *      node troxt-server/test-smoke.mjs
 *
 * Le test :
 *   1. GET  /api/troxt/health
 *   2. POST /api/troxt/data/test
 *   3. GET  /api/troxt/data/test
 *   4. POST /api/troxt/functions/echo
 *   5. POST /api/troxt/visual-forge/jobs (avec une image générée)
 *   6. Poll /api/troxt/visual-forge/jobs/:id jusqu'à DONE
 *   7. GET  /api/troxt/visual-forge/jobs/:id/manifest
 *   8. GET  /api/troxt/visual-forge/jobs/:id/download (taille > 0)
 *   9. POST /api/troxt/visual-forge/jobs/:id/approve
 *  10. Cleanup KV + delete files
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const BASE = process.env.TROXT_BASE ?? 'http://localhost:4101/api/troxt';

async function http(method, path, body, isBinary = false) {
  const url = `${BASE}${path}`;
  const opts = { method, headers: {} };
  if (body && !isBinary) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body && isBinary) {
    opts.body = body;
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, body: parsed };
}

async function makeTestImage() {
  // Crée une image de test 256×256 (rouge avec un cercle vert au centre).
  const W = 256, H = 256;
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const dx = x - W / 2;
      const dy = y - H / 2;
      const d = Math.sqrt(dx*dx + dy*dy);
      const inCircle = d < 60;
      buf[i + 0] = inCircle ? 60  : 200; // R
      buf[i + 1] = inCircle ? 220 : 80;  // G
      buf[i + 2] = inCircle ? 100 : 80;  // B
      buf[i + 3] = 255;                  // A
    }
  }
  return await sharp(buf, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();
}

async function uploadImage(pngBuffer, filename) {
  // POST /api/troxt/storage/upload (multipart).
  const form = new FormData();
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  form.append('file', blob, filename);
  const res = await fetch(`${BASE}/storage/upload`, { method: 'POST', body: form });
  const json = await res.json();
  if (!json.ok) throw new Error(`upload failed: ${json.error}`);
  return json.data;
}

function assert(cond, label) {
  if (!cond) {
    console.error(`  ✗ ${label}`);
    process.exit(1);
  }
  console.log(`  ✓ ${label}`);
}

async function main() {
  console.log(`▶ TROXT smoke test against ${BASE}\n`);

  // 1. Health
  console.log('[1] GET /health');
  const h = await http('GET', '/health');
  assert(h.status === 200 && h.body.ok === true, 'health endpoint répond');
  assert(typeof h.body.paths?.uploads === 'string', 'paths.uploads exposé');

  // 2. KV set
  console.log('\n[2] PUT /data/smoke-test-key');
  await http('PUT', '/data/smoke-test-key', { value: { hello: 'world', at: Date.now() } });
  assert(true, 'KV write OK');

  // 3. KV get
  console.log('\n[3] GET /data/smoke-test-key');
  const g = await http('GET', '/data/smoke-test-key');
  assert(g.body.data?.value?.hello === 'world', 'KV read round-trip');

  // 4. Functions/echo
  console.log('\n[4] POST /functions/echo');
  const e = await http('POST', '/functions/echo', { hello: 'echo' });
  assert(e.body.data?.hello === 'echo', 'echo round-trip');

  // 5. Functions/health
  console.log('\n[5] POST /functions/health');
  const hh = await http('POST', '/functions/health', {});
  assert(hh.body.data?.ok === true, 'health function OK');

  // 6. Upload + submit job
  console.log('\n[6] Upload image + POST /visual-forge/jobs');
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'troxt-smoke-'));
  const localImagePath = path.join(tmpDir, 'smoke-input.png');
  const png = await makeTestImage();
  await fsp.writeFile(localImagePath, png);
  const upload = await uploadImage(png, 'smoke-input.png');
  assert(upload.id, 'upload returned id');
  console.log(`     uploaded: ${upload.id} (${upload.size} bytes)`);

  // Pour le job, on copie dans server/data/uploads/ pour que sharp puisse l'ouvrir.
  const targetDir = path.resolve(process.cwd(), 'engine-lab/server/data/uploads');
  await fsp.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, `smoke-input-${Date.now()}.png`);
  await fsp.copyFile(localImagePath, targetPath);

  const contract = {
    quality: 'preview',
    subjectType: 'object',
    symmetry: false,
    detailLevel: 60,
    target: { polygonBudget: 5000, textureResolution: 512 },
    acceptance: { maximumFileSizeMb: 10, minimumConfidence: 0.3, maximumOpenEdges: 999, maximumMaterialCount: 4, mustLoadInThreeJs: true, mustExportGlb: true },
  };

  const submit = await http('POST', '/visual-forge/jobs', {
    contract,
    inputPaths: [targetPath],
    outputFilename: 'smoke-output.glb',
  });
  assert(submit.status === 202 && submit.body.data?.jobId, 'job submitted');
  const jobId = submit.body.data.jobId;
  console.log(`     jobId: ${jobId}`);

  // 7. Poll status
  console.log('\n[7] Poll /visual-forge/jobs/:id');
  let done = false;
  for (let i = 0; i < 30 && !done; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const s = await http('GET', `/visual-forge/jobs/${jobId}`);
    const st = s.body.data?.status;
    process.stdout.write(`     [${i+1}] status=${st}\r`);
    if (st === 'DONE' || st === 'FAILED' || st === 'APPROVED') { done = true; console.log(); break; }
  }
  assert(done, 'job terminé dans le temps imparti');

  const final = await http('GET', `/visual-forge/jobs/${jobId}`);
  const finalStatus = final.body.data?.status;
  if (finalStatus !== 'DONE') {
    console.error('  ✗ job n\'a pas atteint DONE:', final.body);
    process.exit(1);
  }
  assert(final.body.data.result?.sizeBytes > 0, 'GLB généré avec taille > 0');
  console.log(`     triangles=${final.body.data.result.triangles} openEdges=${final.body.data.result.openEdges} size=${final.body.data.result.sizeBytes}B`);

  // 8. Manifest
  console.log('\n[8] GET /visual-forge/jobs/:id/manifest');
  const mf = await http('GET', `/visual-forge/jobs/${jobId}/manifest`);
  assert(mf.body.data?.id, 'manifest retourné');
  assert(mf.body.data?.geometry?.triangles > 0, 'manifest.geometry.triangles > 0');

  // 9. Download
  console.log('\n[9] GET /visual-forge/jobs/:id/download');
  const dl = await fetch(`${BASE}/visual-forge/jobs/${jobId}/download`);
  assert(dl.status === 200, 'download répond 200');
  const dlBuf = Buffer.from(await dl.arrayBuffer());
  assert(dlBuf.length > 1000, `download > 1KB (${dlBuf.length}B)`);
  assert(dlBuf.slice(0, 4).toString('hex') === '676c5446', 'magic number GLB (glTF)');

  // 10. Approve
  console.log('\n[10] POST /visual-forge/jobs/:id/approve');
  const ap = await http('POST', `/visual-forge/jobs/${jobId}/approve`, {});
  assert(ap.body.ok, 'approve OK');

  // Verify manifest status updated.
  const mfAfter = await http('GET', `/visual-forge/jobs/${jobId}/manifest`);
  assert(mfAfter.body.data?.status === 'USER_APPROVED', 'manifest.status = USER_APPROVED');

  // 11. Cleanup
  console.log('\n[11] Cleanup');
  await http('DELETE', '/data/smoke-test-key');
  await http('DELETE', `/storage/${upload.id}`);
  await fsp.rm(targetPath).catch(() => {});
  await fsp.rm(tmpDir, { recursive: true }).catch(() => {});

  console.log('\n✅ Tous les tests passent !');
}

main().catch((err) => {
  console.error('Smoke test FAILED:', err);
  process.exit(1);
});
