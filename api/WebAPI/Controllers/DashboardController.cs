using Core.APIModels;
using Core.Model.Bitbucket;
using Core.Model.Github;
using Core.Model.GitLab;
using Core.Util;
using EmailTemplates;
using EmailTemplates.ViewModels;
using Google.Apis.AnalyticsReporting.v4;
using Google.Apis.AnalyticsReporting.v4.Data;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ShareGit;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Services;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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

        [HttpGet("analytics")]
        public async Task<ActionResult<DashboardAnalyticsInfo>> GetAnalytics()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (!user.SharedTokens.Any())
                return new DashboardAnalyticsInfo();

            // Create the service.
            string[] scopes = new string[] { AnalyticsReportingService.Scope.Analytics };

            GoogleCredential credential;
            using (var stream = new FileStream(RollingEnv.Get("SHARE_GIT_GOOGLE_ANALYTICS_KEY_LOC"), FileMode.Open, FileAccess.Read))
            {
                credential = GoogleCredential.FromStream(stream)
                     .CreateScoped(scopes);
            }

            // Create the  Analytics service.
            var service = new AnalyticsReportingService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = "ShareGit",
            });

            // Run the request.
            var reportsResource = new ReportsResource(service);
            var tokens = user.SharedTokens;
            var now = DateTime.UtcNow;
            var nowStr = $"{now.Year}-{now.Month:D2}-{now.Day:D2}";
            ReportsResource.BatchGetRequest a = reportsResource.BatchGet(new GetReportsRequest()
            {
                ReportRequests = tokens.Select(x =>
                    new ReportRequest()
                    {
                        ViewId = "227818537",
                        DateRanges = new List<DateRange>() {
                            new DateRange()
                            {
                                StartDate = "2005-01-01",
                                EndDate = nowStr
                            }
                        },
                        Metrics = new List<Metric>()
                        {
                            // https://ga-dev-tools.appspot.com/dimensions-metrics-explorer/
                            new Metric() { Expression = "ga:uniquePageViews" },
                            new Metric() { Expression = "ga:pageViews" }
                        },
                        // https://developers.google.com/analytics/devguides/reporting/core/v3/reference#filterSyntax
                        // https://ga-dev-tools.appspot.com/dimensions-metrics-explorer/
                        FiltersExpression = @$"ga:pagePath=@share/{x.Token}"
                    }).ToList()
            });
            GetReportsResponse result = await a.ExecuteAsync();

            return new DashboardAnalyticsInfo()
            {
                Analytics = tokens.Zip(result.Reports).Select(x => new DashboardAnalyticsInfo.Analytic()
                {
                    Token = x.First.Token,
                    UniquePageViews = int.Parse(x.Second.Data.Totals[0].Values[0]),
                    PageViews = int.Parse(x.Second.Data.Totals[0].Values[1]),
                }).ToArray()
            };
        }

        [HttpPut()]
        public async Task<ActionResult> StartDeleteRegistrationProcess()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            using RandomNumberGenerator rng = new RNGCryptoServiceProvider();
            byte[] tokenData = new byte[64];
            rng.GetBytes(tokenData);
            var requestedDeletionToken = Base64UrlTextEncoder.Encode(tokenData);

            user.RequestedDeletionToken = requestedDeletionToken;
            await AccountRepository.UpdateAsync(user.Id, user);

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
                    Url = $"{ShareGitCommonSettings.SiteUrl}/dashboard/confirmaccountdeletion/{requestedDeletionToken}"
                }
            });
            await EmailService.SendMailAsync(user.DisplayName, user.Email, "Account Deletion", body);
            return new OkResult();
        }

        [HttpDelete("{token}")]
        public async Task<ActionResult> DeleteRegistration(string token)
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (user.RequestedDeletionToken == token)
            {
                if (user.GithubConnection != null)
                {
                    var userAccess = new GithubUserAccess()
                    {
                        AccessToken = JWT.Decode<string>(user.GithubConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                        UserId = user.Id
                    };

                    var installations = await RepositoryServiceGH.GetUserInstallations(userAccess);
                    foreach (var installation in installations.Value.Installations)
                    {
                        var id = installation.Id;
                        await RepositoryServiceGH.RemoveUserInstalation(id);
                    }
                }

                await Task.WhenAll(user.SharedTokens.Select(async x =>
                {
                    var entry = ShareRepository.Find(x => x.Token == x.Token);
                    await ShareRepository.RemoveAsync(entry.Id);
                }));
                await AccountRepository.RemoveAsync(user.Id);
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
            var user = await AccountRepository.GetAsync(userId.Value);
            return new EssentialDashboardInfo()
            {
                Name = user.DisplayName
            };
        }
        [HttpPut("settings")]
        [Produces("application/json")]
        public async Task<ActionResult<SettingsInfo>> SetSettingsInfo([FromBody] SettingsInfo newSettings)
        {
            // TODO: Validate user settings
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (newSettings.DisplayName != null)
                user.DisplayName = newSettings.DisplayName;

            if (newSettings.Email != null)
                user.Email = newSettings.Email;

            await AccountRepository.UpdateAsync(user.Id, user);
            return new OkResult();
        }
        [HttpGet("settings")]
        [Produces("application/json")]
        public async Task<ActionResult<SettingsInfo>> GetSettingsInfo()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);
            return new SettingsInfo()
            {
                Name = user.Name,
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
            var user = await AccountRepository.GetAsync(userId.Value);
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
            var user = await AccountRepository.GetAsync(userId.Value);

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
                            DownloadAllowed = false,
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
                            DownloadAllowed = false,
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
                            DownloadAllowed = false,
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
            if (createToken.Repositories.Any(x => x.Provider != "github" && x.DownloadAllowed))
            {
                // Non-github providers dont get downloads
                return new BadRequestResult();
            }

            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);
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
                DownloadAllowed = x.DownloadAllowed,
                Branches = await TranslateBranches(x)
            });

            using RandomNumberGenerator rng = new RNGCryptoServiceProvider();
            byte[] tokenData = new byte[64];
            byte[] rngBytes = new byte[12];
            rng.GetBytes(rngBytes);
            byte[] timeStamp = Encoding.ASCII.GetBytes(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString("D20"));
            HashAlgorithm sha = SHA256.Create();
            byte[] result = sha.ComputeHash(Encoding.ASCII.GetBytes(user.Id));

            Buffer.BlockCopy(rngBytes, 0, tokenData, 0, 12);
            Buffer.BlockCopy(timeStamp, 0, tokenData, 12, 20);
            Buffer.BlockCopy(result, 0, tokenData, 32, 32);

            var tokenStr = Base64UrlTextEncoder.Encode(tokenData);
            var share = new Share()
            {
                Id = tokenStr,
                Token = new ShareGit.Models.SharedToken()
                {
                    Token = tokenStr,
                    SharingUserId = user.Id,
                    Stamp = null
                },
                AccessibleRepositories = await Task.WhenAll(accessibleRepositories)
            };

            user.SharedTokens.Add(new ShareGit.Models.SharedToken()
            {
                Token = share.Token.Token,
                Stamp = createToken.Stamp
            });
            await ShareRepository.CreateAsync(share);
            await AccountRepository.UpdateAsync(user.Id, user);

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
            var user = await AccountRepository.GetAsync(userId.Value);
            if (user.SharedTokens.Any(x => x.Token == token))
            {
                user.SharedTokens.RemoveAll(x => x.Token == token);
                var share = await ShareRepository.GetAsync(token);
                if (share != null)
                    await ShareRepository.RemoveAsync(share.Id);
                await AccountRepository.UpdateAsync(user.Id, user);
                return new OkResult();
            }
            else
            {
                return new BadRequestResult();
            }
        }
    }
}
