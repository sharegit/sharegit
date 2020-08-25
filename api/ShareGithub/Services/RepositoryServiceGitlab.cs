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

        /// <summary>
        /// /projects/:id/repository/files/:file_path
        /// </summary>
        public async Task<GitlabAPIResponse<GitlabFile>> GetContent(int projectId, string sha, string uri, GitlabUserAccess userAccess)
        {
            return await FetchGitlabAPI<GitlabFile>(
                $"/projects/{projectId}/repository/files/{uri}",
                HttpMethod.Get,
                new UserGitlabAuth(userAccess),
                ("ref", sha));
        }

        /// <summary>
        /// https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree
        /// </summary>
        public async Task<GitlabAPIResponse<GitlabDirectoryObject[]>> GetDirectoryContent(int projectId, string sha, string uri, GitlabUserAccess userAccess)
        {
            return await FetchGitlabAPI<GitlabDirectoryObject[]>(
                $"/projects/{projectId}/repository/tree",
                HttpMethod.Get,
                new UserGitlabAuth(userAccess),
                ("ref", sha),
                ("path", uri));
        }
    }
}
