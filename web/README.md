# Svar Kiosk - webversion (gratis hosting)

Dette er en browser-baseret udgave af Svar Kiosk ved siden af Electron-appen i
roden af repoet. Eleven går ind på en almindelig URL i en browser i stedet for at
få en installeret .exe/.dmg. Samme flow: navn+klasse → 10 sek. tekst → fritekst-svar
(max 2000 tegn) → sendes som to mails, ligesom Electron-versionen.

Forsiden har også to download-knapper til selve Electron-appen (.dmg/.exe), så man
nemt kan sende folk til én URL uanset om de vil køre den i browseren eller installere
den. Filerne ligger som **GitHub Release-assets** (gratis, op til 2 GB pr. fil, ingen
loginkrav for at downloade) på
https://github.com/nielsaki/svar-kiosk-app/releases/latest — knapperne peger på de
faste "latest download"-links, så de automatisk peger på nyeste version, næste gang
der laves en ny release.

**Sådan udgiver du en ny version af installer-filerne** (fx efter en ændring i
`config.js` eller `main.js`):
```
npm run build:all
gh release create v1.0.1 \
  "dist/Svar Kiosk-1.0.1-universal.dmg" \
  "dist/Svar Kiosk 1.0.1.exe" \
  --title "Svar Kiosk 1.0.1"
```
(Filnavnene i `web/public/index.html`'s download-links antager stabile navne uden
mellemrum - omdøb evt. filerne før upload, som gjort for v1.0.0, eller opdater
linkene til de nye filnavne.)

**Vigtig forskel fra Electron-versionen:** en webside kan IKKE låse skærmen lige så
hårdt som en rigtig kiosk-app. Vi bruger browserens Fullscreen API + blokering af de
mest almindelige genveje, men OS-niveau genveje (Alt/Cmd+Tab, at trykke Escape for at
forlade fuldskærm, lukke browservinduet) kan intet almindeligt script forhindre 100%.
Hvis det skal være markant strammere, kør siden i browserens indbyggede
kiosk-tilstand på den enkelte maskine, fx:

```
# Chrome/Edge (Windows/Mac/Linux):
chrome --kiosk https://dit-projekt.vercel.app
```

## 1. Opsætning FØR du deployer

Hemmelighederne (SMTP app-adgangskode, admin-adgangskode, modtagerlister) ligger
IKKE i en fil der committes til git, men som **environment variables** — enten i
Vercels dashboard (til den rigtige, offentlige side), eller lokalt i en `.env.local`
fil (kun til test på din egen maskine, og allerede gitignored).

```
cp .env.local.example .env.local
```

Udfyld derefter `.env.local` med de samme oplysninger som i den nuværende
`config.js` (se `.env.local.example` for hvilke felter).

## 2. Test lokalt

```
npm install -g vercel   # kun nødvendigt første gang, globalt CLI-værktøj
cd web
vercel dev
```

Åbn den URL terminalen viser (typisk `http://localhost:3000`), klik "Start" for at
gå i fuldskærm, og gennemgå hele flowet — bekræft at begge mails rent faktisk lander,
ligesom du allerede gør med `KIOSK_DEV=1` for Electron-versionen.

## 3. Læg koden på GitHub

```
# Fra roden af svar-kiosk-app (som nu har sit eget, selvstændige git-repo):
git add .
git commit -m "Tilføj webversion af Svar Kiosk"
```

Opret derefter et nyt, tomt repo på https://github.com/new (fx `svar-kiosk-app`),
og følg GitHub's instruktioner for at forbinde og pushe dit lokale repo dertil
(`git remote add origin ...` + `git push -u origin main`).

## 4. Deploy gratis på Vercel

1. Opret en gratis konto på https://vercel.com (kan logge ind med GitHub).
2. "Add New..." → "Project" → vælg dit `svar-kiosk-app`-repo fra GitHub.
3. Under "Root Directory" vælg `web` (VIGTIGT — ellers finder Vercel ikke `public/`
   og `api/`).
4. Under "Environment Variables" — indsæt de samme felter som i din `.env.local`
   (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, FROM_NAME,
   RECIPIENTS_ANONYM, RECIPIENTS_FULL, ADMIN_PASSWORD, COUNTDOWN_SECONDS,
   COUNTDOWN_TEXT, MAX_CHARS).
5. Klik "Deploy". Du får en gratis URL i stil med `svar-kiosk-app.vercel.app`.
6. Hver gang du `git push` herefter, redeployer Vercel automatisk.

## 5. Under en session

Ligesom Electron-versionen nulstiller siden ikke sig selv automatisk. Tryk
**Ctrl+Alt+Shift+L** (Windows) eller **Cmd+Option+Shift+L** (Mac) for admin-panelet,
indtast adgangskoden fra dine environment variables, og vælg enten "Nulstil til
næste elev" eller "Afslut kiosk-tilstand" (forlader fuldskærm — du skal selv lukke
fanen bagefter, en webside kan ikke lukke browseren for dig).
