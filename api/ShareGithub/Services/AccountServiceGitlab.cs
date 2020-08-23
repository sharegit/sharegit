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
        IOptions<GitlabAppSettings> GitlabAppSettings { get; }
        public AccountServiceGitlab(IOptions<GitlabAppSettings> gitlabAppSettings)
        {
            GitlabAppSettings = gitlabAppSettings;
        }
        /// <summary>
        /// https://docs.gitlab.com/ee/api/oauth2.html#web-application-flow
        /// </summary>
        public async Task<GitlabAPIResponse<GitlabWebFlowAccessToken>> AuthUserWithGitlab(string code, string state)
        {
            return await FetchGitlab<GitlabWebFlowAccessToken>(
                "/oauth/token", HttpMethod.Post, null,
                ("client_id", GitlabAppSettings.Value.ClientId),
                ("client_secret", RollingEnv.Get("SHARE_GIT_GITLAB_APP_CLIENT_SECRET")),
                ("code", code),
                ("grant_type", "authorization_code"),
                ("redirect_uri", GitlabAppSettings.Value.RedirectUrl));
        }

        public async Task<GitlabAPIResponse<GitlabUserInfo>> GetUserInfo(GitlabUserAccess access)
        {
            return await FetchGitlabAPI<GitlabUserInfo>(
                "/user",
                HttpMethod.Get,
                new UserGitlabAuth(access));
        }
    }
}
