using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using WebAPI.Authentication;

namespace WebAPI.StartupExtensions
{
    public static class SetupAuthExtension
    {
        public static void SetupAuth(this IServiceCollection services)
        {
            services.AddAuthentication(options =>
            {
                options.DefaultScheme = "token";
            })
                .AddScheme<TokenAuthenticationSchemeOptions, TokenAuthenticationHandler>("token", op => { })
                .AddScheme<JWTAuthenticationSchemeOptions, JWTAuthenticationHandler>("jwt", op => { });
        }
        public static void SetupAuth(this IApplicationBuilder app)
        {
            app.UseAuthorization();
        }
    }
}
