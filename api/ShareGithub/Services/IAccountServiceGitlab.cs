using Core.Model.GitLab;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public interface IAccountServiceGitlab
    {
        Task<GitlabAPIResponse<GitlabWebFlowAccessToken>> AuthUserWithGitlab(string code, string state);
        Task<GitlabAPIResponse<GitlabUserInfo>> GetUserInfo(GitlabUserAccess accessToken);
    }
}
