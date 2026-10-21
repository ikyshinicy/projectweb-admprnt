const { send, method, requireSession, requireOrigin, cookie } = require('../lib/admin');
module.exports = function handler(req, res) {
  if (!method(req, res, 'POST')) return;
  if (!requireOrigin(req, res) || !requireSession(req, res)) return;
  return send(res, 200, { ok: true }, { 'Set-Cookie': cookie('', 0) });
};
