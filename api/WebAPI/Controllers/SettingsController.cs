using Core.APIModels;
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
        private IRepositoryServiceGithub RepositoryServiceGH { get; }
        private IEmailService EmailService { get; }
        private IRazorStringRenderer RazorViewToStringRenderer { get; }
        private ShareGitCommonSettings ShareGitCommonSettings { get; }

        public SettingsController(IRepositoryServiceGithub repositoryServiceGH,
            IRazorStringRenderer razorViewToStringRenderer,
            IEmailService emailService,
            IOptions<ShareGitCommonSettings> shareGitCommonSettings,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            RepositoryServiceGH = repositoryServiceGH;

            EmailService = emailService;

            ShareGitCommonSettings = shareGitCommonSettings.Value;
            RazorViewToStringRenderer = razorViewToStringRenderer;

            AccountRepository = accountRepository;
            ShareRepository = shareRepository;
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

            if (newSettings.Bio != null)
                user.Bio = newSettings.Bio;

            if (newSettings.Url != null)
                user.Url = newSettings.Url;

            await AccountRepository.UpdateAsync(user.Id, user);
            return new OkResult();
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
            return new GithubInstallations()
            {
                Installations = installations.Value.Installations.Select(x =>
                new GithubInstallations.GithubInstallation()
                {
                    Login = x.Account.Login
                }).ToArray()
            };
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
                Url = user.Url,
                Bio = user.Bio,
                GithubConnected = user.GithubConnection != null,
                GitLabConnected = user.GitlabConnection != null,
                BitbucketConnected = user.BitbucketConnection != null,
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
    }
}
