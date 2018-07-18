import Octokit from '@octokit/rest';
const octokit = new Octokit();

type DataExtractor = (d: any) => any[];
type Method = (opts: any) => Promise<any>;

export const paginate =
  (method: Method, extractItems: DataExtractor = (d: any) => d) => async (options: any): Promise<any[]> => {
  let response: any = await method({
    ...options,
    per_page: 100,
  });
  let data = extractItems(response.data);
  while (octokit.hasNextPage(response)) {
    response = await octokit.getNextPage(response); // eslint-disable-line no-await-in-loop
    data = data.concat(extractItems(response.data));
  }
  return data;
};

// Search responses have a slightly different structure than normal ones, so we
// need to extract the items from a different key
export const paginateSearch = (method: Method) => module.exports.paginate(method, (data: any) => data.items);
