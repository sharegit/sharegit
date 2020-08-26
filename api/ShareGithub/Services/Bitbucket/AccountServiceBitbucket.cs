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
        IOptions<BitbucketAppSettings> BitbucketAppSettings { get; }
        public AccountServiceBitbucket(IOptions<BitbucketAppSettings> bitbucketAppSettings)
        {
            BitbucketAppSettings = bitbucketAppSettings;
        }
        /// <summary>
        /// https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/
        /// </summary>
        public async Task<BitbucketAPIResponse<BitbucketWebFlowAccessToken>> AuthUserWithBitbucket(string code, string state)
        {
            return await FetchBitbucket<BitbucketWebFlowAccessToken>(
                "/oauth2/access_token", HttpMethod.Post,
                new AppBitbucketAuth(BitbucketAppSettings.Value.ClientId, RollingEnv.Get("SHARE_GIT_BITBUCKET_APP_CLIENT_SECRET")),
                new Dictionary<string, string>(){
                    { "grant_type", "authorization_code"},
                    { "code", code}
                });
        }

        /// <summary>
        /// https://developer.atlassian.com/bitbucket/api/2/reference/resource/user
        /// </summary>
        public async Task<BitbucketAPIResponse<BitbucketUserInfo>> GetUserInfo(BitbucketUserAccess accessToken)
        {
            return await FetchBitbucketAPI<BitbucketUserInfo>(
                "/user", HttpMethod.Get,
                new UserBitbucketAuth(accessToken),
                null);
        }
    }
}
