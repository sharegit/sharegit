using Core.Model;
using Core.Model.GitLab;
using Core.Util;
using Microsoft.Extensions.Options;
using ShareGithub.GitlabAuth;
using ShareGithub.Settings;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public class AccountServiceGitlab : GitlabBaseService, IAccountServiceGitlab
    {
        public AccountServiceGitlab(IOptions<GitlabAppSettings> appSettings) : base(appSettings)
        {
        }
        /// <summary>
        /// https://docs.gitlab.com/ee/api/oauth2.html#web-application-flow
        /// </summary>
        public async Task<APIResponse<GitlabWebFlowAccessToken>> AuthUserWithGitlab(string code, string state)
        {
            return await FetchSite<GitlabWebFlowAccessToken>(
                "/oauth/token", HttpMethod.Post,
                ("client_id", AppSettings.ClientId),
                ("client_secret", RollingEnv.Get("SHARE_GIT_GITLAB_APP_CLIENT_SECRET")),
                ("code", code),
                ("grant_type", "authorization_code"),
                ("redirect_uri", AppSettings.RedirectUrl));
        }

        public async Task<APIResponse<GitlabUserInfo>> GetUserInfo(GitlabUserAccess access)
        {
            return await FetchAPI<GitlabUserInfo>(
                "/user",
                HttpMethod.Get,
                new UserGitlabAuth(access));
        }
    }
}
