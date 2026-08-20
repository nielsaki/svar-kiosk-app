# Svar Kiosk

**Live side:** https://svar-kiosk-app.vercel.app — kør direkte i browseren, eller
download Mac/Windows-appen fra samme side. Se [web/README.md](web/README.md) for
detaljer om web-versionen.

Lukket "kiosk"-program: eleven udfylder navn + klasse, skal se en tekst i 10 sekunder
(kan ikke springes over), skriver derefter et frit svar (max 2000 tegn), og trykker Send.
Programmet sender selv to mails via Gmail/SMTP:

1. **Klasse + svar** (uden navn) → adresserne under `recipients.anonym` i `config.js`
2. **Navn + klasse + svar** → adresserne under `recipients.full` i `config.js`

Mens programmet kører, er det i fuldskærms "kiosk"-tilstand og blokerer de mest
almindelige måder at skifte program på (Cmd/Ctrl+Tab, Alt+Tab, Cmd+Q, Alt+F4, osv.),
så det er markant sværere for eleven at skifte til en browser/AI-værktøj undervejs.

**Vigtig begrænsning:** Dette er et almindeligt program, ikke en systemlås. Det kan
ikke forhindre eleven i at bruge en telefon eller en anden computer, og enkelte
OS-niveau-genveje (fx Windows-tasten, Mission Control på Mac) kan ikke blokeres 100 %
af noget almindeligt program. Det hæver barren markant, men er ikke en garanti.

## 1. Opsætning FØR du bygger programmet

Åbn `config.js` og udfyld:

- `smtp.auth.pass` — en **Gmail app-adgangskode** (16 tegn) til `nielsaki@fss.fo`,
  oprettet på https://myaccount.google.com/apppasswords (kræver 2-trins-bekræftelse
  aktiveret på kontoen). Brug ALDRIG dit rigtige login-password her.
- `recipients.anonym` — modtager(e) af "klasse + svar"-mailen, fx:
  ```js
  anonym: ["modtager1@eksempel.dk", "modtager2@eksempel.dk"],
  ```
- `adminPassword` — adgangskoden DU bruger til at afslutte kiosk-tilstand eller
  nulstille til næste elev. Skift den fra `"SKIFT_MIG"` til noget eleverne ikke kan gætte.
- `countdownText` / `countdownSeconds` / `maxChars` kan justeres efter behov.

**OBS om `nielsaki@fss.fo`:** appen antager kontoen kører via Google (Google Workspace),
så den kan sende via `smtp.gmail.com` med en app-adgangskode ligesom almindelig Gmail.
Test derfor punkt 2 herunder, inden du sender programmet ud — hvis afsendelse fejler,
er det tegn på at domænet ikke er sat op til det, og SMTP-indstillingerne i `config.js`
skal justeres til jeres mailudbyder i stedet.

## 2. Test det trygt, før eleverne får det

```
npm install        # kun nødvendigt første gang
KIOSK_DEV=1 npm start
```

`KIOSK_DEV=1` åbner programmet i et almindeligt, lukkeligt vindue uden fuldskærms-lås —
så du kan klikke dig igennem hele flowet og bekræfte at de to mails rent faktisk lander,
uden at låse din egen skærm. **Jeg har selv bygget og pakket programmet, men kunne ikke
visuelt afprøve kiosk-vinduet i mit eget miljø — kør derfor selv denne test mindst én
gang, inklusiv et rigtigt afsendelses-forsøg, før du sender det videre.**

Når du er tilfreds, kan du prøve den rigtige kiosk-tilstand:

```
npm start
```

For at komme ud igen: tryk **Ctrl+Alt+Shift+L** (Windows) eller **Cmd+Option+Shift+L**
(Mac) for at åbne admin-panelet, indtast adgangskoden fra `config.js`, og vælg enten
"Nulstil til næste elev" eller "Luk programmet".

## 3. Byg de færdige programmer

```
npm run build:mac   # laver dist/Svar Kiosk-1.0.0-universal.dmg (Intel + Apple Silicon)
npm run build:win   # laver dist/Svar Kiosk 1.0.0.exe (Windows 64-bit, portable)
npm run build:all   # begge dele
```

De færdige filer ligger i `dist/`. Kør altid en frisk `npm run build:*` igen, hvis du
retter noget i `config.js` — ellers indeholder den byggede fil de gamle indstillinger.

## 4. Sådan sender du det til en, der ikke ved hvordan man åbner et program

**Windows:** Send filen `Svar Kiosk 1.0.0.exe` (fx via mail, USB eller Dropbox).
Personen skal blot dobbeltklikke på den — ingen installation nødvendig. Windows kan
vise en "SmartScreen"-advarsel første gang (fordi filen ikke er signeret af en betalt
udgivercertifikat); der vælger man "Mere info" → "Kør alligevel".

**Mac:** Send filen `Svar Kiosk-1.0.0-universal.dmg`. Personen dobbeltklikker, trækker
"Svar Kiosk" over i Programmer-mappen, og åbner den. Da appen ikke er signeret med et
Apple Developer-certifikat, vil macOS Gatekeeper blokere almindeligt dobbeltklik første
gang — personen skal i stedet **højreklikke på appen → Åbn → Åbn** (kun nødvendigt én gang).

## 5. Under en session

Programmet lukker/nulstiller ikke sig selv automatisk efter én elev — brug admin-panelet
(punkt 2 ovenfor) til at nulstille til "næste elev"-skærmen mellem hver elev, eller luk
programmet helt, hvis I kun kører én elev ad gangen.
