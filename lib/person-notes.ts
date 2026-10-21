export type PersonNote = {
  title: string
  body: string
}

const notes: Record<string, PersonNote[]> = {
  aino: [
    {
      title: "Arki",
      body: "Työpäivät kuluvat piirustusten ja työmaakäyntien välissä. Illalla kävelen usein saman reitin Kaivopuistossa, ilman kuulokkeita.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kahvi on tekosyy pysähtyä. Viikonloppuna katson taloja, joita en ole itse suunnitellut, ja kirjoitan ylös sen, mikä niissä toimii.",
    },
    {
      title: "Etsin",
      body: "Seuraa, jonka kanssa arki ei ole suoritus. Riittää, että kävellään samaan suuntaan ja puhutaan vasta, kun on asiaa.",
    },
  ],
  elias: [
    {
      title: "Arki",
      body: "Keittiö aukeaa aikaisin ja sulkeutuu myöhään. Vapaan illan käytän saunaan ja levyyn, jonka tunnen jo ulkoa.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kokkaan mieluummin kahdelle kuin yhdelle, mutta en tee siitä ohjelmaa. Jazz soi taustalla, ei keskustelun päällä.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee syömään nälkäisenä eikä arvostele annosta ensimmäisellä haarukalla. Jälkiruoka saa olla yksinkertainen.",
    },
  ],
  sofia: [
    {
      title: "Arki",
      body: "Piirrän päivisin kirjoja ja joskus seinää, jos ravintola uskaltaa. Pöytä on sotkuinen, mutta tiedän mistä mikäkin luonnos löytyy.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kirpputorilla ei ole aikataulua. Ostan kupin, vaikka minulla on niitä jo, jos siinä on outo kuvio.",
    },
    {
      title: "Etsin",
      body: "Seuraa, joka jaksaa kiertää pöydät loppuun asti. En etsi ihmistä, joka katsoo kelloa kesken rivin.",
    },
  ],
  onni: [
    {
      title: "Arki",
      body: "Lenkki on aamulla ennen konetta. Illalla teen pastan ja kuuntelen levyn loppuun, vaikka väsyttäisi.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Nuuksio on lähellä ja polut tuttuja. Vinyylit ovat hyllyssä aakkosissa, enkä häpeä sitä.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka lähtee mukaan joskus ja jää joskus kotiin ilman selitystä. Molemmat käyvät.",
    },
  ],
  linnea: [
    {
      title: "Arki",
      body: "Vastaanotolla on koiria, kissoja ja omistajia, jotka ovat huolissaan. Sen jälkeen tarvitsen tuulta ja vettä.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Vene lähtee, jos sää on kohtuullinen ja koira mahtuu mukaan. Leivon, kun meri on liian kova.",
    },
    {
      title: "Etsin",
      body: "Seuraa, joka ei pelkää karvoja takissa. Laiturilla saa olla hiljaa.",
    },
  ],
  matias: [
    {
      title: "Arki",
      body: "Opastan kitaratunteja iltapäivisin. Bändin nimi vaihtuu, mutta keikat pysyvät pieninä.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Aamiainen on päivän paras ateria, ja sen takia herään mieluummin hitaasti. Illalla soitan vain, jos joku pyytää.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee aamiaiselle nälkäisenä. Musiikkimausta voi kinata, kunhan kahvi on kunnossa.",
    },
  ],
  isla: [
    {
      title: "Arki",
      body: "Studio Kalliossa tuoksuu savelta. Teen kuppeja ja kulhoja, joita on tarkoitus käyttää, ei vain katsoa.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Istun yhden kupin ääressä niin kauan, että tee jäähtyy. Näyttelyyn menen, jos siellä saa puhua hiljaa.",
    },
    {
      title: "Etsin",
      body: "Seuraa, joka ei täytä hiljaisuutta heti. Kello saa pysyä taskussa.",
    },
  ],
  veeti: [
    {
      title: "Arki",
      body: "Verstaalla on purua ja keskeneräisiä pöytiä. Teen kalusteita, jotka kestävät muuton.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Talvella hiihdän, kesällä korjaan pyöriä, joita ei pyydetty korjattavaksi. Kahvi maistuu paremmin ulkona.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee verstaalle eikä välitä purusta kengissä. Ei tarvitse osata höylätä.",
    },
  ],
  helmi: [
    {
      title: "Arki",
      body: "Pieni studio Vallilassa riittää. Poltan uunin silloin, kun savi on kuivaa, en kalenterin mukaan.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kirpputorilla etsin kuppeja, joissa on outo kuvio. Elokuva saa olla hidas.",
    },
    {
      title: "Etsin",
      body: "Seuraa, jolla on jokin turha esine tallessa hyvällä syyllä. Kerron omani, jos kuulen sinun.",
    },
  ],
  aaro: [
    {
      title: "Arki",
      body: "Pyöräilen töihin ympäri vuoden. Korjaan muiden pyöriä iltaisin, jos oma on jo kunnossa.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kartat ovat hyllyssä, vaikka en ole lähdössä. Leivon, kun ulkona on kehno keli.",
    },
    {
      title: "Etsin",
      body: "Ihmistä pitkälle lenkille ilman maalia. Rannalle riittää, jos sää ei ole täysin mahdoton.",
    },
  ],
  noora: [
    {
      title: "Arki",
      body: "Opinnot vievät metsään useammin kuin luentosaliin. Ilta kuluu järven rannassa, usein ilman seuraa.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Uin, kun vesi on vielä kylmää. Kuvaan valoa, en ihmisiä.",
    },
    {
      title: "Etsin",
      body: "Seuraa, joka ei säikähdä hiljaisuutta. Reitin saat valita sinä.",
    },
  ],
  leevi: [
    {
      title: "Arki",
      body: "Kirjastossa on hiljaista ja tee liian kuumaa. Illalla soitan kontrabassoa salissa, jossa yleisö mahtuu muutamaan riviin.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kuuntelen levyjä, joita en soittaisi keikalla. Kävelen kotiin samaa katua.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee kuuntelemaan eikä kuvaa koko kappaletta. Jälkeenpäin riittää tee.",
    },
  ],
  emma: [
    {
      title: "Arki",
      body: "Aamuvuoro alkaa ennen kuin Kallio herää. Taikina on valmis, kun muut vasta etsivät kahvia.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Luen yhden luvun ja sammutan valot, vaikka kirja olisi hyvä. Kävelen töistä kotiin pitkää reittiä.",
    },
    {
      title: "Etsin",
      body: "Seuraa, joka tulee leipomon ohi ja jää hetkeksi. Tuoretta leipää riittää jaettavaksi.",
    },
  ],
  eero: [
    {
      title: "Arki",
      body: "Suunnittelen valoa tiloihin, joissa ihmiset istuvat koko päivän. Hyvä valo on sellainen, jota ei huomaa.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Soudan, jos järvi on auki. Talvella kävelen saman rannan.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, jonka kanssa voi olla hiljaa veneessä. Kahvi juodaan rannassa jälkeenpäin.",
    },
  ],
  saana: [
    {
      title: "Arki",
      body: "Luen merestä ja käyn rannalla myös silloin, kun ei ole kenttäpäivää. Taskussa on yleensä yksi kivi liikaa.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Elokuva saa olla pitkä. Kivet järjestän ikkunalaudalle ilman järjestelmää.",
    },
    {
      title: "Etsin",
      body: "Seuraa rannalle ilman suunnitelmaa. Hiljaisuus ei ole ongelma.",
    },
  ],
  oskari: [
    {
      title: "Arki",
      body: "Korjaan kameroita päivällä ja kuvaan keikkoja illalla. Kellareissa on savua ja huono valo, ja se riittää.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kehitän filmin itse, jos ehdin. En jaa kuvia samana iltana.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka jää saliin valojen syttymiseen asti. Siitä tietää, että keikka oli hyvä.",
    },
  ],
  iida: [
    {
      title: "Arki",
      body: "Opetan lapsia, jotka pelkäävät syvää päätä. Itse menen järveen heti, kun vesi ylittää kymmenen astetta.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Aamu-uinti on parempi kuin iltauinti. Pyyhe on aina laukussa.",
    },
    {
      title: "Etsin",
      body: "Seuraa laiturille. Ei tarvitse uida pitkälle, riittää että tulee mukaan.",
    },
  ],
  juho: [
    {
      title: "Arki",
      body: "Kirjoitan reiteistä, joita en ole itse kävellyt loppuun. Kartta on tarkempi kuin muisti.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Keitto valmistuu hitaasti ja radio soi keittiössä. Viikonloppuna lähden polulle ilman kellotusta.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka syö nälkäisenä ja lähtee joskus metsään. Reitti saa jäädä kesken.",
    },
  ],
  pinja: [
    {
      title: "Arki",
      body: "Maalaan kylttejä kaupoille, jotka haluavat näyttää itseltään. Pensseleitä on liikaa ja hyllyjä liian vähän.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kasvit valtaavat ikkunalaudan. Kirpputorilta tuon ruukun, vaikka kasvi puuttuu.",
    },
    {
      title: "Etsin",
      body: "Seuraa, joka saa koskea kasveihin ja kysyä väristä. Ateljeessa on aina tilaa yhdelle tuolille.",
    },
  ],
  kasper: [
    {
      title: "Arki",
      body: "Opiskelen puutarhuriksi ja vien kukkia ihmisille, jotka eivät tilanneet niitä. Aamu alkaa hitaasti.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kahvi juodaan kasvihuoneessa, vaikka siellä on multaa. Illalla luen siemenpusseja kuin kirjoja.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka ei välitä mullasta kynsien alla. Kukka saa nuupahtaa maljakkoon.",
    },
  ],
  vilma: [
    {
      title: "Arki",
      body: "Teen kuppeja ja myyn niitä torilla, jos ei sada. Säröinen kuppi on usein paras.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Tee juodaan ilman kiirettä. Tori on lauantaina aikaisin, ja sen jälkeen päivä saa olla tyhjä.",
    },
    {
      title: "Etsin",
      body: "Seuraa, jonka kanssa tori ei tunnu työltä. Kahvi on kuumaa kahdeksalta.",
    },
  ],
  niko: [
    {
      title: "Arki",
      body: "Talvella veneet ovat hallissa ja kesällä joella. Korjaan sen, mikä vuotaa, ennen kuin lähden itse ajamaan.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Grilli lämpenee ilman reseptiä. Joki näkyy pihasta, ja se riittää illan ohjelmaksi.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee syömään vaikka ei toisi mitään. Pitkä ajelu ilman määränpäätä käy myös.",
    },
  ],
  alina: [
    {
      title: "Arki",
      body: "Suosittelen kirjastossa kirjoja, joita en ole lukenut loppuun. Hyllyjen välissä on hiljaista myös ruuhka-aikaan.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Pyöräilen ilman kellotusta. Tee jäähtyy, jos kirja on hyvä.",
    },
    {
      title: "Etsin",
      body: "Seuraa lenkille, jolla ei katsota kelloa. Kirjasta voi olla eri mieltä.",
    },
  ],
  topi: [
    {
      title: "Arki",
      body: "Ruisleipä valmistuu aamulla ja kestää matkan. Loput päivästä korjaan sitä, mikä eiliseltä jäi.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Hiihdän meren jäälle vain, kun jää on varmasti kantavaa. Tuuli ei haittaa.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka syö leivän voin kanssa tai ilman, ihan sama. Jäälle lähteminen on vapaaehtoista.",
    },
  ],
  senni: [
    {
      title: "Arki",
      body: "Opastan satamassa ja tunnen laivat nimeltä. Työ loppuu, kun viimeinen ryhmä on laiturilla.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Etsin kahviloita, joissa saa istua pitkään. Iltaisin kävelen laiturin päähän ilman opastusta.",
    },
    {
      title: "Etsin",
      body: "Seuraa yhdelle kupille tai koko illaksi. Molemmat ovat onnistunut vastaus.",
    },
  ],
  rasmus: [
    {
      title: "Arki",
      body: "Soitan hotellin aulassa iltapäivisin. Kappaleet ovat hitaita, koska ihmiset kävelevät laukkujen kanssa.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kävelen järven rantaa ja ostan pullan, vaikka päätin olla ostamatta. Ilta saa loppua aikaisin.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee kuuntelemaan neljältä. Pulla on minun puoleltani.",
    },
  ],
  lotta: [
    {
      title: "Arki",
      body: "Tunnistan lintuja paremmin kuin ihmisiä. Aamu alkaa kävelyllä, ennen kuin kaupunki on äänessä.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Kahvi tulee mukaan termoksessa. Polku on sama, jos siellä on vähän muita.",
    },
    {
      title: "Etsin",
      body: "Seuraa aamukävelylle. Ei tarvitse tuntea lajeja, riittää että kuuntelee.",
    },
  ],
  miro: [
    {
      title: "Arki",
      body: "Rakennan saunoja pihoille, joissa on tilaa. Puu saa napsahtaa, se kuuluu asiaan.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Istun lauteilla yksin ja kuuntelen. Puhe ei ole siellä pakollista.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee saunaan eikä täytä koko iltaa puheella. Kahvi juodaan vasta jälkeenpäin.",
    },
  ],
  ellen: [
    {
      title: "Arki",
      body: "Kuvaan järveä filmille ja kehitan kuvat itse. Horisontti on usein sama, valo ei.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Pimiössä ei saa koskea naruihin. Laiturilla odotan, että valo muuttuu.",
    },
    {
      title: "Etsin",
      body: "Seuraa, jonka kanssa samaa maisemaa jaksaa katsoa kahdesti. Kuva ei ole pakollinen.",
    },
  ],
  aatos: [
    {
      title: "Arki",
      body: "Korjaan kelloja, jotka ovat seisseet vuosia. Osa niistä saa jäädä väärään aikaan, jos omistaja niin haluaa.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Luen karttoja ja suunnittelen junamatkoja, jotka saavat odottaa. Asemalla on hyvä kahvi.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee edes saattamaan. Matkan ei tarvitse toteutua heti.",
    },
  ],
  kaisa: [
    {
      title: "Arki",
      body: "Pyöräilen töihin myös talvella. Kaakao on valmis heti, kun ovi sulkeutuu.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Pimeä ei haittaa, jos lamppu toimii. Viikonloppuna reitti on pidempi ja ilman kellotusta.",
    },
    {
      title: "Etsin",
      body: "Seuraa, joka ei valita pimeästä. Kaakaota riittää kahdelle.",
    },
  ],
  joel: [
    {
      title: "Arki",
      body: "Ravintola on joen varressa ja sali pieni. Maanantaina on hiljaista, ja silloin ruoka on parhaimmillaan.",
    },
    {
      title: "Vapaa-ajalla",
      body: "Sunnuntaina nukun pitkään ja kävelen torin läpi ilman listaa. En kokkaa kotona, jos ei ole pakko.",
    },
    {
      title: "Etsin",
      body: "Ihmistä, joka tulee syömään silloin, kun sali on tyhjä. Annoksen valitsen minä.",
    },
  ],
}

export function personNotes(id: string): PersonNote[] {
  return notes[id] ?? []
}
