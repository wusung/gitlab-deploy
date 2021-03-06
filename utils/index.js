const fs = require('fs');
const zlib = require('zlib');
const tar = require('tar');
const path = require('path');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');

exports.formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  let year = '' + d.getFullYear();
  let hours = '' + d.getHours();
  let minutes = '' + d.getMinutes();
  let seconds = '' + d.getSeconds();
  return [
    year.padStart(2, '0'),
    month.padStart(2, '0'),
    day.padStart(2, '0'),
    hours.padStart(2, '0'),
    minutes.padStart(2, '0'),
    seconds.padStart(2, '0')].join('');
}

exports.ensurePath = (pathname) => {
  if (!fs.existsSync(exports.resolveHome(pathname))) {
    fs.mkdirSync(exports.resolveHome(pathname), { recursive: true });
  }
}

exports.resolveHome = (filepath) => {
  if (filepath[0] === '~') {
    return path.join(process.env.HOME, filepath.slice(1));
  }
  return filepath;
}

exports.createKey = (keyPath) => {
  exports.ensurePath(path.dirname(keyPath));

  if (!fs.existsSync(keyPath)) {
    const key = uuid();

    fs.writeFileSync(keyPath, crypto.createHash('sha256').update(key).digest('base64'));
    console.log(`Please write down the key. You can delete ${keyPath} if you forget the key.`);
    console.log(`key = ${key}`);
  }
}

exports.createHash = (str) => {
  return crypto.createHash('sha256').update(str).digest('base64');
}

exports.decompress = (input, output) => {
  exports.ensurePath(path.resolve(output));
  fs.createReadStream(path.resolve(input))
  .on('error', console.log)
  .pipe(zlib.Unzip())
  .pipe(tar.x({
    C: path.resolve(output),
    strip: 2
  }))
}