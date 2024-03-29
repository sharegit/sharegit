﻿using Core.Model;
using Core.Model.GitLab;
using Microsoft.Extensions.Options;
using ShareGit.GitlabAuth;
using ShareGit.Services;
using ShareGit.Settings;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace ShareGit
{
    public class RepositoryServiceGitlab : GitlabBaseService, IRepositoryServiceGitlab
    {
        public RepositoryServiceGitlab(IOptions<GitlabAppSettings> appSettings) : base(appSettings)
        {
        }

        /// <summary>
        /// https://docs.gitlab.com/ee/api/projects.html#list-all-projects
        /// </summary>
        public async Task<APIResponse<GitlabProject[]>> GetProjects(int userId, GitlabUserAccess userAccess)
        {
            return await FetchAPI<GitlabProject[]>(
                $"/users/{userId}/projects",
                HttpMethod.Get,
                new UserGitlabAuth(userAccess));
        }

        /// <summary>
        /// https://docs.gitlab.com/ee/api/branches.html#list-repository-branches
        /// </summary>
        public async Task<APIResponse<GitlabBranch[]>> GetBranches(int projectId, GitlabUserAccess userAccess)
        {
            return await FetchAPI<GitlabBranch[]>(
                $"/projects/{projectId}/repository/branches",
                HttpMethod.Get,
                new UserGitlabAuth(userAccess));
        }

        /// <summary>
        /// https://docs.gitlab.com/ee/api/repository_files.html
        /// </summary>
        public async Task<APIResponse<GitlabFile>> GetContent(int projectId, string sha, string uri, GitlabUserAccess userAccess)
        {
            return await FetchAPI<GitlabFile>(
                $"/projects/{projectId}/repository/files/{HttpUtility.UrlEncode(uri)?.Replace("+", "%20")}",
                HttpMethod.Get,
                new UserGitlabAuth(userAccess),
                ("ref", sha));
        }

        /// <summary>
        /// https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree
        /// </summary>
        public async Task<APIResponse<GitlabDirectoryObject[]>> GetDirectoryContent(int projectId, string sha, string uri, GitlabUserAccess userAccess)
        {
            return await FetchAPI<GitlabDirectoryObject[]>(
                $"/projects/{projectId}/repository/tree",
                HttpMethod.Get,
                new UserGitlabAuth(userAccess),
                ("ref", sha),
                ("path", uri));
        }
    }
}
