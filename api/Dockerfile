FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS builder

WORKDIR /app

COPY . .

WORKDIR /app/WebAPI

RUN if [ "x$ASPNETCORE_ENVIRONMENT" = "Release" ] ; then dotnet publish -c Release -o /apps/sharegit/api ; else dotnet publish -c Debug -o /apps/sharegit/api ; fi

FROM mcr.microsoft.com/dotnet/core/aspnet:3.1

WORKDIR /app

COPY --from=builder /apps/sharegit/api .

CMD ["dotnet", "WebAPI.dll"]