﻿using Core.APIModels;
using Core.Model.Bitbucket;
using Core.Model.Github;
using Core.Model.GitLab;
using Core.Util;
using EmailTemplates;
using EmailTemplates.ViewModels;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ShareGithub;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Services;
using ShareGithub.Settings;
using System;
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
        private IRepositoryServiceGithub RepositoryServiceGH { get; }
        private IRepositoryServiceGitlab RepositoryServiceGL { get; }
        private IRepositoryServiceBitbucket RepositoryServiceBB { get; }
        private IRazorStringRenderer RazorViewToStringRenderer { get; }
        private ShareGitCommonSettings ShareGitCommonSettings { get; }
        private IEmailService EmailService { get; }

        public DashboardController(IRepositoryServiceGithub repositoryServiceGH,
            IRepositoryServiceGitlab repositoryServiceGL,
            IRepositoryServiceBitbucket repositoryServiceBB,
            IRazorStringRenderer razorViewToStringRenderer,
            IEmailService emailService,
            IOptions<ShareGitCommonSettings> shareGitCommonSettings,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            RepositoryServiceGH = repositoryServiceGH;
            RepositoryServiceGL = repositoryServiceGL;
            RepositoryServiceBB = repositoryServiceBB;

            EmailService = emailService;

            ShareGitCommonSettings = shareGitCommonSettings.Value;
            RazorViewToStringRenderer = razorViewToStringRenderer;

            AccountRepository = accountRepository;
            ShareRepository = shareRepository;
        }

        [HttpPut()]
        public async Task<ActionResult> StartDeleteRegistrationProcess()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);

            using RandomNumberGenerator rng = new RNGCryptoServiceProvider();
            byte[] tokenData = new byte[64];
            rng.GetBytes(tokenData);
            var requestedDeletionToken = Base64UrlTextEncoder.Encode(tokenData);

            user.RequestedDeletionToken = requestedDeletionToken;
            AccountRepository.Update(user.Id, user);

            var body = await RazorViewToStringRenderer.RenderAsync<object>("/Views/Emails/Confirmation/ConfirmationHtml.cshtml", new ConfirmationViewModel()
            {
                PreHeader = "Confirm account deletion!",
                Title = "Account deletion",
                Hero = "Account deletion",
                Greeting = $"Dear {user.DisplayName},",
                Intro = "You requested us to delete all of your personal information from our services. This means that we will vipe all shared repository informations and all of your personal information from our services. Please note that you will have to manually disconnect any OAuth providers from Github, Gitlab or Bitbucket. This also means that the tokens you shared will become invalid as soon as your account information is removed. We ask you to confirm by clicking on the button down below.",
                SiteBaseUrl = ShareGitCommonSettings.SiteUrl,
                Cheers = "Kind Regards, ",
                ShareGitTeam = "ShareGit Team",
                EmailDisclaimer = "If you did not request the account deletion please ignore this email.",
                BadButton = "If the button does not work please copy and past this link into your browser.",
                Button = new EmailButtonViewModel()
                {
                    Text = "Delete my account!",
                    Url = $"{ShareGitCommonSettings.SiteUrl}/dashboard/confirmaccountdeletion/${requestedDeletionToken}"
                }
            });
            await EmailService.SendMailAsync(user.DisplayName, user.Email, "Account Deletion", body);
            return new OkResult();
        }

        [HttpDelete("{token}")]
        public async Task<ActionResult> DeleteRegistration(string token)
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            if (user.RequestedDeletionToken == token)
            {
                user.SharedTokens.ForEach(x =>
                {
                    var entry = ShareRepository.Find(x => x.Token == x.Token);
                    ShareRepository.Remove(entry.Id);
                });
                AccountRepository.Remove(user.Id);
                return new OkResult();
            }
            else
            {
                return new ForbidResult("jwt");
            }
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
                user.DisplayName = newSettings.DisplayName;

            if (newSettings.Email != null)
                user.Email = newSettings.Email;

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
                DisplayName = user.DisplayName,
                Email = user.Email,
                GithubConnected = user.GithubConnection != null,
                GitLabConnected = user.GitlabConnection != null,
                BitbucketConnected = user.BitbucketConnection != null,
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

            List<SharedRepository> sharedRepositories = new List<SharedRepository>();
            {
                var github = user.GithubConnection;
                if (github != null)
                {
                    var userAccess = new GithubUserAccess()
                    {
                        AccessToken = JWT.Decode<string>(github.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                        UserId = user.Id
                    };
                    var repos = await RepositoryServiceGH.GetUserInstallationRepositories(userAccess);

                    IEnumerable<Task<SharedRepository>> result = repos.Select(async x =>
                        new SharedRepository()
                        {
                            Id = x.Id,
                            Description = x.Description,
                            Owner = x.Owner.Login,
                            Provider = "github",
                            Repo = x.Name,
                            Branches = (await RepositoryServiceGH.GetBranches(x.Owner.Login, x.Name, userAccess))
                                .Value.Select(b =>
                                    new Branch()
                                    {
                                        Name = b.Name,
                                        Snapshot = false,
                                        Sha = false
                                    }).ToArray()
                        }
                    );
                    sharedRepositories.AddRange(await Task.WhenAll(result));
                }
            }
            {

                var gitlab = user.GitlabConnection;
                if (gitlab != null)
                {
                    var userAccess = new GitlabUserAccess()
                    {
                        AccessToken = JWT.Decode<string>(gitlab.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                        UserId = user.Id
                    };
                    var projects = await RepositoryServiceGL.GetProjects(gitlab.GitlabId, userAccess);
                    IEnumerable<Task<SharedRepository>> result = projects.Value.Select(async x =>
                        new SharedRepository()
                        {
                            Id = x.Id,
                            Description = x.Description,
                            Owner = x.Namespace.Path,
                            Provider = "gitlab",
                            Repo = x.Path,
                            Branches = (await RepositoryServiceGL.GetBranches(x.Id, userAccess))
                                .Value.Select(b =>
                                    new Branch()
                                    {
                                        Name = b.Name,
                                        Snapshot = false,
                                        Sha = false
                                    }).ToArray()
                        }
                    );
                    sharedRepositories.AddRange(await Task.WhenAll(result));
                }
            }
            {
                var bitbucket = user.BitbucketConnection;
                if (bitbucket != null)
                {
                    var userAccess = new BitbucketUserAccess()
                    {
                        AccessToken = JWT.Decode<string>(bitbucket.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                        RefreshToken = JWT.Decode<string>(bitbucket.EncodedRefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                        AccessTokenExp = bitbucket.AccessTokenExp,
                        UserId = user.Id
                    };
                    var repositories = await RepositoryServiceBB.GetRepositories(userAccess);
                    IEnumerable<Task<SharedRepository>> result = repositories.Value.Values.Select(async x =>
                        new SharedRepository()
                        {
                            // Id = x.Id,
                            Description = x.Description,
                            Owner = x.Workspace.Slug,
                            Provider = "bitbucket",
                            Repo = x.Slug,
                            Branches = (await RepositoryServiceBB.GetBranches(x.Workspace.Slug, x.Slug, userAccess))
                                .Value.Values.Select(b =>
                                    new Branch()
                                    {
                                        Name = b.Name,
                                        Snapshot = false,
                                        Sha = false
                                    }).ToArray()
                        }
                    );
                    sharedRepositories.AddRange(await Task.WhenAll(result));
                }
            }

            return sharedRepositories;
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

            var github = user.GithubConnection;
            var gitlab = user.GitlabConnection;
            var bitbucket = user.BitbucketConnection;
            var githubUserAccess = github == null ? null : new GithubUserAccess()
            {
                AccessToken = JWT.Decode<string>(github.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var gitlabUserAccess = gitlab == null ? null : new GitlabUserAccess()
            {
                AccessToken = JWT.Decode<string>(gitlab.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var bitbucketuserAccess = bitbucket == null ? null : new BitbucketUserAccess()
            {
                AccessToken = JWT.Decode<string>(bitbucket.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                RefreshToken = JWT.Decode<string>(bitbucket.EncodedRefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                AccessTokenExp = bitbucket.AccessTokenExp,
                UserId = user.Id
            };
            var githubRepos = github == null ? new GithubRepository[0] : await RepositoryServiceGH.GetUserInstallationRepositories(githubUserAccess);
            var gitlabRepos = gitlab == null ? new GitlabProject[0] : (await RepositoryServiceGL.GetProjects(user.GitlabConnection.GitlabId, gitlabUserAccess)).Value;
            var bitbucketRepos = bitbucket == null ? new BitbucketRepository[0] : (await RepositoryServiceBB.GetRepositories(bitbucketuserAccess)).Value.Values;
            if (createToken.Repositories.Any(c => !githubRepos.Any(r => c.Provider == "github" && c.Owner == r.Owner.Login && c.Repo == r.Name)
                                                && !gitlabRepos.Any(r => c.Provider == "gitlab" && c.Id == r.Id)
                                                && !bitbucketRepos.Any(r => c.Provider == "bitbucket" && c.Owner == r.Workspace.Slug && c.Repo == r.Slug)))
            {
                return new ForbidResult();
            }

            async Task<string[]> TranslateBranches(CreateToken.Repository repository)
            {
                switch (repository.Provider)
                {
                    case "github":
                        var brDicGH = (await RepositoryServiceGH.GetBranches(repository.Owner, repository.Repo, githubUserAccess)).Value.ToDictionary(x => x.Name, x => x);

                        return repository.Branches.Select(b =>
                        {
                            if (!b.Snapshot || b.Sha)
                                return b.Name;
                            else
                                return brDicGH[b.Name].Commit.Sha;
                        }).ToArray();
                    case "gitlab":
                        var brDicGL = (await RepositoryServiceGL.GetBranches(repository.Id, gitlabUserAccess)).Value.ToDictionary(x => x.Name, x => x);

                        return repository.Branches.Select(b =>
                        {
                            if (!b.Snapshot || b.Sha)
                                return b.Name;
                            else
                                return brDicGL[b.Name].Commit.Id;
                        }).ToArray();
                    case "bitbucket":
                        var brDicBB = (await RepositoryServiceBB.GetBranches(repository.Owner, repository.Repo, bitbucketuserAccess)).Value.Values.ToDictionary(x => x.Name, x => x);

                        return repository.Branches.Select(b =>
                        {
                            if (!b.Snapshot || b.Sha)
                                return b.Name;
                            else
                                return brDicBB[b.Name].Target.Hash;
                        }).ToArray();
                    default:
                        throw new ArgumentException("Invalid argument: provider: [" + repository.Provider + "]");
                }
            }

            var accessibleRepositories = createToken.Repositories.Select(async x => new Repository()
            {
                RepoId = x.Id,
                Owner = x.Owner,
                Provider = x.Provider,
                Repo = x.Repo,
                Branches = await TranslateBranches(x)
            });

            using RandomNumberGenerator rng = new RNGCryptoServiceProvider();
            byte[] tokenData = new byte[64];
            rng.GetBytes(tokenData);
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
