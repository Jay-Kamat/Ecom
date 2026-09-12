# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy solution and project files first for efficient caching
COPY ECommerce.slnx ./
COPY src/ECommerce.Shared/ECommerce.Shared.csproj src/ECommerce.Shared/
COPY src/ECommerce.Domain/ECommerce.Domain.csproj src/ECommerce.Domain/
COPY src/ECommerce.Application/ECommerce.Application.csproj src/ECommerce.Application/
COPY src/ECommerce.Infrastructure/ECommerce.Infrastructure.csproj src/ECommerce.Infrastructure/
COPY src/ECommerce.API/ECommerce.API.csproj src/ECommerce.API/
COPY src/ECommerce.Gateway/ECommerce.Gateway.csproj src/ECommerce.Gateway/

RUN dotnet restore src/ECommerce.API/ECommerce.API.csproj

# Copy all source files
COPY src/ src/

# Publish API
RUN dotnet publish src/ECommerce.API/ECommerce.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 5062
ENV ASPNETCORE_URLS=http://+:5062
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ECommerce.API.dll"]
