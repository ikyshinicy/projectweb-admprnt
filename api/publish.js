const { send, method, requireSession, requireOrigin, readJson, validateContent, githubConfig, github, currentBranch, ALLOWED_PATHS } = require('../lib/admin');
module.exports = async function handler(req, res) {
  if (!method(req, res, 'POST') || !requireOrigin(req, res) || !requireSession(req, res)) return;
  try {
    const body = await readJson(req);
    if (typeof body.baseSha !== 'string' || !/^[a-f0-9]{40}$/.test(body.baseSha)) return send(res, 400, { error: 'Versi dasar konten tidak valid. Muat ulang data sebelum menerbitkan.' });
    validateContent(body.content);
    const cfg = githubConfig();
    const ref = await currentBranch();
    if (ref.object.sha !== body.baseSha) return send(res, 409, { error: 'Konten di GitHub sudah berubah sejak data dibuka. Tidak ada perubahan yang diterbitkan. Muat ulang data, periksa perubahan terbaru, lalu coba lagi.' });
    const parentCommit = await github(`/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/git/commits/${body.baseSha}`);
    const treeEntries = [];
    for (const path of ALLOWED_PATHS) {
      const value = JSON.stringify(body.content[path], null, 2) + '\n';
      const blob = await github(`/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/git/blobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: value, encoding: 'utf-8' }) });
      treeEntries.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const tree = await github(`/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/git/trees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: treeEntries }) });
    const commit = await github(`/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/git/commits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Perbarui konten situs melalui panel admin', tree: tree.sha, parents: [body.baseSha] }) });
    // PATCH ref tanpa force: bila branch bergerak setelah pengecekan, GitHub menolak update.
    try {
      await github(`/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/git/refs/heads/${encodeURIComponent(cfg.branch)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sha: commit.sha, force: false }) });
    } catch (error) {
      if (error.statusCode === 409) return send(res, 409, { error: 'Branch GitHub berubah saat penerbitan. Tidak ada perubahan yang ditimpa. Muat ulang data dan coba lagi.' });
      throw error;
    }
    return send(res, 200, { ok: true, commit: commit.sha, message: 'Konten berhasil dikirim. Situs biasanya tayang sekitar 1–2 menit setelah build Vercel selesai.' });
  } catch (error) {
    return send(res, error.statusCode || 400, { error: error.statusCode ? error.message : (error.message || 'Penerbitan gagal karena data tidak valid.') });
  }
};
