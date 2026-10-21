const { send, method, requireSession, githubConfig, github, currentBranch, ALLOWED_PATHS } = require('../lib/admin');
module.exports = async function handler(req, res) {
  if (!method(req, res, 'GET') || !requireSession(req, res)) return;
  try {
    const cfg = githubConfig();
    const [ref, files] = await Promise.all([
      currentBranch(),
      Promise.all(ALLOWED_PATHS.map(async path => {
        const result = await github(`/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`);
        if (!result.content) throw new Error(`File ${path} tidak bisa dibaca.`);
        return [path, JSON.parse(Buffer.from(result.content, 'base64').toString('utf8'))];
      }))
    ]);
    return send(res, 200, { baseSha: ref.object.sha, content: Object.fromEntries(files) });
  } catch (error) {
    return send(res, error.statusCode || 502, { error: error.statusCode ? error.message : 'Konten dari GitHub gagal dibaca. Periksa pengaturan server dan file JSON.' });
  }
};
