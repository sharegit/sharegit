using Core.Model;
using Core.Model.Github;
using System.Threading.Tasks;

namespace ShareGit
{
    public interface IRepositoryServiceGithub
    {
        Task<APIResponse<GithubUserInstallation>> GetInstallation(string user);
        Task<APIResponse<GithubInstallationAccessRequest>> GetAccessToken(int installationId);
        Task<APIResponse<GithubRepositories>> GetInstallationRepositories(GithubAppAccess installationAccess);
        Task<APIResponse<GithubRepository>> GetInstallationRepository(string owner, string repo, GithubAppAccess installationAccess);
        Task<APIResponse<GithubTree>> GetRepositoryTree(string owner, string repo, string sha, GithubAppAccess installationAccess, bool recursive);
        Task<APIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubAppAccess installationAccess);
        Task<APIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubUserAccess userAccess);
        Task<APIResponse<GithubCommit[]>> GetCommits(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess, int page = 0, int per_page = 0);
        Task<APIResponse<GithubCommit[]>> GetCommits(string owner, string repo, string sha, string uri, GithubUserAccess installationAccess, int page = 0, int per_page = 0);
        Task<APIResponse<GithubContent>> GetContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess);
        Task<APIResponse<GithubContent[]>> GetDirectoryContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess);
        Task<APIResponse<GithubUserInstallations>> GetUserInstallations(GithubUserAccess userAccessToken);
        Task<GithubRepository[]> GetUserInstallationRepositories(GithubUserAccess userAccessToken);
        Task<GithubAppAccess> GetAccess(string user);
        Task<APIResponse<string>> GetDownloadURL(string user, string repo, string sha, GithubAppAccess accessToken);
    }
}
