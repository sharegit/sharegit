namespace Core.Model.Github
{
    public class GithubRepositories : PaginatedGithubResponse<GithubRepository>
    {
        public GithubRepository[] Repositories { get; set; }
        public override GithubRepository[] Get() => Repositories;
    }
}
