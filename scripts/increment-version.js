const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '..', 'version.json');

try {
    if (!fs.existsSync(versionFilePath)) {
        console.error('version.json not found');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    const versionString = data.version; // e.g., "v0.01"

    if (!versionString.startsWith('v')) {
        console.error('Invalid version format. Must start with "v"');
        process.exit(1);
    }

    const parts = versionString.substring(1).split('.');
    if (parts.length !== 2) {
        console.error('Invalid version format. Must be like vX.YY');
        process.exit(1);
    }

    let major = parseInt(parts[0]);
    let minor = parseInt(parts[1]);

    minor++;

    // Format minor to be at least two digits
    const paddedMinor = minor.toString().padStart(2, '0');
    const newVersion = `v${major}.${paddedMinor}`;

    data.version = newVersion;
    fs.writeFileSync(versionFilePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`Version incremented to ${newVersion}`);
} catch (error) {
    console.error('Error incrementing version:', error);
    process.exit(1);
}
