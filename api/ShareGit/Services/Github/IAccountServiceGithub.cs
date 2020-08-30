using Core.Model;
using Core.Model.Github;
using System.Threading.Tasks;

namespace ShareGit.Services
{
    public interface IAccountServiceGithub
    {
        Task<APIResponse<GithubWebFlowAccessToken>> AuthUserWithGithub(string code, string state);
        Task<APIResponse<GithubWebFlowAccessToken>> RefreshAuthWithGithub(string refreshToken);
        Task<APIResponse<GithubUserInfo>> GetUserInfo(GithubUserAccess accessToken);
        Task<APIResponse<GithubEmail[]>> GetUserEmails(GithubUserAccess access);
    }
}
