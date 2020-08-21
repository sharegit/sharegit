using Core.Model.Github;
using System.Threading.Tasks;

namespace ShareGithub
{
    public interface IRepositoryService
    {
        Task<GithubAPIResponse<GithubUserInstallation>> GetInstallation(string user);
        Task<GithubAPIResponse<GithubInstallationAccessRequest>> GetAccessToken(int installationId);
        Task<GithubAPIResponse<GithubRepositories>> GetInstallationRepositories(GithubAppAccess installationAccess);
        Task<GithubAPIResponse<GithubRepository>> GetInstallationRepository(string owner, string repo, GithubAppAccess installationAccess);
        Task<GithubAPIResponse<GithubTree>> GetRepositoryTree(string owner, string repo, string sha, GithubAppAccess installationAccess, bool recursive);
        Task<GithubAPIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubAppAccess installationAccess);
        Task<GithubAPIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubUserAccess userAccess);
        Task<GithubAPIResponse<GithubCommit[]>> GetCommits(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess, int page = 0, int per_page = 0);
        Task<GithubAPIResponse<GithubCommit[]>> GetCommits(string owner, string repo, string sha, string uri, GithubUserAccess installationAccess, int page = 0, int per_page = 0);
        Task<GithubAPIResponse<GithubContent>> GetContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess);
        Task<GithubAPIResponse<GithubContent[]>> GetDirectoryContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess);
        Task<GithubAPIResponse<GithubUserInstallations>> GetUserInstallations(GithubUserAccess userAccessToken);
        Task<GithubRepository[]> GetUserInstallationRepositories(GithubUserAccess userAccessToken);
        Task<GithubAppAccess> GetAccess(string user);
    }
}
