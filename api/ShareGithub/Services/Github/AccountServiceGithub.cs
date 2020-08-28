using Core.Model;
using Core.Model.Github;
using Core.Util;
using Microsoft.Extensions.Options;
using ShareGithub.GithubAuth;
using ShareGithub.Settings;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public class AccountServiceGithub : GithubBaseService, IAccountServiceGithub
    {
        public AccountServiceGithub(IOptions<GithubAppSettings> appSettings): base(appSettings)
        {
        }
        /// <summary>
        /// https://docs.github.com/en/developers/apps/identifying-and-authorizing-users-for-github-apps#web-application-flow
        /// </summary>
        public async Task<APIResponse<GithubWebFlowAccessToken>> AuthUserWithGithub(string code, string state)
        {
            return await FetchSite<GithubWebFlowAccessToken>(
                "/login/oauth/access_token", HttpMethod.Post,
                ("client_id", AppSettings.ClientId),
                ("client_secret", RollingEnv.Get("SHARE_GIT_GITHUB_APP_CLIENT_SECRET")),
                ("code", code),
                ("state", state),
                ("redirect_uri", AppSettings.RedirectUrl));
        }

        /// <summary>
        /// https://docs.github.com/en/developers/apps/refreshing-user-to-server-access-tokens#renewing-a-user-token-with-a-refresh-token
        /// </summary>
        public async Task<APIResponse<GithubWebFlowAccessToken>> RefreshAuthWithGithub(string refreshToken)
        {
            return await FetchSite<GithubWebFlowAccessToken>(
                "/login/oauth/access_token",
                HttpMethod.Post,
                ("client_id", AppSettings.ClientId),
                ("client_secret", RollingEnv.Get("SHARE_GIT_GITHUB_APP_CLIENT_SECRET")),
                ("refresh_token", refreshToken),
                ("grant_type", "refresh_token"),
                ("redirect_uri", AppSettings.RedirectUrl));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
        /// </summary>
        public async Task<APIResponse<GithubUserInfo>> GetUserInfo(GithubUserAccess access)
        {
            return await FetchAPI<GithubUserInfo>(
                "/user",
                HttpMethod.Get,
                new UserGithubAuth(access));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/users#list-email-addresses-for-the-authenticated-user
        /// </summary>
        public async Task<APIResponse<GithubEmail[]>> GetUserEmails(GithubUserAccess access)
        {
            return await FetchAPI<GithubEmail[]>(
                "/user/emails",
                HttpMethod.Get,
                new UserGithubAuth(access));
        }
    }
}
