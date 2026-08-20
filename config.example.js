// Indstillinger for Svar Kiosk.
// UDFYLD alle felter herunder FØR du bygger/kører programmet.
// Denne fil bliver bagt ind i det færdige program (.app / .exe) når du bygger det,
// så adgangskoden herunder skal være en Gmail APP-ADGANGSKODE (16 tegn), ALDRIG dit
// rigtige Google-login. Opret en app-adgangskode her: https://myaccount.google.com/apppasswords
// (kræver 2-trins-bekræftelse aktiveret på Google-kontoen).

module.exports = {
  smtp: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "dit-navn@dit-domæne.fo",
      pass: "SÆT_APP_ADGANGSKODE_HER", // 16-tegns app-adgangskode, ikke dit normale password
    },
  },

  // Navnet mailen sendes "fra" (selve afsenderadressen er altid smtp.auth.user ovenfor).
  fromName: "Svar Kiosk",

  // Mail 1: kun klasse + svar (INGEN navn) - sendes til denne/disse adresse(r).
  // Tilføj flere adresser i samme liste, fx:
  // anonym: ["modtager1@eksempel.dk", "modtager2@eksempel.dk"],
  recipients: {
    anonym: ["modtager1@eksempel.dk"],
    // Mail 2: navn + klasse + svar - sendes hertil.
    full: ["modtager2@eksempel.dk"],
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
