using Core.APIModels;
using Core.Model.Github;
using Core.Util;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShareGithub;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Settings;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "jwt")]
    public class DashboardController : ControllerBase
    {
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        private IRepositoryService RepositoryService { get; }

        public DashboardController(IRepositoryService repositoryService,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            RepositoryService = repositoryService;
            AccountRepository = accountRepository;
            ShareRepository = shareRepository;
        }

        [HttpGet()]
        [Produces("application/json")]
        public async Task<ActionResult<EssentialDashboardInfo>> GetEssentialDashboardInfo()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            return new EssentialDashboardInfo()
            {
                Name = user.Name
            };
        }
        [HttpPut("settings")]
        [Produces("application/json")]
        public async Task<ActionResult<SettingsInfo>> SetSettingsInfo([FromBody] SettingsInfo newSettings)
        {
            // TODO: Validate user settings
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);

            if (newSettings.DisplayName != null)
            {
                user.DisplayName = newSettings.DisplayName;
            }

            AccountRepository.Update(user.Id, user);
            return new OkResult();
        }
        [HttpGet("settings")]
        [Produces("application/json")]
        public async Task<ActionResult<SettingsInfo>> GetSettingsInfo()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            return new SettingsInfo()
            {
                DisplayName = user.DisplayName
            };
        }

        [HttpGet("tokens")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<Core.APIModels.SharedToken>>> GetTokens()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            return user.SharedTokens.Select(x => new Core.APIModels.SharedToken()
            {
                Token = x.Token
            }).ToList();
        }

        [HttpGet("repos")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<SharedRepository>>> GetRepos()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            var userAccess = new GithubUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.EncodedAccessToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var repos = await RepositoryService.GetUserInstallationRepositories(userAccess);

            IEnumerable<Task<SharedRepository>> result = repos.Select(async x =>
                new SharedRepository()
                {
                    Description = x.Description,
                    Owner = x.Owner.Login,
                    Provider = "github",
                    Repo = x.Name,
                    Branches = (await RepositoryService.GetBranches(x.Owner.Login, x.Name, userAccess))
                        .Value.Select(b =>
                            new Branch()
                            {
                                Name = b.Name,
                                Snapshot = false,
                                Sha = false
                            }).ToArray()
                }
            );
            return await Task.WhenAll(result);
        }
        [HttpPost("createtoken")]
        public async Task<ActionResult<Core.APIModels.SharedToken>> CreateToken([FromBody] CreateToken createToken)
        {
            if (createToken.Repositories.Length == 0)
            {
                return new BadRequestResult();
            }

            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            if (user.SharedTokens.Any(x => x.Stamp == createToken.Stamp))
            {
                return new BadRequestResult();
            }

            var userAccess = new GithubUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.EncodedAccessToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var repos = await RepositoryService.GetUserInstallationRepositories(userAccess);
            if (createToken.Repositories.Any(c => !repos.Any(r => c.Owner == r.Owner.Login && c.Repo == r.Name)))
            {
                return new ForbidResult();
            }

            using (RandomNumberGenerator rng = new RNGCryptoServiceProvider())
            {
                byte[] tokenData = new byte[64];
                rng.GetBytes(tokenData);

                // Get repositories available for user access token

                async Task<string> TranslateBranch(string owner, string repo, Branch b)
                {
                    if (b.Snapshot && !b.Sha)
                    {
                        var commits = await RepositoryService.GetCommits(owner, repo, b.Name, "", userAccess, 0, 1);
                        var latestCommit = commits.Value.First();
                        return latestCommit.Sha;
                    }
                    else
                    {
                        return b.Name;
                    }
                }

                var accessibleRepositories = createToken.Repositories.Select(async x => new Repository()
                {
                    Owner = x.Owner,
                    Provider = "github",
                    Repo = x.Repo,
                    Branches = await (Task.WhenAll(x.Branches.Select(async b => await TranslateBranch(x.Owner, x.Repo, b))))
                });

                var share = new Share()
                {
                    Token = new ShareGithub.Models.SharedToken()
                    {
                        Token = Base64UrlTextEncoder.Encode(tokenData),
                        SharingUserId = user.Id,
                        Stamp = null
                    },
                    AccessibleRepositories = await Task.WhenAll(accessibleRepositories)
                };

                user.SharedTokens.Add(new ShareGithub.Models.SharedToken()
                {
                    Token = share.Token.Token,
                    Stamp = createToken.Stamp
                });
                ShareRepository.Create(share);
                AccountRepository.Update(user.Id, user);

                return new Core.APIModels.SharedToken()
                {
                    Token = share.Token.Token,
                    DisplayName = user.DisplayName
                };
            }
        }
        [HttpPost("deletetoken/{token}")]
        public async Task<IActionResult> DeleteToken(string token)
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            if (user.SharedTokens.Any(x => x.Token == token))
            {
                user.SharedTokens.RemoveAll(x => x.Token == token);
                var share = ShareRepository.Find(x => x.Token.Token == token);
                if (share != null)
                    ShareRepository.Remove(share.Id);
                AccountRepository.Update(user.Id, user);
                return new OkResult();
            }
            else
            {
                return new BadRequestResult();
            }
        }
    }
}
