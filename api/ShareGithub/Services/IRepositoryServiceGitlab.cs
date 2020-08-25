using Core.Model.GitLab;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShareGithub
{
    public interface IRepositoryServiceGitlab
    {
        Task<GitlabAPIResponse<GitlabProject[]>> GetProjects(int userId, GitlabUserAccess userAccess);
        Task<GitlabAPIResponse<GitlabBranch[]>> GetBranches(int projectId, GitlabUserAccess userAccess);
        Task<GitlabAPIResponse<GitlabFile>> GetContent(int projectId, string sha, string uri, GitlabUserAccess userAccess);
        Task<GitlabAPIResponse<GitlabDirectoryObject[]>> GetDirectoryContent(int projectId, string sha, string uri, GitlabUserAccess userAccess);

    }
}
