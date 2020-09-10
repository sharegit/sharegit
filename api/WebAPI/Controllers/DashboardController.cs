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

        public DashboardController(IRepositoryServiceGithub repositoryServiceGH,
            IRepositoryServiceGitlab repositoryServiceGL,
            IRepositoryServiceBitbucket repositoryServiceBB,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            RepositoryServiceGH = repositoryServiceGH;
            RepositoryServiceGL = repositoryServiceGL;
            RepositoryServiceBB = repositoryServiceBB;

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
            List<ShareGit.Models.SharedToken> tokens = user.SharedTokens;
            var now = DateTime.UtcNow;
            var nowStr = $"{now.Year}-{now.Month:D2}-{now.Day:D2}";

            var reports = new List<Report>();

            const byte GOOGLE_MAX_BATCH = 5;
            var buffer = new ReportRequest[GOOGLE_MAX_BATCH];
            int i = 0;
            foreach(var token in tokens)
            {
                buffer[i % GOOGLE_MAX_BATCH] = new ReportRequest()
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
                    FiltersExpression = @$"ga:pagePath=@share/{token.Token}"
                };
                i += 1;

                if (i % GOOGLE_MAX_BATCH == 0)
                {
                    ReportsResource.BatchGetRequest request = reportsResource.BatchGet(new GetReportsRequest()
                    {
                        ReportRequests = buffer
                    });
                    GetReportsResponse result = await request.ExecuteAsync();
                    reports.AddRange(result.Reports);
                }
            }
            // If the last buffer was not full, send the remaining
            // note, the buffer is half garbage!
            if(i % GOOGLE_MAX_BATCH != 0)
            {
                ReportsResource.BatchGetRequest request = reportsResource.BatchGet(new GetReportsRequest()
                {
                    ReportRequests = buffer.Take(i % GOOGLE_MAX_BATCH).ToList()
                });
                GetReportsResponse result = await request.ExecuteAsync();
                reports.AddRange(result.Reports);
            }

            return new DashboardAnalyticsInfo()
            {
                Analytics = tokens.Zip(reports).Select(x => new DashboardAnalyticsInfo.Analytic()
                {
                    Token = x.First.Token,
                    UniquePageViews = int.Parse(x.Second.Data.Totals[0].Values[0]),
                    PageViews = int.Parse(x.Second.Data.Totals[0].Values[1]),
                }).ToArray()
            };
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


        [HttpGet("tokens")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<Core.APIModels.SharedToken>>> GetTokens()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);
            return user.SharedTokens.Select(x => new Core.APIModels.SharedToken()
            {
                Token = x.Token,
                CustomName = x.CustomName,
                ExpireDate = x.ExpireDate
            }).ToList();
        }

        [HttpGet("repos")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<SharedRepository>>> GetRepos()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            var githubAccess = user.GithubConnection == null ? null : new GithubUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.GithubConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var gitlabAccess = user.GitlabConnection == null ? null : new GitlabUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.GitlabConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var bitbucketAccess = user.BitbucketConnection == null ? null : new BitbucketUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.BitbucketConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                RefreshToken = JWT.Decode<string>(user.BitbucketConnection.EncodedRefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                AccessTokenExp = user.BitbucketConnection.AccessTokenExp,
                UserId = user.Id
            };

            var ghReposTask = user.GithubConnection == null ? null : RepositoryServiceGH.GetUserInstallationRepositories(githubAccess);
            var glProjectsTask = user.GitlabConnection == null ? null : RepositoryServiceGL.GetProjects(user.GitlabConnection.GitlabId, gitlabAccess);
            var bbRepositoriesTask = user.BitbucketConnection == null ? null : RepositoryServiceBB.GetRepositories(bitbucketAccess);

            var ghRepos = ghReposTask == null ? null : await ghReposTask;
            var glProjects = glProjectsTask == null ? null : await glProjectsTask;
            var bbRepositories = bbRepositoriesTask == null ? null : await bbRepositoriesTask;


            var sharedRepositoriesTask = new List<Task<SharedRepository>>();
            if(ghRepos != null)
                sharedRepositoriesTask.AddRange(ghRepos.Select(async x =>
                    new SharedRepository()
                    {
                        Id = x.Id,
                        Description = x.Description,
                        Owner = x.Owner.Login,
                        Provider = "github",
                        Repo = x.Name,
                        DownloadAllowed = false,
                        Branches = (await RepositoryServiceGH.GetBranches(x.Owner.Login, x.Name, githubAccess))
                            .Value.Select(b =>
                                new Branch()
                                {
                                    Name = b.Name,
                                    Snapshot = false,
                                    Sha = false
                                }).ToArray()
                    }
                ));
            if(glProjects != null)
                sharedRepositoriesTask.AddRange(glProjects.Value.Select(async x =>
                    new SharedRepository()
                    {
                        Id = x.Id,
                        Description = x.Description,
                        Owner = x.Namespace.Path,
                        Provider = "gitlab",
                        Repo = x.Path,
                        DownloadAllowed = false,
                        Branches = (await RepositoryServiceGL.GetBranches(x.Id, gitlabAccess))
                            .Value.Select(b =>
                                new Branch()
                                {
                                    Name = b.Name,
                                    Snapshot = false,
                                    Sha = false
                                }).ToArray()
                    }
                ));
            if (bbRepositories != null)
                sharedRepositoriesTask.AddRange(bbRepositories.Value.Values.Select(async x =>
                    new SharedRepository()
                    {
                        // Id = x.Id,
                        Description = x.Description,
                        Owner = x.Workspace.Slug,
                        Provider = "bitbucket",
                        Repo = x.Slug,
                        DownloadAllowed = false,
                        Branches = (await RepositoryServiceBB.GetBranches(x.Workspace.Slug, x.Slug, bitbucketAccess))
                            .Value.Values.Select(b =>
                                new Branch()
                                {
                                    Name = b.Name,
                                    Snapshot = false,
                                    Sha = false
                                }).ToArray()
                    }
                ));

            return await Task.WhenAll(sharedRepositoriesTask);
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
                Path = x.Path.TrimStart(new char[] { '.' , '/'}),
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
            var token = new ShareGit.Models.SharedToken()
            {
                Token = tokenStr,
                SharingUserId = user.Id,
                Stamp = createToken.Stamp,
                CustomName = createToken.CustomName,
                ExpireDate = createToken.ExpireDate,
            };
            var share = new Share()
            {
                Id = tokenStr,
                Token = token,
                AccessibleRepositories = await Task.WhenAll(accessibleRepositories)
            };

            user.SharedTokens.Add(token);
            await ShareRepository.CreateAsync(share);
            await AccountRepository.UpdateAsync(user.Id, user);

            return new Core.APIModels.SharedToken()
            {
                Token = share.Token.Token,
                CustomName = share.Token.CustomName,
                ExpireDate = share.Token.ExpireDate
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
