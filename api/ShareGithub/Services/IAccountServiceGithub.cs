using Core.Model;
using Core.Model.Github;
using Core.Model.GitLab;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public interface IAccountServiceGithub
    {
        Task<GithubAPIResponse<GithubWebFlowAccessToken>> AuthUserWithGithub(string code, string state);
        Task<GithubAPIResponse<GithubWebFlowAccessToken>> RefreshAuthWithGithub(string refreshToken);
        Task<GithubAPIResponse<GithubUserInfo>> GetUserInfo(GithubUserAccess accessToken);
    }
}
