using Core.Util;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace WebAPI.Authentication
{
    public class JWTAuthenticationSchemeOptions : AuthenticationSchemeOptions
    {
    }
    public class JWTAuthenticationHandler
        : AuthenticationHandler<JWTAuthenticationSchemeOptions>
    {
        public JWTAuthenticationHandler(
            IOptionsMonitor<JWTAuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock)
            : base(options, logger, encoder, clock)
        {
        }
        
        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            try
            {
                var validatedJWT = GetAuthenticatedUserClaims(Request.Headers);
                if (validatedJWT != null)
                {
                    var id = validatedJWT["id"];
                    var claims = new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, id)
                    };

                    var claimsIdentity = new ClaimsIdentity(claims, nameof(JWTAuthenticationHandler));

                    var ticket = new AuthenticationTicket(new ClaimsPrincipal(claimsIdentity), this.Scheme.Name);
                    return AuthenticateResult.Success(ticket);
                }
            }
            catch
            {
            }
            return AuthenticateResult.Fail("Invalid JWT!");
        }
        public static Dictionary<string, string> GetAuthenticatedUserClaims(IHeaderDictionary headers)
        {
            if (!headers.ContainsKey("jwt"))
            {
                return null;
            }

            var jwt = headers["jwt"].ToString();

            var validatedJWT = JWT.Decode<Dictionary<string, string>>(jwt, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            return validatedJWT;
        }
    }

}
