using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Collections.Generic;

namespace WebAPI.StartupExtensions
{
    public static class SwaggerExtension
    {
        private static void AddSecurity(this SwaggerGenOptions c, string id)
        {
            c.AddSecurityDefinition(id,
                new OpenApiSecurityScheme
                {
                    In = ParameterLocation.Header,
                    Description = "Please enter a valid token",
                    Name = id,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = id
                });

            c.AddSecurityRequirement(
                new OpenApiSecurityRequirement()
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                            Type = ReferenceType.SecurityScheme,
                            Id = id
                            },
                            Scheme = id,
                            Name = id,
                            In = ParameterLocation.Header,
                        },
                        new List<string>()
                    }
                });
        }
        public static void SetupSwagger(this IServiceCollection services)
        {
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v0", new OpenApiInfo
                {
                    Version = "v0",
                    Title = "Share-Git API",
                    Description = "API for the Share-Git project"
                });
                c.AddSecurity("token");
                c.AddSecurity("jwt");
            });
        }
        public static void SetupSwagger(this IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseSwagger();
            }
        }
    }
}
