using Core.Model;
using Core.Model.Bitbucket;
using Core.Util;
using Microsoft.Extensions.Options;
using ShareGit.BitbucketAuth;
using ShareGit.GithubAuth;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGit.Services
{
    public abstract class BitbucketBaseService : BaseService<BitbucketAppSettings>
    {
        IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        protected BitbucketBaseService(IOptions<BitbucketAppSettings> appSettings,
            IRepository<Account, AccountDatabaseSettings> accountRepository) : base(appSettings)
        {
            AccountRepository = accountRepository;
        }

        public async Task<BitbucketUserAccess> RefreshTokenIfNecessary(BitbucketUserAccess userAccess)
        {
            if (userAccess.AccessTokenExp < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            {
                // No need to lock per user, we can refresh this token multiple times:
                // https://community.atlassian.com/t5/Bitbucket-questions/Does-refreshing-a-token-causes-the-old-token-to-be-revoked/qaq-p/1305347

                var account = await AccountRepository.GetAsync(userAccess.UserId);
                if(account?.BitbucketConnection != null)
                {
                    var newAccess = await FetchSite<BitbucketWebFlowAccessToken>(
                        "/oauth2/access_token", HttpMethod.Post,
                        new AppBitbucketAuth(AppSettings.ClientId, RollingEnv.Get("SHARE_GIT_BITBUCKET_APP_CLIENT_SECRET")),
                        new Dictionary<string, string>(){
                                        { "grant_type", "refresh_token"},
                                        { "refresh_token", userAccess.RefreshToken }
                        });

                    string accessToken = newAccess.Value.AccessToken;
                    long accessTokenExpIn = newAccess.Value.ExpiresIn;

                    var encodedAccessToken = JWT.Encode(accessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
                    var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(accessTokenExpIn - 90).ToUnixTimeSeconds();

                    account.BitbucketConnection.EncodedAccessToken = encodedAccessToken;
                    account.BitbucketConnection.AccessTokenExp = accessTokenExp;

                    await AccountRepository.UpdateAsync(account.Id, account);
                    return new BitbucketUserAccess()
                    {
                        AccessToken = accessToken,
                        AccessTokenExp = accessTokenExp,
                        RefreshToken = userAccess.RefreshToken,
                        UserId = userAccess.UserId
                    };
                }
            }

            return userAccess;
        }

        protected async Task<APIResponse<PaginatedBitbucketResponse<T>>> FetchBitbucketAPIRecursively<T>(string url, HttpMethod method, AuthMode authMode = null, Dictionary<string, string> body = null, params (string key, string value)[] queryOptions)
        {
            List<T> values = new List<T>();
            APIResponse<PaginatedBitbucketResponse<T>> currentResponse = null;
            do
            {
                currentResponse = currentResponse switch
                {
                    null => await Fetch<PaginatedBitbucketResponse<T>>($"{AppSettings.APIEndpoint}{url}", method, authMode, body, queryOptions),
                    _ => currentResponse.Value.Next switch
                    {
                        null => null,
                        _ => await Fetch<PaginatedBitbucketResponse<T>>($"{currentResponse.Value.Next}", method, authMode, body, queryOptions)
                    }
                };
                if (currentResponse?.Value?.Values != null)
                    values.AddRange(currentResponse.Value.Values);
            } while (currentResponse != null);
            return new APIResponse<PaginatedBitbucketResponse<T>>()
            {
                RAW = "",
                RemainingLimit = 0,
                Value = new PaginatedBitbucketResponse<T>()
                {
                    Next = null,
                    PageLen = 0,
                    Values = values.ToArray()
                }
            };
        }
    }
}
