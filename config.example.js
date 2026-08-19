// Indstillinger for Svar Kiosk.
// UDFYLD alle felter herunder FØR du bygger/kører programmet.
// Denne fil bliver bagt ind i det færdige program (.app / .exe) når du bygger det,
// så adgangskoden herunder skal være en Gmail APP-ADGANGSKODE (16 tegn), ALDRIG dit
// rigtige Google-login. Opret en app-adgangskode her: https://myaccount.google.com/apppasswords
// (kræver 2-trins-bekræftelse aktiveret på kontoen nielsaki@fss.fo).

module.exports = {
  smtp: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "nielsaki@fss.fo",
      pass: "SÆT_APP_ADGANGSKODE_HER", // 16-tegns app-adgangskode, ikke dit normale password
    },
  },

  // Navnet mailen sendes "fra" (selve afsenderadressen er altid smtp.auth.user ovenfor).
  fromName: "Svar Kiosk",

  // Mail 1: kun klasse + svar (INGEN navn) - sendes til denne/disse adresse(r).
  // Tilføj den anden alumni-adresse her, når du husker den, fx:
  // anonym: ["bzt192@alumni.ku.dk", "den-anden@alumni.ku.dk"],
  recipients: {
    anonym: ["bzt192@alumni.ku.dk"],
    // Mail 2: navn + klasse + svar - sendes hertil.
    full: ["niels.aki.mork@gmail.com"],
  },

  // Adgangskode DU (læreren/tilsynet) bruger til at afslutte kiosk-tilstand
  // eller nulstille appen til næste elev. Vælg noget eleverne ikke kan gætte.
  adminPassword: "SKIFT_MIG",

  // Antal sekunder på "læs teksten"-skærmen, og teksten der vises der.
  countdownSeconds: 10,
  countdownText: "Hetta er teksturin í 10sek",

  // Maks. antal tegn i svar-feltet.
  maxChars: 2000,
};
