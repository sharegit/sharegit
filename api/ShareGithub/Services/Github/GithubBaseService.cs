using Core.Model;
using Core.Model.Github;
using Microsoft.Extensions.Options;
using ShareGithub.GithubAuth;
using ShareGithub.Settings;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public abstract class GithubBaseService : BaseService<GithubAppSettings>
    {
        public GithubBaseService(IOptions<GithubAppSettings> appSettings) : base(appSettings)
        {

        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#get-a-user-installation-for-the-authenticated-app
        /// </summary>
        public async Task<APIResponse<GithubUserInstallation>> GetInstallation(string user)
        {
            return await FetchAPI<GithubUserInstallation>(
                $"/users/{user}/installation",
                HttpMethod.Get,
                new AppGithubAuth());
        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#create-an-installation-access-token-for-an-app
        /// </summary>
        public async Task<APIResponse<GithubInstallationAccessRequest>> GetAccessToken(int installationId)
        {
            return await FetchAPI<GithubInstallationAccessRequest>(
                $"/app/installations/{installationId}/access_tokens",
                HttpMethod.Post,
                new AppGithubAuth());
        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#list-app-installations-accessible-to-the-user-access-token
        /// </summary>
        public async Task<APIResponse<GithubUserInstallations>> GetUserInstallations(GithubUserAccess userAccessToken)
        {
            return await FetchAPI<GithubUserInstallations>(
                $"/user/installations",
                HttpMethod.Get,
                new UserGithubAuth(userAccessToken));
        }

        public async Task<GithubAppAccess> GetAccess(string user)
        {
            var installation = await GetInstallation(user);
            return await GetAccess(installation.Value.Id);
        }
        public async Task<GithubAppAccess> GetAccess(int installationId)
        {
            var accessToken = await GetAccessToken(installationId);

            return new GithubAppAccess()
            {
                InstallationId = installationId,
                AccessToken = accessToken.Value.Token
            };
        }
    }
}
