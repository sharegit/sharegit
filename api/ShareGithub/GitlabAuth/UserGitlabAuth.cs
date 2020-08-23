using Core.Model.GitLab;
using ShareGithub.GithubAuth;
using System.Net.Http.Headers;

namespace ShareGithub.GitlabAuth
{
    class UserGitlabAuth : AuthMode
    {
        private GitlabUserAccess UserAccess { get; }
        public UserGitlabAuth(GitlabUserAccess userAccess)
        {
            UserAccess = userAccess;
        }
        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"Bearer {UserAccess.AccessToken}");
        }
    }
}
