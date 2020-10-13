using Core.Model;
using Core.Model.Github;
using System.Threading.Tasks;

namespace ShareGit
{
    public interface IRepositoryServiceGithub
    {
        Task<APIResponse<GithubUserInstallation>> GetInstallation(string user);
        Task<APIResponse<GithubInstallationAccessRequest>> GetAccessToken(int installationId);
        Task<APIResponse<GithubRepositories>> GetRepositoriesAccessibleToUserInstallation(int installationId, GithubUserAccess userAccess);
        Task<APIResponse<GithubRepositories>> GetInstallationRepositories(GithubAppAccess installationAccess);
        Task<APIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubUserAccess userAccess);
        Task<APIResponse<GithubContent>> GetContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess);
        Task<APIResponse<GithubContent[]>> GetDirectoryContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess);
        Task<APIResponse<GithubUserInstallations>> GetUserInstallations(GithubUserAccess userAccessToken);
        Task RemoveUserInstalation(int installationId);
        Task<GithubRepository[]> GetUserInstallationRepositories(GithubUserAccess userAccessToken);
        Task<GithubAppAccess> GetAccess(string user);
        Task<GithubAppAccess> GetAccess(int installationId);
        Task<APIResponse<string>> GetDownloadURL(string user, string repo, string sha, GithubAppAccess accessToken);
    }
}
