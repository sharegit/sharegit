using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Core.APIModels;
using Core.Model;
using Core.Model.Github;
using Jose;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using ShareGithub;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "token")]
    public class RepoController : ControllerBase
    {
        private IRepositoryService RepositoryService { get; }
        public RepoController(IRepositoryService repositoryService)
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

        [HttpGet("{user}/{repo}/tree/{sha}/{**uri}")]
        [Produces("application/json")]
        // TODO: remove recursive repository tree, save the current sha at each depth and get only the tree relative to the previous tree sha
        public async Task<ActionResult<TreeResult>> GetRepo(string user, string repo, string sha, string uri)
        {
            var accessToken = await RepositoryService.GetAccess(user);

            var tree = await RepositoryService.GetRepositoryTree(user, repo, sha, accessToken, true);
            uri = uri?.TrimEnd('/') ?? "";
            if(uri.Any())
                uri += '/';
            var nodes = new List<TreeResult.TreeNode>();
            var commitFetshes = new List<Task<GithubAPIResponse<GithubCommit[]>>>();
            foreach (var node in tree.Value.Tree)
            {
                string path = node.Path;
                if (path.StartsWith(uri))
                {
                    var prefixRemoved = path.Remove(0, uri.Length);
                    if (prefixRemoved.Length > 0)
                    {
                        int nextSlash = prefixRemoved.IndexOf('/');

                        // It is in this folder
                        if (nextSlash == -1)
                        {
                            string type = node.Type;
                            string nodeSha = node.Sha;

                            commitFetshes.Add(RepositoryService.GetCommits(user, repo, sha, path, accessToken, 1, 1));
                            nodes.Add(new TreeResult.TreeNode()
                            {
                                Path = path,
                                Type = type,
                                Sha = nodeSha
                            });
                        }
                        // There are more folders to go
                        else
                        {

                        }
                    }
                }
            }
            for(int i = 0; i < commitFetshes.Count;i++)
            {
                var commitsResponse = await commitFetshes[i];
                var latestCommit = commitsResponse.Value.First();

                nodes[i].Author = latestCommit.Commit.Author.Name;
                nodes[i].LastModifyDate = latestCommit.Commit.Author.Date;
                nodes[i].LastModifyCommitMessage = latestCommit.Commit.Message;
            }

            return new TreeResult()
            {
                TreeNodes = nodes.ToArray()
            };
        }
    }
}
