using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Settings;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace WebAPI.Authentication
{
    public class TokenAuthenticationSchemeOptions : AuthenticationSchemeOptions
    {
    }
    public class TokenAuthenticationHandler
        : AuthenticationHandler<TokenAuthenticationSchemeOptions>
    {

        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        public TokenAuthenticationHandler(
            IOptionsMonitor<TokenAuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
            : base(options, logger, encoder, clock)
        {
            ShareRepository = shareRepository;
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.ContainsKey("token"))
            {
                return Task.FromResult(AuthenticateResult.Fail("Token header Not Found."));
            }

            var token = Request.Headers["token"].ToString();

            var validatedToken = ShareRepository.Find(x => x.Token.Token == token);
            if (validatedToken != null)
            {
                var claims = new[]
                {
                    new Claim(ClaimTypes.Hash, token)
                };

                var claimsIdentity = new ClaimsIdentity(claims, nameof(TokenAuthenticationHandler));

                var ticket = new AuthenticationTicket(new ClaimsPrincipal(claimsIdentity), this.Scheme.Name);

                Context.Items.Add("access", validatedToken.AccessibleRepositories);

                return Task.FromResult(AuthenticateResult.Success(ticket));
            }
            else
            {
                return Task.FromResult(AuthenticateResult.Fail("Invalid token!"));
            }
        }
    }

}
