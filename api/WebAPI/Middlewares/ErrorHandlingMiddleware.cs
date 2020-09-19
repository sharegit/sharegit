using Core.Exceptions;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System;
using System.Net;
using System.Threading.Tasks;

namespace WebAPI.Middlewares
{
    /// <summary>All thrown (and uncaught) exceptions bubble here</summary>
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate next;

        /// <summary>Initializes the middleware, runs "before" requests, next ecapsulates the request</summary>
        public ErrorHandlingMiddleware(RequestDelegate next)
        {
            this.next = next;
        }

        /// <summary>Invokes with the given context, this calls the custom exception handling logic</summary>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (Exception ex)
            {
                try
                {
                    await HandleExceptionAsync(context, ex);
                }
                catch (InvalidOperationException)
                {
                    Console.WriteLine("[ERROR]: Response has probably already started, make sure you don't throw exception inside a response. (e.g.: Don't use a lazy IEnumerable inside a returning Ok(...)!)");
                }
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var code = exception switch {
                NotFoundException _ => HttpStatusCode.NotFound,
                _ => HttpStatusCode.InternalServerError
            };

            var errorMessage = new
            {
                errors = new Object[] { exception.Message }
#if DEBUG
                ,
                stackTrace = exception.StackTrace.ToString(),
                innerException = exception.InnerException?.Message
#endif
            };
            var result = JsonConvert.SerializeObject(errorMessage);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)code;
            return context.Response.WriteAsync(result);
        }
    }
}
