using System.Threading.Tasks;

namespace ShareGithub
{
    public interface IRepositoryService
    {
        Task<string> GetInstallation(string user);
        Task<string> GetAccessToken(string url);
        Task<string> GetInstallationRepositories(string url, string installationAccess);
        Task<string> GetInstallationRepository(string owner, string repo, string installationAccess);
        Task<string> GetRepositoryTree(string trees_url, string installationAccess, bool recursive);
    }
}
