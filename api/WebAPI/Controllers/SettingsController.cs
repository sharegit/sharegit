using Core.APIModels;
using Core.APIModels.Settings;
using Core.Model.Github;
using Core.Util;
using EmailTemplates;
using EmailTemplates.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using ShareGit;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Services;
using ShareGit.Settings;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "jwt")]
    public class SettingsController : ControllerBase
    {

        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        private IAccountServiceGithub AccountServiceGH { get; }
        private IRepositoryServiceGithub RepositoryServiceGH { get; }
        private IEmailService EmailService { get; }
        private IRazorStringRenderer RazorViewToStringRenderer { get; }
        private ShareGitCommonSettings ShareGitCommonSettings { get; }

        public SettingsController(IRepositoryServiceGithub repositoryServiceGH,
            IAccountServiceGithub accountServiceGH,
            IRazorStringRenderer razorViewToStringRenderer,
            IEmailService emailService,
            IOptions<ShareGitCommonSettings> shareGitCommonSettings,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            RepositoryServiceGH = repositoryServiceGH;
            AccountServiceGH = accountServiceGH;

            EmailService = emailService;

            ShareGitCommonSettings = shareGitCommonSettings.Value;
            RazorViewToStringRenderer = razorViewToStringRenderer;

            AccountRepository = accountRepository;
            ShareRepository = shareRepository;
        }

        [HttpPut("public")]
        [Produces("application/json")]
        public async Task<ActionResult> SetPublicProfileSettings([FromBody] PublicProfileSettings newSettings)
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (newSettings.DisplayName != null)
                user.DisplayName = newSettings.DisplayName;

            if (newSettings.Bio != null)
                user.Bio = newSettings.Bio;

            if (newSettings.Url != null)
                user.Url = newSettings.Url;

            await AccountRepository.UpdateAsync(user.Id, user);
            return new OkResult();
        }

        [HttpGet("public")]
        [Produces("application/json")]
        public async Task<ActionResult<PublicProfileSettings>> GetPublicProfileSettings()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);
            return new PublicProfileSettings()
            {
                DisplayName = user.DisplayName,
                Url = user.Url,
                Bio = user.Bio
            };
        }

        [HttpPut("account")]
        [Produces("application/json")]
        public async Task<ActionResult> SetAccountSettings([FromBody] AccountSettings newSettings)
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (newSettings.Email != null)
                user.Email = newSettings.Email;

            await AccountRepository.UpdateAsync(user.Id, user);
            return new OkResult();
        }

        [HttpGet("account")]
        [Produces("application/json")]
        public async Task<ActionResult<AccountSettings>> GetAccountSettings()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);
            return new AccountSettings()
            {
                Email = user.Email
            };
        }

        [HttpGet("connections")]
        [Produces("application/json")]
        public async Task<ActionResult<ConnectedServices>> GetConnectionsInfo()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);
            return new ConnectedServices()
            {
                GithubLogin = user.GithubConnection?.Login,
                GitlabLogin = user.GitlabConnection?.Login,
                BitbucketLogin = user.BitbucketConnection?.Username,
            };
        }

        [HttpGet("githubinstallations")]
        [Produces("application/json")]
        public async Task<ActionResult<GithubInstallations>> GetGithubInstallations()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (user.GithubConnection == null)
            {
                return new GithubInstallations();
            }

            var userAccess = new GithubUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.GithubConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var installations = await RepositoryServiceGH.GetUserInstallations(userAccess);
            var orgsResponse = await AccountServiceGH.GetUserOrganizations(userAccess);
            var orgs = orgsResponse.Value.ToDictionary(x => x.Organization.Login, x => x);
            return new GithubInstallations()
            {
                Installations = installations.Value.Values.Select(x =>
                new GithubInstallations.GithubInstallation()
                {
                    Login = x.Account.Login,
                    Implicit = x.Account.Type == "User" && x.Account.Login != user.GithubConnection.Login
                        || x.Account.Type == "Organization"
                            && (!orgs.ContainsKey(x.Account.Login) || orgs[x.Account.Login].Role != "admin")
                }).ToArray()
            };
        }

        [HttpDelete("connection/github")]
        public async Task<ActionResult> DeleteGithubConnection()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (user.GithubConnection == null || (user.GitlabConnection == null && user.BitbucketConnection == null))
                return new BadRequestResult();

            var userAccess = new GithubUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.GithubConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };

            var installations = await RepositoryServiceGH.GetUserInstallations(userAccess);
            foreach (var installation in installations.Value.Values)
            {
                var id = installation.Id;
                await RepositoryServiceGH.RemoveUserInstalation(id);
            }

            user.GithubConnection = null;
            await AccountRepository.UpdateAsync(user.Id, user);
            return new OkResult();
        }

        [HttpDelete("connection/gitlab")]
        public async Task<ActionResult> DeleteGitlabConnection()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (user.GitlabConnection == null || (user.GithubConnection == null && user.BitbucketConnection == null))
                return new BadRequestResult();

            user.GitlabConnection = null;
            await AccountRepository.UpdateAsync(user.Id, user);
            return new OkResult();
        }

        [HttpDelete("connection/bitbucket")]
        public async Task<ActionResult> DeleteBitbucketConnection()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = await AccountRepository.GetAsync(userId.Value);

            if (user.BitbucketConnection == null || (user.GithubConnection == null && user.GitlabConnection== null))
                return new BadRequestResult();

            user.BitbucketConnection = null;
            await AccountRepository.UpdateAsync(user.Id, user);
            return new OkResult();
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
                    foreach (var installation in installations.Value.Values)
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
    }
}
