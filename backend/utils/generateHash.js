// ==========================================================
// Utility: Generate a bcrypt hash for a new admin password
// Usage: node utils/generateHash.js yourPasswordHere
// Then paste the resulting hash into the admins table.
// ==========================================================
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node utils/generateHash.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nPassword: ', password);
console.log('Bcrypt Hash:', hash);
console.log('\nUse this in SQL:');
console.log(`INSERT INTO admins (username, password) VALUES ('yourusername', '${hash}');\n`);
