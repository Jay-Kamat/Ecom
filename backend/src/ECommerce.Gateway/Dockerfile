# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy solution and project files
COPY ECommerce.slnx ./
COPY src/ECommerce.Gateway/ECommerce.Gateway.csproj src/ECommerce.Gateway/

RUN dotnet restore src/ECommerce.Gateway/ECommerce.Gateway.csproj

# Copy source
COPY src/ECommerce.Gateway/ src/ECommerce.Gateway/

# Publish Gateway
RUN dotnet publish src/ECommerce.Gateway/ECommerce.Gateway.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ECommerce.Gateway.dll"]
