# Chatbot MVP
Dette prosjektet er et minimun viable produkt eller prototype for en ny AI drevet chatbot til kommunene Lillesand og Birkenes.

## Installasjon
1. Klone dette repositoryet ved å kjøre git clone https://github.com/waresa/chatbotten.git
2. Naviger til mappen med "cd chatbotten"
3. Gå til klientmappen ved å kjøre cd ../client
4. Installer klientavhengigheter ved å kjøre "npm install"
5. I .env filen bytt ut din_openai_api_nøkkel og din_pinecone_api_nøkkel med de faktiske API-nøklene dine (Sjekk under for å finne ut hvordan skaffe seg API-nøkkler).
6. Lag en ny mappe med navn uploads i server mappen.
## Kjøring
1. Start serveren ved å kjøre cd server && "node index.js"
2. Start klienten i en annen terminal ved å kjøre cd ../client && npm start
3. Åpne nettleseren din og naviger til http://localhost:3000 for å bruke applikasjonen.
4. Vennligst merk at du må ha gyldige API-nøkler for å kunne kjøre applikasjonen og at du ikke skal distribuere eller publisere disse nøklene offentlig.
5. Du må også lage databasen først for å klare å laste opp et dokument.
## Database Setup
1. Gå til Pinecone-nettsiden: https://www.pinecone.io/.
2. Opprett en konto eller logg inn på eksisterende konto.
3. Når du er logget inn, naviger til Pinecone Dashboard.
4. I dashboardet, finn "Create a new index" eller "New Index" -knappen og klikk på den.
5. Gi databasen navnet "chatbot".
6. Angi dimensjonene til 1536 for databasen.
7. Klikk på "Create" eller "Opprett" for å opprette databasen.
### OpenAI API-nøkkel
For å få en OpenAI API-nøkkel, følg disse trinnene:
1. Gå til OpenAI-plattformen sin nettside: https://openai.com/.
2. Opprett en konto eller logg inn hvis du allerede har en.
3. Naviger til API-delen av nettsiden og les mer om API-et og bruksvilkårene.
4. Følg instruksjonene for å opprette en API-nøkkel.
Når du har opprettet nøkkelen, kopier den og legg den i .env filen.
### Pinecone API-nøkkel
Her er trinnene for å skaffe deg en Pinecone API-nøkkel:
1. Gå til Pinecone-nettsiden: https://www.pinecone.io/.
2. Opprett en konto eller logg inn på eksisterende konto.
3. Når du er logget inn, gå til kontoinnstillingene eller brukerprofilen din.
4. Finn API-delen eller nøkkelhåndteringen.
5. Følg instruksjonene for å generere en API-nøkkel.
6. Kopier nøkkelen og legg den i .env filen.
Vær oppmerksom på at OpenAI og Pinecone kan ha endret prosedyrene for å skaffe API-nøkler. Sørg for å følge oppdaterte instruksjoner på deres offisielle nettsider for å skaffe nøklene.
