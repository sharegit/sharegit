using Core.Model;
using Core.Model.Bitbucket;
using Core.Util;
using Microsoft.Extensions.Options;
using ShareGithub.BitbucketAuth;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Settings;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public class AccountServiceBitbucket : BitbucketBaseService, IAccountServiceBitbucket
    {
        public AccountServiceBitbucket(IOptions<BitbucketAppSettings> appSettings,
            IRepository<Account, AccountDatabaseSettings> accountRepository) : base(appSettings, accountRepository)
        {
        }
        /// <summary>
        /// https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/
        /// </summary>
        public async Task<APIResponse<BitbucketWebFlowAccessToken>> AuthUserWithBitbucket(string code, string state)
        {
            return await FetchSite<BitbucketWebFlowAccessToken>(
                "/oauth2/access_token", HttpMethod.Post,
                new AppBitbucketAuth(AppSettings.ClientId, RollingEnv.Get("SHARE_GIT_BITBUCKET_APP_CLIENT_SECRET")),
                new Dictionary<string, string>(){
                    { "grant_type", "authorization_code"},
                    { "code", code}
                });
        }

        /// <summary>
        /// https://developer.atlassian.com/bitbucket/api/2/reference/resource/user
        /// </summary>
        public async Task<APIResponse<BitbucketUserInfo>> GetUserInfo(BitbucketUserAccess accessToken)
        {
            RefreshTokenIfNecessary(accessToken);
            return await FetchAPI<BitbucketUserInfo>(
                "/user", HttpMethod.Get,
                new UserBitbucketAuth(accessToken));
        }

        /// <summary>
        /// https://developer.atlassian.com/bitbucket/api/2/reference/resource/user/emails
        /// </summary>
        public async Task<APIResponse<PaginatedBitbucketResponse<BitbucketEmail>>> GetUserEmails(BitbucketUserAccess accessToken)
        {
            RefreshTokenIfNecessary(accessToken);
            return await FetchBitbucketAPIRecursively<BitbucketEmail>(
                "/user/emails", HttpMethod.Get,
                new UserBitbucketAuth(accessToken));
        }
    }
}
