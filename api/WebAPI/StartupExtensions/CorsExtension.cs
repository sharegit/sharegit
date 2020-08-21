using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace WebAPI.StartupExtensions
{
    public static class CorsExtension
    {
        public static void SetupCors(this IServiceCollection services)
        {
            services.AddCors(o => o.AddPolicy("ANY", builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            }));
        }
        public static void SetupCors(this IApplicationBuilder app)
        {
            app.UseCors("ANY");
        }
    }
}
