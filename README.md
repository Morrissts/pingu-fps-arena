# Pingu FPS Arena

En FPS-prototyp som körs i webbläsaren. Enspelarläget använder Canvas och JavaScript; nätläget laddar PeerJS från ett CDN när det startas.

## Starta

Öppna `index.html` i en modern webbläsare och välj **Starta spelet**. Webbläsaren ber om muslås så att musen kan styra sikten. Spelet använder `inventory.js` för föremålssystemet.

## Spela online

1. Publicera hela spelmappen på en webbplats med HTTPS. Att öppna filen lokalt fungerar inte för vänner på andra datorer.
2. Värden väljer **Spela online** och sedan **Skapa rum**.
3. Välj **Kopiera inbjudningslänk** och skicka länken innan matchen startar.
4. Vänner öppnar länken, anger sitt namn och väljer **Gå med i rum**. Rumskoden fylls i automatiskt.
5. Värden startar matchen när alla är inne. Upp till fyra spelare kan kasta snöbollar på varandra.

Online-läget använder PeerJS för att hitta spelarna och WebRTC för att skicka spelarnas rörelser och snöbollar direkt mellan webbläsarna. Det kräver internet. Vissa nätverk kan blockera direkta WebRTC-anslutningar; då kan spelarna behöva prova ett annat nätverk.

## Kontroller

- **W, A, S, D**: gå och sidsteg
- **Musen**: sikta i sidled och höjdled
- **Vänsterklick**: kasta en snöboll
- **Shift**: spring
- **Esc eller P**: pausa
- **1–3**: välj inventory-plats
- **E**: använd valt föremål

Besegra pingvinerna för att komma vidare till nästa våg. Varje ny våg blir svårare.

I enspelarläget använder fiendebotarna snöbollskast på avstånd och sidsteg för att undvika spelarens sikte. De laddar sina kast en kort stund med en tydlig ljussignal, så att spelaren hinner reagera. Det är en kort paus mellan vågorna, och spelaren får då lite hälsa tillbaka. Botarna följer spelarens rörelsemönster, justerar siktet efter träffar och missar och sparar sin inlärda taktik lokalt i webbläsaren. Nätläget är fortsatt spelare mot spelare.

Fienderna ritas som lågpoly 3D-modeller. Träffzonerna är cylindriska: fienderna har radie 0,32 och höjd 0,80 spelmått, och spelaren har radie 0,34 och höjd 1,08. Snöbollens radie är 0,028.

Var tredje besegrad pingvin ger ett föremål: **Läkning** återställer hälsa, **Snabbkast** ökar kasttakten i 8 sekunder och **Issköld** blockerar fiendeskada i 6 sekunder. Föremål kan staplas upp till tre per plats.

