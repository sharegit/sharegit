using Core.APIModels;
using Core.Model.Github;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareGithub;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "token")]
    public class RepoController : ControllerBase
    {
        private IRepositoryServiceGithub RepositoryService { get; }
        public RepoController(IRepositoryServiceGithub repositoryService)
        {
            RepositoryService = repositoryService;
        }

        [HttpGet("{user}/{repo}/branches")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<Branch>>> GetRepoBranches(string user, string repo)
        {
            var accessToken = await RepositoryService.GetAccess(user);

            var branchesResponse = await RepositoryService.GetBranches(user, repo, accessToken);

            return branchesResponse.Value.Select(x => new Branch()
            {
                Name = x.Name
            }).ToList();
        }

        [HttpGet("{user}/{repo}/blob/{sha}/{**uri}")]
        [Produces("application/json")]
        public async Task<ActionResult<BlobResult>> GetRepoBlob(string user, string repo, string sha, string uri)
        {
            var accessToken = await RepositoryService.GetAccess(user);

            var content = await RepositoryService.GetContent(user, repo, sha, uri, accessToken);

            return new BlobResult()
            {
                File = content.Value.Path,
                Content = content.Value.Content
            };
        }

        /// <summary>
        /// Has a limit of 1000 files per directory
        /// </summary>
        [HttpGet("{user}/{repo}/tree/{sha}/{**uri}")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<GithubContent>>> GetRepoTree(string user, string repo, string sha, string uri)
        {
            var accessToken = await RepositoryService.GetAccess(user);

            var tree = await RepositoryService.GetDirectoryContent(user, repo, sha, uri, accessToken);

            return tree.Value.Select(x => new GithubContent()
            {
                Path = x.Path,
                Sha = x.Sha,
                Type = x.Type
            }).ToArray();
        }
    }
}
