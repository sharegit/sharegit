using Core.Model;
using Core.Model.GitLab;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShareGit
{
    public interface IRepositoryServiceGitlab
    {
        Task<APIResponse<GitlabProject[]>> GetProjects(int userId, GitlabUserAccess userAccess);
        Task<APIResponse<GitlabBranch[]>> GetBranches(int projectId, GitlabUserAccess userAccess);
        Task<APIResponse<GitlabFile>> GetContent(int projectId, string sha, string uri, GitlabUserAccess userAccess);
        Task<APIResponse<GitlabDirectoryObject[]>> GetDirectoryContent(int projectId, string sha, string uri, GitlabUserAccess userAccess);

    }
}
