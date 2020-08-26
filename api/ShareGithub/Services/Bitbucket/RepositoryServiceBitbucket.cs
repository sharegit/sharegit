using Core.Model.Bitbucket;
using Core.Model.GitLab;
using ShareGithub.BitbucketAuth;
using ShareGithub.GitlabAuth;
using ShareGithub.Services;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub
{
    public class RepositoryServiceBitbucket : BitbucketBaseService, IRepositoryServiceBitbucket
    {

        /// <summary>
        /// https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories
        /// </summary>
        public async Task<BitbucketAPIResponse<PaginatedBitbucketResponse<BitbucketRepository>>> GetRepositories(BitbucketUserAccess userAccess)
        {
            return await FetchBitbucketAPI<PaginatedBitbucketResponse<BitbucketRepository>>(
                $"/repositories",
                HttpMethod.Get,
                new UserBitbucketAuth(userAccess),
                null,
                ("role", "admin"));
        }

        /// <summary>
        /// https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/refs/branches
        /// </summary>
        public async Task<BitbucketAPIResponse<PaginatedBitbucketResponse<BitbucketBranch>>> GetBranches(string workspace, string slug, BitbucketUserAccess userAccess)
        {
            return await FetchBitbucketAPI<PaginatedBitbucketResponse<BitbucketBranch>>(
                $"/repositories/{workspace}/{slug}/refs/branches",
                HttpMethod.Get,
                new UserBitbucketAuth(userAccess));
        }

        public async Task<BitbucketAPIResponse<PaginatedBitbucketResponse<BitbucketDirecotryObject>>> GetDirectoryContent(string workspace, string slug, string sha, string uri, BitbucketUserAccess userAccess)
        {
            return await FetchBitbucketAPI<PaginatedBitbucketResponse<BitbucketDirecotryObject>>(
                $"/repositories/{workspace}/{slug}/src/{sha}/{uri}",
                HttpMethod.Get,
                new UserBitbucketAuth(userAccess));
        }

        public async Task<BitbucketAPIResponse<string>> GetContent(string workspace, string slug, string sha, string uri, BitbucketUserAccess userAccess)
        {
            return await FetchBitbucketAPI<string>(
                $"/repositories/{workspace}/{slug}/src/{sha}/{uri}",
                HttpMethod.Get,
                new UserBitbucketAuth(userAccess));
        }
    }
}
