using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using ShareGithub;
using System;
using System.Reflection;
using System.IO;
using WebAPI.Authentication;
using Microsoft.Extensions.Options;
using ShareGithub.Repositories;
using ShareGithub.Services;
using ShareGithub.Settings;

namespace WebAPI
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddTransient<IRepositoryService, RepositoryService>();
            services.AddTransient<IAccountService, AccountService>();

            services.AddCors(o => o.AddPolicy("ANY", builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            }));

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v0", new OpenApiInfo
                {
                    Version = "v0",
                    Title = "Share-Github API",
                    Description = "API for the Share-Github project"
                });
                c.AddSecurityDefinition("token",
                new OpenApiSecurityScheme
                {
                    In = ParameterLocation.Header,
                    Description = "Please enter a valid token",
                    Name = "token",
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "token"
                });
                c.AddSecurityRequirement(new OpenApiSecurityRequirement()
                  {
                    {
                      new OpenApiSecurityScheme
                      {
                        Reference = new OpenApiReference
                          {
                            Type = ReferenceType.SecurityScheme,
                            Id = "token"
                          },
                          Scheme = "token",
                          Name = "token",
                          In = ParameterLocation.Header,

                        },
                        new System.Collections.Generic.List<string>()
                      }
                    });
            });

            services.AddAuthentication(options =>
            {
                options.DefaultScheme = "token";
            })
                .AddScheme<TokenAuthenticationSchemeOptions, TokenAuthenticationHandler>("token", op => { })
                .AddScheme<JWTAuthenticationSchemeOptions, JWTAuthenticationHandler>("jwt", op => { });

            services.Configure<AccountDatabaseSettings>(Configuration.GetSection(nameof(AccountDatabaseSettings)));
            services.Configure<ShareDatabaseSettings>(Configuration.GetSection(nameof(ShareDatabaseSettings)));
            services.Configure<GithubAppSettings>(Configuration.GetSection(nameof(GithubAppSettings)));

            services.AddTransient(typeof(IRepository<,>), typeof(RepositoryBase<,>));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseSwagger();
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v0/swagger.json", "Share-Github API v0");
                c.RoutePrefix = string.Empty;
            });

            app.UseCors("ANY");

            app.UseHttpsRedirection();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
