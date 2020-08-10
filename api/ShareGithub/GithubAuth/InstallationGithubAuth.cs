using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Text;

namespace ShareGithub.GithubAuth
{
    class InstallationGithubAuth : GithubAuthMode
    {
        private string installationToken;
        public InstallationGithubAuth(string installationToken)
        {
            this.installationToken = installationToken;
        }
        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"token {installationToken}");
        }
    }
}
