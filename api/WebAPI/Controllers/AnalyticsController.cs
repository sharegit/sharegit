using Microsoft.AspNetCore.Mvc;
using ShareGit.Services.Google;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("an")]
    [ApiController]
    public class AnalyticsController : ControllerBase
    {
        private IMeasurementService MeasurementService { get; }
        public AnalyticsController(IMeasurementService measurementService)
        {
            MeasurementService = measurementService;
        }

        [HttpPost("hit")]
        public async Task<ActionResult> HitPage([FromQuery] string path, [FromQuery] string cid)
        {
            try
            {
                await MeasurementService.Hit(path, cid);
            }
            catch
            {
                // Eat exception, we don't care about it
            }
            return new OkResult();
        }
    }
}
