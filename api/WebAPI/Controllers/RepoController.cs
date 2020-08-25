using Core.APIModels;
using Core.Model.Github;
using Core.Model.GitLab;
using Core.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareGithub;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "token")]
    public class RepoController : ControllerBase
    {
        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IRepositoryServiceGithub RepositoryServiceGH { get; }
        private IRepositoryServiceGitlab RepositoryServiceGL { get; }
        public RepoController(IRepositoryServiceGithub repositoryServiceGH,
            IRepositoryServiceGitlab repositoryServiceGL,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            RepositoryServiceGH = repositoryServiceGH;
            RepositoryServiceGL = repositoryServiceGL;
            ShareRepository = shareRepository;
            AccountRepository = accountRepository;
        }


        [HttpGet("{provider}/{id}/{user}/{repo}/blob/{sha}/{**uri}")]
        [Produces("application/json")]
        public async Task<ActionResult<BlobResult>> GetRepoBlob(string provider, int id, string user, string repo, string sha, string uri)
        {
            switch (provider)
            {
                case "github":
                    {
                        var accessToken = await RepositoryServiceGH.GetAccess(user);

                        var content = await RepositoryServiceGH.GetContent(user, repo, sha, uri, accessToken);

                        return new BlobResult()
                        {
                            File = content.Value.Path,
                            Content = content.Value.Content
                        };
                    }
                case "gitlab":
                    {
                        var claim = HttpContext.User.Claims.First(x => x.Type == ClaimTypes.Hash);
                        var token = ShareRepository.Find(x => x.Token.Token == claim.Value);
                        var sharingUser = AccountRepository.Get(token.Token.SharingUserId);
                        GitlabUserAccess userAccessToken = new GitlabUserAccess()
                        {
                            AccessToken = JWT.Decode<string>(sharingUser.GitlabConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                            UserId = sharingUser.Id
                        };
                        var content = await RepositoryServiceGL.GetContent(id, sha, uri, userAccessToken);

                        return new BlobResult()
                        {
                            File = content.Value.FilePath,
                            Content = content.Value.Content
                        };
                    }
                default:
                    throw new ArgumentException("Invalid argument: provider: [" + provider + "]");
            }
        }

        /// <summary>
        /// Has a limit of 1000 files per directory
        /// </summary>
        [HttpGet("{provider}/{id}/{user}/{repo}/tree/{sha}/{**uri}")]
        [Produces("application/json")]
        public async Task<ActionResult<TreeResult.TreeNode[]>> GetRepoTree(string provider, int id, string user, string repo, string sha, string uri)
        {
            switch(provider)
            {
                case "github":
                    {
                        var accessToken = await RepositoryServiceGH.GetAccess(user);

                        var tree = await RepositoryServiceGH.GetDirectoryContent(user, repo, sha, uri, accessToken);

                        return tree.Value.Select(x => new TreeResult.TreeNode()
                        {
                            Path = x.Path,
                            Sha = x.Sha,
                            Type = x.Type
                        }).ToArray();
                    }
                case "gitlab":
                    {
                        var claim = HttpContext.User.Claims.First(x => x.Type == ClaimTypes.Hash);
                        var token = ShareRepository.Find(x => x.Token.Token == claim.Value);
                        var sharingUser = AccountRepository.Get(token.Token.SharingUserId);
                        GitlabUserAccess userAccessToken = new GitlabUserAccess()
                        {
                            AccessToken = JWT.Decode<string>(sharingUser.GitlabConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                            UserId = sharingUser.Id
                        };

                        var tree = await RepositoryServiceGL.GetDirectoryContent(id, sha, uri, userAccessToken);

                        return tree.Value.Select(x => new TreeResult.TreeNode()
                        {
                            Path = x.Path,
                            Sha = "missing",
                            Type = x.Type
                        }).ToArray();
                    }
                default:
                    throw new ArgumentException("Invalid argument: provider: [" + provider + "]");
            }
        }
    }
}
