using Core.Model;
using Core.Model.Bitbucket;
using Core.Util;
using Microsoft.Extensions.Options;
using ShareGithub.BitbucketAuth;
using ShareGithub.Settings;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public class AccountServiceBitbucket : BitbucketBaseService, IAccountServiceBitbucket
    {
        public AccountServiceBitbucket(IOptions<BitbucketAppSettings> appSettings) : base(appSettings)
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
            return await FetchAPI<BitbucketUserInfo>(
                "/user", HttpMethod.Get,
                new UserBitbucketAuth(accessToken));
        }
    }
}
