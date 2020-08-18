using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading.Tasks;
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
        public async Task<ContentResult> GetRepoBranches(string user, string repo)
        {
            var accessToken = await RepositoryService.GetAccess(user);

            var branchesResponse = await RepositoryService.GetBranches(user, repo, accessToken);

            List<string> results = new List<string>();
            foreach (var branch in branchesResponse.Value)
            {
                results.Add(branch.Name);
            }

            string rawresponse = JsonConvert.SerializeObject(results);
            //string rawresponse = branchesResponse;
            return Content(rawresponse, "application/json");
        }

        [HttpGet("{user}/{repo}/blob/{sha}/{**uri}")]
        [Produces("application/json")]
        public async Task<ContentResult> GetRepoBlob(string user, string repo, string sha, string uri)
        {
            var accessToken = await RepositoryService.GetAccess(user);

            var content = await RepositoryService.GetContent(user, repo, sha, uri, accessToken);

            var result = new
            {
                file = content.Value.Path,
                content = content.Value.Content
            };

            string rawresponse = JsonConvert.SerializeObject(result);
            //string rawresponse = contentResponse.RAW;
            return Content(rawresponse, "application/json");
        }

        [HttpGet("{user}/{repo}/tree/{sha}/{**uri}")]
        [Produces("application/json")]
        // TODO: Refactor with https://docs.github.com/en/rest/reference/repos#contents
        public async Task<ActionResult<object>> GetRepo(string user, string repo, string sha, string uri)
        {
            var accessToken = await RepositoryService.GetAccess(user);

            var tree = await RepositoryService.GetRepositoryTree(user, repo, sha, accessToken, true);
            uri = uri?.TrimEnd('/') ?? "";
            if(uri.Any())
                uri += '/';
            List<dynamic> results = new List<dynamic>();
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
                            results.Add(new
                            {
                                path = path,
                                type = type,
                                sha = nodeSha
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
                string lastmodifydate = latestCommit.Commit.Author.Date;
                string lastmodifycommitmessage = latestCommit.Commit.Message;
                string author = latestCommit.Commit.Author.Name;

                results[i] = new
                {
                    path = results[i].path,
                    type = results[i].type,
                    sha = results[i].sha,
                    author = author,
                    lastmodifydate = lastmodifydate,
                    lastmodifycommitmessage = lastmodifycommitmessage,
                };
            }

            //string rawresponse = JsonConvert.SerializeObject(repositoryUrls);
            //string rawresponse = JsonConvert.SerializeObject(results);
            return new OkObjectResult(results);
        }

        [HttpGet("{user}/{repo}")]
        [Produces("application/json")]
        public async Task<ContentResult> GetRepo(string user, string repo)
        {
            var accessToken = await RepositoryService.GetAccess(user);

            var treeResponse = await RepositoryService.GetRepositoryTree(user, repo, "master", accessToken, false);

            //string rawresponse = JsonConvert.SerializeObject(repositoryUrls);
            string rawresponse = treeResponse.RAW;
            return Content(rawresponse, "application/json");
        }
    }
}
