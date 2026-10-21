import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Miksi Partner?",
  description: "Dating ilman lokerointia. Olet enemmän kuin työsi.",
}

export default function WhyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Miksi Partner?
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Dating ilman lokerointia 💚
          </p>
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 border-2 border-pink-200">
            <p className="text-lg text-gray-800 leading-relaxed italic">
              "Et kysy kadulla vastaan tulevan työtä.<br />
              Miksi kysyisit sitä appissa?"
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="prose prose-lg max-w-none">
          {/* Real life analogy */}
          <section className="mb-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              💭 Ajattele...
            </h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Tapaat jonkun kahvilassa, baarissa tai kadulla:
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p>👀 Katsekontakti</p>
                  <p>😊 Hymy</p>
                  <p>👋 "Hei"</p>
                  <p>💬 Keskustelu alkaa</p>
                  <p>✨ Tutustut <strong>ihmisenä</strong></p>
                </div>
              </div>

              <div className="text-center text-2xl font-bold text-gray-600">
                ❓
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Kysytkö ensin:
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>❌ "Mitä teet työksesi?"</p>
                  <p>❌ "Missä opiskelit?"</p>
                  <p>❌ "Paljonko tienaat?"</p>
                </div>
                <p className="mt-4 text-lg font-bold text-red-600">
                  ET KYSY.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-300">
                <p className="text-xl text-gray-800 text-center font-semibold">
                  Miksi dating-appien pitäisi olla erilaisia? 💚
                </p>
              </div>
            </div>
          </section>

          {/* Problem */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ❌ Ongelma muissa appeissa
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Useimmat dating-appit kysyvät heti:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>❌ Mitä teet työksesi?</li>
              <li>❌ Missä opiskelit?</li>
              <li>❌ Paljonko tienaat?</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Tämä luo ennakkoluuloja <em>ennen kuin ehdit tutustua</em>. Ihmiset lokeroidaan
              yhteiskuntaluokkiin ja arvostellaan CV:n perusteella, ei persoonallisuuden.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4 font-semibold">
              Et tekisi näin oikeassa elämässä. Miksi appissa?
            </p>
          </section>

          {/* Solution */}
          <section className="mb-12 bg-green-50 rounded-2xl p-8 border-2 border-green-300">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ✅ Partner: Dating kuin oikeassa elämässä
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Partner ei kysy työtäsi, koulutustasi tai tulojasi. Koskaan.</strong>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Aivan kuten kadulla, kahvilassa tai baarissa - tutustut ensin <strong>ihmisenä</strong>.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sen sijaan kysymme:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Kuka olet?</li>
              <li>✅ Mistä tykkäät?</li>
              <li>✅ Mitä haet?</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 text-lg font-semibold text-green-800">
              Tutustutaan ihmisenä ihmiseen. Kuin oikeassa elämässä. 💚
            </p>
          </section>

          {/* Why it matters */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              💚 Miksi tämä on tärkeää?
            </h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-pink-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Olet enemmän kuin työsi
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Ammatti ei kerro huumorintajustasi, arvoistasi tai siitä millainen kumppani olet.
                  Se kertoo vain mitä teet 8 tuntia päivässä.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Persoonallisuus on tärkeämpää
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Tutkimukset osoittavat että arvot, huumorintaju ja yhteensopivuus ovat
                  paljon tärkeämpiä pitkissä suhteissa kuin ammatti tai koulutus.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Tasa-arvo
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Kassatyöntekijä ja lääkäri ovat yhtä arvokkaita. Opiskelija ja toimitusjohtaja
                  ansaitsevat saman mahdollisuuden tutustua toisiinsa ilman ennakkoluuloja.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ei häpeää
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Oletko työtön? Vasta valmistunut? Vaihtamassa alaa? Ei väliä.
                  Partner ei tuomitse. Sinä riität sellaisenasi kuin olet.
                </p>
              </div>
            </div>
          </section>

          {/* Manifesto */}
          <section className="mb-12 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Partner Manifesti
            </h2>
            <div className="space-y-4 text-center">
              <p className="text-xl font-semibold text-gray-800">
                ❤️ Ihmiset ovat enemmän kuin työnsä
              </p>
              <p className="text-xl font-semibold text-gray-800">
                💚 Persoonallisuus {`>`} Status
              </p>
              <p className="text-xl font-semibold text-gray-800">
                💙 Tasa-arvo {`>`} Hierarkia
              </p>
              <p className="text-xl font-semibold text-gray-800">
                💛 Aitous {`>`} Lokeroiminen
              </p>
            </div>
          </section>

          {/* Research */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              📊 Mitä tutkimus sanoo?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pitkien suhteiden onnistumiseen vaikuttavat eniten:
            </p>
            <div className="bg-blue-50 rounded-xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Yhteensopivuus</span>
                <span className="text-blue-600 font-bold">68%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Huumorintaju</span>
                <span className="text-blue-600 font-bold">64%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Arvot</span>
                <span className="text-blue-600 font-bold">61%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Kommunikaatio</span>
                <span className="text-blue-600 font-bold">58%</span>
              </div>
              <hr className="my-4 border-gray-300" />
              <div className="flex justify-between items-center opacity-50">
                <span className="text-gray-600">Ammatti</span>
                <span className="text-gray-500">12%</span>
              </div>
              <div className="flex justify-between items-center opacity-50">
                <span className="text-gray-600">Koulutus</span>
                <span className="text-gray-500">9%</span>
              </div>
            </div>
          </section>

          {/* Made in Finland */}
          <section className="mb-12 bg-blue-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🇫🇮 Made in Finland
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Partner on suomalainen. Suomessa uskomme tasa-arvoon. Ei luokkaeroihin.
              Ei hierarkiaan. Kaikki ovat samanarvoisia.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Haluamme tuoda tämän arvon dating-maailmaan. Tutustutaan ihmisinä,
              ei titteleinä.
            </p>
          </section>

          {/* CTA */}
          <section className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Valmis tutustumaan?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Dating ilman lokerointia alkaa tästä. 💚
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-6 text-lg rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg">
                  Aloita tästä →
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-xl">
                  Takaisin etusivulle
                </Button>
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              ❓ Usein kysytyt kysymykset
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Eikö työ/koulutus ole tärkeä yhteensopivuudessa?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Arvot ja persoonallisuus ovat paljon tärkeämpiä. Ammatti voi luoda
                  ennakkoluuloja ennen tutustumista. Jos työ on tärkeä keskustelunaihe,
                  se tulee esiin luonnollisesti chatissa.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Entä jos haluan tietää kumppanin taloudellisen tilanteen?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Ymmärrämme että joillekin taloudellinen vakaus on tärkeää. Mutta
                  kysymällä tuloja etukäteen luodaan luokkaeroja ja arvostellaan
                  ennen tutustumista. Tutustutaan ensin ihmisinä, muut asiat tulevat
                  esiin luonnollisesti.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Voiko profiilissa mainita työnsä/koulunsa?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Voit mainita biossa jos haluat, mutta emme kysy sitä erikseen.
                  Haluamme että fokus on sinussa ihmisenä, ei CV:ssäsi.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer quote */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <blockquote className="text-2xl font-serif italic text-gray-700 mb-4">
            "Olet enemmän kuin työsi. <br />
            Olet enemmän kuin CV:si. <br />
            Olet ihminen."
          </blockquote>
          <p className="text-gray-600">– Partner 💚</p>
        </div>
      </div>
    </div>
  )
}
