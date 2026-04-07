# Production Server Steps (Local and LAN)

This guide shows how to run the site in **production mode**.

## 1. Open terminal in project folder

```powershell
cd "D:\Tesda Project\CSM"
```

## 2. Build the app

```powershell
npm run build
```

Expected result: build completes without errors.

## 3. Start production server (local only)

```powershell
npx next start -p 3001
```

Open in browser:

```text
http://localhost:3001
```

## 4. Start production server for LAN (other devices)

Use this command so other devices on the same network can access it:

```powershell
npx next start -H 0.0.0.0 -p 3001
```

## 5. Allow firewall (first time only)

```powershell
netsh advfirewall firewall add rule name="CSM Next.js LAN 3001" dir=in action=allow protocol=TCP localport=3001
```

## 6. Get your LAN IP address

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1 IPAddress,InterfaceAlias
```

If your IP is `192.168.1.162`, then open from other devices:

```text
http://192.168.1.162:3001
```

## 7. Stop the server

In the terminal running Next.js, press:

```text
Ctrl + C
```

## Troubleshooting

### Port already in use

If you see `EADDRINUSE`, use another port:

```powershell
npx next start -H 0.0.0.0 -p 3002
```

Then use `:3002` in the URL.

### Other devices cannot connect

- Ensure both devices are on the same Wi-Fi/LAN.
- Keep this PC awake.
- Confirm firewall rule exists for the selected port.
- Some routers block device-to-device traffic (AP/client isolation).

## Quick command set (copy/paste)

```powershell
cd "D:\Tesda Project\CSM"
npm run build
npx next start -H 0.0.0.0 -p 3001
```
