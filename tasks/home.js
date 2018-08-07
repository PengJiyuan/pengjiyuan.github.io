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
    type: data.type
  };
});

htmlNav = `
  ${list.map(l => `
    <article>
      <header>
        <h1 class="post-title"><a href="${l.url}">${l.title}</a></h1>
      </header>
      <section>
        <p class="intro">${l.intro}<a href="${l.url}">  »</a></p>
      </section>
      <footer class="author"><img src="/static/images/common/favicon.ico" />${l.author} | ${l.date}</footer>
    </article>
  `).join('')}
`;

function buildHomeHtml() {
  fs.writeFile(path.resolve(__dirname, '..', 'index.html'), homeTpl.replace('<% blogList %>', htmlNav), (err) => {
    console.log('\nUpadate home html success!\n');
  });
}

module.exports = buildHomeHtml;
