# Backend CORS Ayarları

Backend'de CORS ayarlarını yapmak için aşağıdaki adımları izleyin:

## .NET 6+ (Program.cs)

```csharp
var builder = WebApplication.CreateBuilder(args);

// ... diğer servisler ...

// CORS ayarları
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "http://127.0.0.1:3000"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

var app = builder.Build();

// ⚠️ ÖNEMLİ: UseCors, Authentication'dan ÖNCE olmalı!
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// ... diğer middleware'ler ...
```

## .NET Core 3.1 / 5.0 (Startup.cs)

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // ... diğer servisler ...

    services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend",
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:3000",
                        "http://127.0.0.1:3000"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
    });
}

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // ⚠️ ÖNEMLİ: UseCors, Authentication'dan ÖNCE olmalı!
    app.UseCors("AllowFrontend");

    app.UseAuthentication();
    app.UseAuthorization();

    // ... diğer middleware'ler ...
}
```

## Production için

Production ortamında frontend URL'ini ekleyin:

```csharp
policy
    .WithOrigins(
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://yourdomain.com"  // Production URL
    )
```

## Notlar

- `AllowCredentials()` cookie-based authentication için gerekli
- `AllowAnyHeader()` ve `AllowAnyMethod()` tüm header ve method'lara izin verir
- Middleware sırası çok önemli: `UseCors` mutlaka `UseAuthentication` ve `UseAuthorization`'dan önce olmalı
