const octokit = require('@octokit/rest');

module.exports.paginate = method => async (options) => {
  let response = await method({
    ...options,
    per_page: 100,
  });
  let { data } = response;
  while (octokit.hasNextPage(response)) {
    response = await octokit.getNextPage(response); // eslint-disable-line no-await-in-loop
    data = data.concat(response.data);
  }
  return data;
};
