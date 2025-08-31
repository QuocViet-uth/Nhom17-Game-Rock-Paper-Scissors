using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using RPS.Server.Hubs;
using RPS.Server.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();
builder.Services.AddSingleton<GameManager>();

var app = builder.Build();

app.UseCors();
app.MapHub<GameHub>("/gamehub");
app.Run();
