const fs = require('fs');
const path = require('path');
const metadata = require('./metadata');
const homeTpl = fs.readFileSync(path.resolve(__dirname, '../_posts/home.html'), 'utf8');

let htmlNav = '';

const list = metadata.post.map((postInfo) => {
  const data = postInfo.metadata;
  return {
    title: data.title,
    date: data.date,
    url: `/blog/${postInfo.year}/${postInfo.filename}`
  };
});

htmlNav = `
  <ul>
    ${list.map(l => `<li><a href="${l.url}">${l.title}</a></li>`).join('')}
  </ul>
`;

fs.writeFile(path.resolve(__dirname, '..', 'index.html'), homeTpl.replace('<% blogList %>', htmlNav), (err) => {
  console.log('Upadate home html success!\n');
});
