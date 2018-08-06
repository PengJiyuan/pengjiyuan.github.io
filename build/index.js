const mdpack = require('mdpack');
const fs = require('fs');
const path = require('path');

fs.readdirSync(path.resolve(__dirname, '../_posts'))
  .filter(m => fs.statSync(path.resolve(__dirname, '../_posts', m)).isDirectory())
  .forEach((year) => {
    fs.readdirSync(path.resolve(__dirname, '../_posts', year))
      .forEach((post) => {
        const mdConfig = {
          entry: path.resolve(__dirname, '../_posts', year, post),
          output: {
            path: path.resolve(__dirname, '../blog', year, post.split('.md')[0]),
            name: 'index'
          },
          format: ['html'],
          plugins: [
            new mdpack.plugins.mdpackPluginRemoveHead()
          ]
        };
        mdpack(mdConfig);
      });
  });