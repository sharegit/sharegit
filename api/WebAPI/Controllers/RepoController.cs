using Core.APIModels;
using Core.Exceptions;
using Core.Model.Bitbucket;
using Core.Model.Github;
using Core.Model.GitLab;
using Core.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareGit;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
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
        private IRepositoryServiceBitbucket RepositoryServiceBB { get; }
        public RepoController(IRepositoryServiceGithub repositoryServiceGH,
            IRepositoryServiceGitlab repositoryServiceGL,
            IRepositoryServiceBitbucket repositoryServiceBB,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            RepositoryServiceGH = repositoryServiceGH;
            RepositoryServiceGL = repositoryServiceGL;
            RepositoryServiceBB = repositoryServiceBB;
            ShareRepository = shareRepository;
            AccountRepository = accountRepository;
        }

        private bool IsAuthorized(string provider, int id, string user, string repo, string sha, string path, bool download = false)
        {
            path ??= "";
            return (HttpContext.Items.ContainsKey("access")
                && provider switch
                {
                    "github" => ((HttpContext.Items["access"] as Repository[])
                        ?.Any(x =>
                              x.Provider == "github"
                           && x.Owner == user
                           && x.Repo == repo
                           && x.Branches.Contains(sha)
                           && (path.StartsWith(x.Path ?? "") || path.Equals(x.Path.TrimEnd('/')))
                           && (!download || x.DownloadAllowed)) ?? false),

                    "gitlab" => ((HttpContext.Items["access"] as Repository[])
                        ?.Any(x =>
                              x.Provider == "gitlab"
                           && x.RepoId == id
                           && x.Branches.Contains(sha)
                           && (path.StartsWith(x.Path ?? "") || path.Equals(x.Path.TrimEnd('/')))
                           && (!download || x.DownloadAllowed)) ?? false),

                    "bitbucket" => ((HttpContext.Items["access"] as Repository[])
                        ?.Any(x =>
                              x.Provider == "bitbucket"
                           && x.Owner == user
                           && x.Repo == repo
                           && x.Branches.Contains(sha)
                           && (path.StartsWith(x.Path ?? "") || path.Equals(x.Path.TrimEnd('/')))
                           && (!download || x.DownloadAllowed)) ?? false),

                    _ => throw new ArgumentException("Invalid argument: provider: [" + provider + "]")
                });
        }
        [HttpGet("share/branches/{owner}/{repo}")]
        public async Task<ActionResult<IEnumerable<Branch>>> GetSharedBranches(string owner, string repo)
        {
            if (HttpContext.Items.ContainsKey("access"))
            {
                var repos = HttpContext.Items["access"] as Repository[];
                var sharedRepo = repos.FirstOrDefault(x => x.Owner == owner && x.Repo == repo);
                if (sharedRepo != null)
                    return sharedRepo.Branches.Select(x => new Branch()
                    {
                        Name = x
                    }).ToArray();
            }
            
            throw new NotFoundException();
        }

        [HttpGet("{provider}/download/{id}/{user}/{repo}/{sha}")]
        public async Task<ActionResult<string>> GetDownloadLink(string provider, int id, string user, string repo, string sha)
        {
            if(provider != "github")
            {
                // Only github!
                return new BadRequestResult();
            }

            if (!IsAuthorized(provider, id, user, repo, sha, ""))
                throw new NotFoundException();

            var accessToken = await RepositoryServiceGH.GetAccess(user);
            var downloadResponse = await RepositoryServiceGH.GetDownloadURL(user, repo, sha, accessToken);
            return downloadResponse.RequestUri;
        }

        [HttpGet("{provider}/{id}/{user}/{repo}/blob/{sha}/{**uri}")]
        [Produces("application/json")]
        public async Task<ActionResult<BlobResult>> GetRepoBlob(string provider, int id, string user, string repo, string sha, string uri)
        {
            if (!IsAuthorized(provider, id, user, repo, sha, uri))
                throw new NotFoundException();

            switch(provider)
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
                        var token = await ShareRepository.GetAsync(claim.Value);
                        var sharingUser = await AccountRepository.GetAsync(token.Token.SharingUserId);
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
                case "bitbucket":
                    {
                        var claim = HttpContext.User.Claims.First(x => x.Type == ClaimTypes.Hash);
                        var token = await ShareRepository.GetAsync(claim.Value);
                        var sharingUser = await AccountRepository.GetAsync(token.Token.SharingUserId);
                        BitbucketUserAccess userAccessToken = new BitbucketUserAccess()
                        {
                            AccessToken = JWT.Decode<string>(sharingUser.BitbucketConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                            RefreshToken = JWT.Decode<string>(sharingUser.BitbucketConnection.EncodedRefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                            AccessTokenExp = sharingUser.BitbucketConnection.AccessTokenExp,
                            UserId = sharingUser.Id
                        };
                        var content = await RepositoryServiceBB.GetContent(user, repo, sha, uri, userAccessToken);

                        return new BlobResult()
                        {
                            File = uri,
                            Content = Convert.ToBase64String(Encoding.UTF8.GetBytes(content.RAW))
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
            if (!IsAuthorized(provider, id, user, repo, sha, uri))
                throw new NotFoundException();
            switch (provider)
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
                        var token = await ShareRepository.GetAsync(claim.Value);
                        var sharingUser = await AccountRepository.GetAsync(token.Token.SharingUserId);
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
                case "bitbucket":
                    {
                        var claim = HttpContext.User.Claims.First(x => x.Type == ClaimTypes.Hash);
                        var token = await ShareRepository.GetAsync(claim.Value);
                        var sharingUser = await AccountRepository.GetAsync(token.Token.SharingUserId);
                        BitbucketUserAccess userAccessToken = new BitbucketUserAccess()
                        {
                            AccessToken = JWT.Decode<string>(sharingUser.BitbucketConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                            RefreshToken = JWT.Decode<string>(sharingUser.BitbucketConnection.EncodedRefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                            AccessTokenExp = sharingUser.BitbucketConnection.AccessTokenExp,
                            UserId = sharingUser.Id
                        };

                        var tree = await RepositoryServiceBB.GetDirectoryContent(user, repo, sha, uri, userAccessToken);

                        return tree.Value.Values.Select(x => new TreeResult.TreeNode()
                        {
                            Path = x.Path,
                            Sha = "missing",
                            Type = x.Type switch
                            {
                                "commit_directory" => "tree",
                                "commit_file" => "blob",
                                _ => x.Type
                            }
                        }).ToArray();
                    }
                default:
                    throw new ArgumentException("Invalid argument: provider: [" + provider + "]");
            }
        }
    }
}
