using Core.Model.GitLab;
using ShareGithub.GitlabAuth;
using ShareGithub.Services;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub
{
    public class RepositoryServiceGitlab : GitlabBaseService, IRepositoryServiceGitlab
    {

        /// <summary>
        /// https://docs.gitlab.com/ee/api/projects.html#list-all-projects
        /// </summary>
        public async Task<GitlabAPIResponse<GitlabProject[]>> GetProjects(int userId, GitlabUserAccess userAccess)
        {
            return await FetchGitlabAPI<GitlabProject[]>(
                $"/users/{userId}/projects",
                HttpMethod.Get,
                new UserGitlabAuth(userAccess));
        }

        /// <summary>
        /// https://docs.gitlab.com/ee/api/branches.html#list-repository-branches
        /// </summary>
        public async Task<GitlabAPIResponse<GitlabBranch[]>> GetBranches(int projectId, GitlabUserAccess userAccess)
        {
            return await FetchGitlabAPI<GitlabBranch[]>(
                $"/projects/{projectId}/repository/branches",
                HttpMethod.Get,
                new UserGitlabAuth(userAccess));
        }
    }
}
