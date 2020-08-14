using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
        public TokenAuthenticationHandler(
            IOptionsMonitor<TokenAuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock)
            : base(options, logger, encoder, clock)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.ContainsKey("token"))
            {
                return Task.FromResult(AuthenticateResult.Fail("Token header Not Found."));
            }

            var token = Request.Headers["token"].ToString();

            if (token == "563b952ec30fb6ebd48a598f4246ab0334cf70c90d93f48b1f410d814436438a")
            {
                var claims = new[]
                {
                    new Claim(ClaimTypes.Hash, token)
                };

                var claimsIdentity = new ClaimsIdentity(claims, nameof(TokenAuthenticationHandler));

                var ticket = new AuthenticationTicket(new ClaimsPrincipal(claimsIdentity), this.Scheme.Name);

                return Task.FromResult(AuthenticateResult.Success(ticket));
            }
            else
            {
                return Task.FromResult(AuthenticateResult.Fail("Invalid token!"));
            }
        }
    }

}
