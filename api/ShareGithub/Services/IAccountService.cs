using Core.Model;
using Core.Model.Github;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public interface IAccountService
    {
        Task<GithubAPIResponse<GithubWebFlowAccessToken>> AuthUserWithGithub(string code, string state);
        Task<GithubAPIResponse<GithubWebFlowAccessToken>> RefreshAuthWithGithub(string refreshToken);
        Task<GithubAPIResponse<GithubUserInfo>> GetUserInfo(GithubUserAccess accessToken);
    }
}
