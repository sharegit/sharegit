﻿using Core.Model;
using System.Threading.Tasks;

namespace ShareGithub
{
    public interface IRepositoryService
    {
        Task<GithubAPIResponse> GetInstallation(string user);
        Task<GithubAPIResponse> GetAccessToken(string url);
        Task<GithubAPIResponse> GetInstallationRepositories(string installationAccess);
        Task<GithubAPIResponse> GetInstallationRepository(string owner, string repo, string installationAccess);
        Task<GithubAPIResponse> GetRepositoryTree(string trees_url, string installationAccess, bool recursive);
        Task<GithubAPIResponse> GetBranches(string owner, string repo, string installationAccess);
        Task<GithubAPIResponse> GetCommits(string owner, string repo, string sha, string uri, string installationAccess, int page = 0, int per_page = 0);
        Task<GithubAPIResponse> GetContent(string owner, string repo, string sha, string uri, string installationAccess);
        Task<GithubAppAccess> GetAccess(string user);
    }
}
