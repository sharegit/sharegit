using Core.Model;
using Core.Model.GitLab;
using System.Threading.Tasks;

namespace ShareGit.Services
{
    public interface IAccountServiceGitlab
    {
        Task<APIResponse<GitlabWebFlowAccessToken>> AuthUserWithGitlab(string code, string state);
        Task<APIResponse<GitlabUserInfo>> GetUserInfo(GitlabUserAccess accessToken);
    }
}
