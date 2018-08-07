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
    url: `/blog/${postInfo.year}/${postInfo.filename}`,
    intro: data.intro,
    tag: data.tag,
    author: data.author,
    type: data.type || '原创'
  };
});

htmlNav = `
  ${list.map(l => `
    <article>
      <header>
        <h1 class="post-title"><a href="${l.url}">${l.title}</a></h1>
      </header>
      <section>
        <p>${l.intro}</p>
      </section>
      <footer>${l.author}</footer>
    </article>
  `).join('')}
`;

function buildHomeHtml() {
  fs.writeFile(path.resolve(__dirname, '..', 'index.html'), homeTpl.replace('<% blogList %>', htmlNav), (err) => {
    console.log('\nUpadate home html success!\n');
  });
}

module.exports = buildHomeHtml;
