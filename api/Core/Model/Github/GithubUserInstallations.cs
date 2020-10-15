using System.Collections.Generic;

namespace Core.Model.Github
{
    public class GithubUserInstallations : PaginatedGithubResponse<GithubUserInstallation>
    {
        public GithubUserInstallation[] Installations { get; set; }
        public override GithubUserInstallation[] Get() => Installations;
    }
}
