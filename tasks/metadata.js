const frontMatter = require('@egoist/front-matter');
const fs = require('fs');
const path = require('path');

const metadata = {
  post: []
};

function getMetadata(content) {
  const head = frontMatter(content).head.split('\n');
  const ret = {};
  head.forEach((h) => {
    const [key, value] = h.split(': ');
    ret[key.trim()] = value.trim();
  });

  if (!ret.type) {
    ret.type = '原创';
  }

  return ret;
}

fs.readdirSync(path.resolve(__dirname, '../_posts'))
  .filter(m => fs.statSync(path.resolve(__dirname, '../_posts', m)).isDirectory())
  .forEach((year) => {
    fs.readdirSync(path.resolve(__dirname, '../_posts', year))
      .forEach((post) => {
        const content = fs.readFileSync(path.resolve(__dirname, '../_posts', year, post), 'utf8');
        metadata.post.push({
          year,
          filename: post.split('.md')[0],
          metadata: getMetadata(content)
        });
      });
  });

fs.writeFileSync(path.resolve(__dirname, '../postMap.json'), JSON.stringify(metadata), 'utf8');

module.exports = metadata;
