const GithubAdapter = require('./github.js');

module.exports.adapterForName = (name) => {
  switch (name) {
    case 'github':
      return GithubAdapter;
    default:
      throw new Error(`Unknown adapter: ${name}`);
  }
};
