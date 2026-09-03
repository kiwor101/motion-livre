# Ambiente de desenvolvimento validado

Atualizado em 03/09/2026.

## Instalado

- Rust `1.98.1`, Cargo `1.98.1` e Rustup, toolchain `stable-x86_64-pc-windows-msvc`.
- Visual Studio Community 2022 `17.14` com MSVC `14.44`.
- Windows SDK `10.0.26100.0` e WebView2 `152`.
- FFmpeg/FFprobe build `N-126390-g9fc8c785e2-20260903`.
- CMake `4.4.3`.
- Ninja `1.13.2`.
- Node.js `24.19.0`, pnpm `11.19.0` e Git `2.53.0`.
- Tauri CLI `2.11.4` e Tauri API `2.11.1` no projeto.
- Electron `37.10.3` e electron-builder `26.15.3`.

## Caminhos

- Rust/Cargo: `%USERPROFILE%\.cargo\bin`
- FFmpeg: `C:\Users\Ti\Tools\ffmpeg`
- CMake: `C:\Users\Ti\Tools\cmake\bin`
- Ninja: `C:\Users\Ti\Tools\ninja`

Essas pastas foram adicionadas ao `PATH` do usuário. Terminais que já estavam abertos precisam ser reiniciados para herdar o novo `PATH`.

## Pendente apenas quando necessário

- Certificado comercial para assinatura reconhecida pelo Windows SmartScreen.
- Python para scripts auxiliares específicos; não é requisito do Tauri ou do motor principal.
- Verificação prática de WebGPU na GPU da máquina.
