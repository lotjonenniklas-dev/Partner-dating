import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tietosuoja",
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <h1 className="font-heading text-[2rem] leading-none tracking-[-0.02em]">Tietosuoja</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Päivitetty 8.10.2026. Partner on aikuisille tarkoitettu deittisovellus. Tästä sivusta vastaa
        Niklas Lötjönen, lotjonenniklas@gmail.com. Erillistä yritystä ei ole.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Mitä tähän puhelimeen jää</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Nimi, ikä, kaupunki, esittely, kuvat, tykkäykset, osumat, viestit ja estot tallentuvat tämän
        selaimen muistiin. Ne eivät siirry toiseen puhelimeen. Kokeiluosoite on väliaikainen, ja uusi
        osoite aloittaa tyhjästä. Nollaa tili poistaa nämä tiedot tästä selaimesta.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Ikä</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Partner on vain vähintään 18-vuotiaille. Jatkaminen tässä selaimessa vaatii vahvistuksen.
        Ikäkenttä ei hyväksy alle 18 vuoden ikää.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Ilmoitukset</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Jos sallit ilmoitukset, puhelin lähettää ilmoitustilauksen kokeilupalvelimelle, jotta osuma
        tai viesti voidaan näyttää. Ilmoitus lähtee tästä laitteesta. Toisen ihmisen viesti ei vielä
        kulje puhelimesta toiseen, koska yhteistä tiliä ei ole.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Esto kahden puhelimen välillä</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Jos profiilissa on nimi, ikä ja kaupunki, kokeilu lähettää ne sekä eston kokeilupalvelimelle.
        Silloin kaksi puhelinta voi piilottaa toisensa. Kuvia ei lähetetä. Lista on väliaikainen ja
        voi kadota, kun kokeiluosoite lakkaa.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Ilmoita henkilö</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Keskustelun valikosta voit ilmoittaa henkilön. Syy ja ajankohta jäävät tähän puhelimeen.
        Sama tieto kirjoitetaan myös kokeilupalvelimen väliaikaiseen tiedostoon. Se ei ole jaettu
        käyttäjätietokanta, eikä ilmoitus sulje toista tiliä. Vakavasta asiasta voit kirjoittaa
        osoitteeseen lotjonenniklas@gmail.com.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Maksu ja Google</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Vuorokausimaksu on Google Payn testitilassa, eikä oikeaa veloitusta tehdä. Google-kirjautumista
        ei ole kytketty, joten kokeilu käyttää jatkoa tässä selaimessa.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Esimerkkiprofiilit</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Tutustu-sivun muut ihmiset ovat esimerkkejä, eivät erillisiä tilejä. Heidän kuvansa ja
        tekstinsä on tehty sovellusta varten.
      </p>
    </article>
  )
}
