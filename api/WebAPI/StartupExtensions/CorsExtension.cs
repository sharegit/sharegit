using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace WebAPI.StartupExtensions
{
    public static class CorsExtension
    {
        const string _allowShareGitFrontendOrigins = nameof(_allowShareGitFrontendOrigins);
        const string _allowDevOrigins = nameof(_allowDevOrigins);
        public static void SetupCors(this IServiceCollection services)
        {
            services.AddCors(o =>
            {
                o.AddPolicy(_allowShareGitFrontendOrigins,
                    builder => builder.WithOrigins("https://sharegit.com", "https://www.sharegit.com").AllowAnyHeader().AllowAnyMethod());
                o.AddPolicy(_allowDevOrigins,
                    builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
            });
        }
        public static void SetupCors(this IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseCors(_allowDevOrigins);
            }
            else
            {
                app.UseCors(_allowShareGitFrontendOrigins);
            }
        }
    }
}
