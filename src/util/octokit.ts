import Octokit from '@octokit/rest';
import { RetryMethod } from '../adapters/base';

type DataExtractor = (d: any) => any[];
type Method = (opts: any) => Promise<any>;

const wait = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout));

export const paginate = (
  octokit: Octokit,
  method: Method,
  extractItems: DataExtractor = (d: any) => d,
  onRetry: RetryMethod,
  failOnIncompleteSearch: boolean
) => async (options: any): Promise<any[]> => {
  let response: any = await method({
    ...options,
    per_page: 100,
  });
  // Fail if incomplete search flag set on checkout command
  if (response.data.incomplete_results && failOnIncompleteSearch) {
    throw "Error: GitHub API returned incomplete search results";
  // Always warn if GitHub has returned an incomplete resultset
  } else if (response.data.incomplete_results) {
    console.log("\nWarning: GitHub API returned incomplete search results");
  }
  let data = extractItems(response.data);
  while (octokit.hasNextPage(response)) {
    // Avoid GitHub's "abuse detection mechanisms"
    await wait(500);
    try {
      response = await octokit.getNextPage(response); // eslint-disable-line no-await-in-loop
      data = data.concat(extractItems(response.data));
    } catch (e) {
      if (e.headers && e.headers['retry-after']) {
        const retryAfter = Number(e.headers['retry-after']);
        if (Number.isNaN(retryAfter)) {
          throw e;
        }
        onRetry(retryAfter);
        await wait(retryAfter * 1000);
        continue;
      } else {
        throw e;
      }
    }
  }
  return data;
};

// Search responses have a slightly different structure than normal ones, so we
// need to extract the items from a different key
const extractSearch = (data: any) => data.items;
export const paginateSearch = (octokit: Octokit, method: Method, onRetry: Method, failOnIncompleteSearch: boolean) =>
    paginate(octokit, method, extractSearch, onRetry, failOnIncompleteSearch);
