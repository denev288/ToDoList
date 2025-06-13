const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Create a 32-byte encryption key by hashing the environment variable
if (!process.env.ENCRYPTION_KEY) {
  console.error('Error: ENCRYPTION_KEY not found in scripts/.env file');
  process.exit(1);
}

const ENCRYPTION_KEY = crypto.createHash('sha256')
  .update(process.env.ENCRYPTION_KEY)
  .digest();

const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
  const [ivHex, authTagHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encryptFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const encrypted = encrypt(content);
  fs.writeFileSync(`${filepath}.enc`, encrypted);
  console.log(`Encrypted ${filepath} to ${filepath}.enc`);
}

function decryptFile(filepath) {
  const encryptedContent = fs.readFileSync(filepath, 'utf8');
  const decrypted = decrypt(encryptedContent);
  const decryptedPath = filepath.replace('.enc', '');
  fs.writeFileSync(decryptedPath, decrypted);
  console.log(`Decrypted ${filepath} to ${decryptedPath}`);
}

const command = process.argv[2];
const filepath = process.argv[3];

if (!command || !filepath) {
  console.log('Usage: node crypto.js encrypt|decrypt <filepath>');
  process.exit(1);
}

if (command === 'encrypt') {
  encryptFile(filepath);
} else if (command === 'decrypt') {
  decryptFile(filepath);
}
