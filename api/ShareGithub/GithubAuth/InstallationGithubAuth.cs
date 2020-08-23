using Core.Model.Github;
using System.Net.Http.Headers;

namespace ShareGithub.GithubAuth
{
    class InstallationGithubAuth : AuthMode
    {
        private GithubAppAccess installationToken;
        public InstallationGithubAuth(GithubAppAccess installationAccess)
        {
            this.installationToken = installationAccess;
        }
        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"token {installationToken.AccessToken}");
        }
    }
}
