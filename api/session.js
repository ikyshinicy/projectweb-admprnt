const { send, method, requireSession } = require('../lib/admin');
module.exports = function handler(req, res) {
  if (!method(req, res, 'GET')) return;
  if (!requireSession(req, res)) return;
  return send(res, 200, { authenticated: true });
};
