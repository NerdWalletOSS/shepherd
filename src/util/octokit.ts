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

    response = await octokit.getNextPage(response); // eslint-disable-line no-await-in-loop
    data = data.concat(extractItems(response.data));
  }
  return data;
};

// Search responses have a slightly different structure than normal ones, so we
// need to extract the items from a different key
const extractSearch = (data: any) => data.items;
export const paginateSearch = (octokit: Octokit, method: Method) => paginate(octokit, method, extractSearch);
