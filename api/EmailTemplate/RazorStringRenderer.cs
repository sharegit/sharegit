using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Routing;
using System;
using System.IO;
using System.Threading.Tasks;

namespace EmailTemplates
{
    public class RazorStringRenderer : IRazorStringRenderer
    {
        private readonly IServiceProvider serviceProvider;
        private readonly IRazorViewEngine viewEngine;
        private readonly ITempDataProvider tempDataProvider;

        public RazorStringRenderer(IServiceProvider serviceProvider,
            IRazorViewEngine viewEngine,
            ITempDataProvider tempDataProvider)
        {
            this.serviceProvider = serviceProvider;
            this.viewEngine = viewEngine;
            this.tempDataProvider = tempDataProvider;
        }

        public async Task<string> RenderAsync<T>(string viewPath, T model)
        {
            var httpContext = new DefaultHttpContext()
            {
                RequestServices = serviceProvider
            };
            var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor(), new ModelStateDictionary());

            using var output = new StringWriter();

            var view = viewEngine.GetView(null, viewPath, true).View;
            var viewDataDictionary = new ViewDataDictionary<T>(new EmptyModelMetadataProvider(), new ModelStateDictionary())
            {
                Model = model
            };
            var tempDataDictionary = new TempDataDictionary(actionContext.HttpContext, tempDataProvider);
            var viewContext = new ViewContext(actionContext, view, viewDataDictionary, tempDataDictionary, output, new HtmlHelperOptions());

            await view.RenderAsync(viewContext);

            return output.ToString();
        }
    }
}