using Core.Model;
using Core.Model.Github;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShareGithub
{
    public interface IRepositoryService
    {
        Task<GithubAPIResponse> GetInstallation(string user);
        Task<GithubAPIResponse> GetAccessToken(string url);
        Task<GithubAPIResponse> GetInstallationRepositories(GithubAppAccess installationAccess);
        Task<GithubAPIResponse> GetInstallationRepository(string owner, string repo, GithubAppAccess installationAccess);
        Task<GithubAPIResponse> GetRepositoryTree(string trees_url, GithubAppAccess installationAccess, bool recursive);
        Task<GithubAPIResponse> GetBranches(string owner, string repo, GithubAppAccess installationAccess);
        Task<GithubAPIResponse> GetCommits(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess, int page = 0, int per_page = 0);
        Task<GithubAPIResponse> GetContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess);
        Task<GithubAPIResponse> GetUserInstallations(GithubUserAccess userAccessToken);
        Task<IEnumerable<GithubRepo>> GetUserInstallationRepositories(GithubUserAccess userAccessToken);
        Task<GithubAppAccess> GetAccess(string user);
    }
}
