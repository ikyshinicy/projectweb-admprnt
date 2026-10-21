const crypto = require('node:crypto');
const readline = require('node:readline');

// Buat hash kata sandi secara lokal. Kata sandi tidak disimpan ke file.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl.question('Masukkan kata sandi admin (minimal 12 karakter): ', password => {
  rl.close();
  if (password.length < 12) {
    console.error('Kata sandi minimal 12 karakter. Jalankan ulang skrip.');
    process.exitCode = 1;
    return;
  }
  const salt = crypto.randomBytes(16);
  crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, derivedKey) => {
    if (error) { console.error('Gagal membuat hash.'); process.exitCode = 1; return; }
    console.log('\nSalin hasil berikut ke environment variable ADMIN_PASSWORD_HASH di Vercel:');
    console.log(`scrypt$16384$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`);
  });
});
