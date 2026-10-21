import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Käyttöehdot",
}

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <h1 className="font-heading text-[2rem] leading-none tracking-[-0.02em]">Käyttöehdot</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Päivitetty 8.10.2026. Partneria pitää Niklas Lötjönen, lotjonenniklas@gmail.com.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Vain aikuisille</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Saat käyttää Partneria, jos olet vähintään 18-vuotias. Alaikäisen esittäminen aikuisena tai
        aikuisen esittäminen alaikäisenä on kielletty.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Miten kokeilu toimii</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Tämä versio toimii yhdessä puhelimessa. Tykkäys, esto ja viesti eivät vielä kulje kahden
        oikean ihmisen välillä, koska yhteistä tiliä ei ole. Esimerkkiprofiilit eivät ole muita
        käyttäjiä. Väliaikainen osoite lakkaa toimimasta, kun sen aika päättyy.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Käytä asiallisesti</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Häirintä, huijaus, uhkailu ja sopimaton sisältö ovat kiellettyjä. Toisen henkilön voi
        poistaa keskustelusta, estää tai ilmoittaa. Esto piilottaa teidät toisiltanne. Toinen
        puhelin näkee eston, kun kokeilupalvelin on hereillä. Ilmoitus tallentuu tähän puhelimeen.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Maksu</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Lisätykkäysten vuorokausi näkyy Google Payn testitilassa. Testitila ei veloita korttia.
        Oikeaa maksua ei kytketä päälle ilman erillistä ilmoitusta.
      </p>

      <h2 className="mt-8 font-heading text-xl tracking-[-0.02em]">Vastuu</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Kokeilu tarjotaan sellaisena kuin se on. Tiedot voivat kadota, kun selain tyhjennetään tai
        osoite vaihtuu. Tietosuojassa kerrotaan, mitä laitteeseen jää.
      </p>
    </article>
  )
}
