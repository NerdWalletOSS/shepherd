import Octokit from '@octokit/rest';

type DataExtractor = (d: any) => any[];
type Method = (opts: any) => Promise<any>;

const wait = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout));

export const paginate = (
  octokit: Octokit,
  method: Method,
  extractItems: DataExtractor = (d: any) => d,
) => async (options: any): Promise<any[]> => {
  let response: any = await method({
    ...options,
    per_page: 100,
  });
  let data = extractItems(response.data);
  while (octokit.hasNextPage(response)) {
    // Avoid GitHub's "abuse detection mechanisms"
    await wait(2000);
    try {
      response = await octokit.getNextPage(response); // eslint-disable-line no-await-in-loop
      data = data.concat(extractItems(response.data));
    } catch (e) {
      if (e.headers && e.headers['retry-after']) {
        const retryAfter = e.headers['retry-after'];
        console.info(`\nHit rate limit; waiting ${retryAfter} seconds and retrying.`);
        await wait(retryAfter * 1000);
        continue;
      }
    }
  }
  return data;
};

// Search responses have a slightly different structure than normal ones, so we
// need to extract the items from a different key
const extractSearch = (data: any) => data.items;
export const paginateSearch = (octokit: Octokit, method: Method) => paginate(octokit, method, extractSearch);
