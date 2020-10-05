using Core.Model;
using Core.Model.Bitbucket;
using Microsoft.Extensions.Options;
using ShareGit.BitbucketAuth;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Services;
using ShareGit.Settings;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace ShareGit
{
    public class RepositoryServiceBitbucket : BitbucketBaseService, IRepositoryServiceBitbucket
    {
        public RepositoryServiceBitbucket(IOptions<BitbucketAppSettings> appSettings,
            IRepository<Account, AccountDatabaseSettings> accountRepository) : base(appSettings, accountRepository)
        {
        }

        /// <summary>
        /// https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories
        /// </summary>
        public async Task<APIResponse<PaginatedBitbucketResponse<BitbucketRepository>>> GetRepositories(BitbucketUserAccess userAccess)
        {
            userAccess = await RefreshTokenIfNecessary(userAccess);
            return await FetchBitbucketAPIRecursively<BitbucketRepository>(
                $"/repositories",
                HttpMethod.Get,
                new UserBitbucketAuth(userAccess),
                null,
                ("role", "admin"));
        }

        /// <summary>
        /// https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/refs/branches
        /// </summary>
        public async Task<APIResponse<PaginatedBitbucketResponse<BitbucketBranch>>> GetBranches(string workspace, string slug, BitbucketUserAccess userAccess)
        {
            userAccess = await RefreshTokenIfNecessary(userAccess);
            return await FetchBitbucketAPIRecursively<BitbucketBranch>(
                $"/repositories/{workspace}/{slug}/refs/branches",
                HttpMethod.Get,
                new UserBitbucketAuth(userAccess));
        }

        public async Task<APIResponse<PaginatedBitbucketResponse<BitbucketDirecotryObject>>> GetDirectoryContent(string workspace, string slug, string sha, string uri, BitbucketUserAccess userAccess)
        {
            userAccess = await RefreshTokenIfNecessary(userAccess);
            return await FetchBitbucketAPIRecursively<BitbucketDirecotryObject>(
                $"/repositories/{workspace}/{slug}/src/{sha}/{HttpUtility.UrlEncode(uri)?.Replace("+", "%20")}",
                HttpMethod.Get,
                new UserBitbucketAuth(userAccess));
        }

        public async Task<APIResponse<string>> GetContent(string workspace, string slug, string sha, string uri, BitbucketUserAccess userAccess)
        {
            userAccess = await RefreshTokenIfNecessary(userAccess);
            return await FetchAPI<string>(
                $"/repositories/{workspace}/{slug}/src/{sha}/{HttpUtility.UrlEncode(uri)?.Replace("+", "%20")}",
                HttpMethod.Get,
                new UserBitbucketAuth(userAccess));
        }
    }
}
