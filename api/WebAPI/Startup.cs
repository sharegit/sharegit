using Core.APIModels;
using Core.APIModels.Settings;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WebAPI.Middlewares;
using WebAPI.StartupExtensions;

namespace WebAPI
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddRazorPages();

            services.AddControllers()
                    .AddFluentValidation(fv => {
                        fv.RegisterValidatorsFromAssemblyContaining<AccountSettings>();
                        fv.RegisterValidatorsFromAssemblyContaining<CreateToken>();
                        });

            services.SetupServices(Configuration);

            services.SetupCors();

            services.SetupAuth();

            services.SetupSwagger();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v0/swagger.json", "Share-Git API v0");
                c.RoutePrefix = string.Empty;
            });

            app.SetupSwagger(env);

            app.SetupCors(env);

            app.UseMiddleware<ErrorHandlingMiddleware>();

            app.UseRouting();

            app.SetupAuth();

            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            });

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
