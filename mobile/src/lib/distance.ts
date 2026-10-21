const cities: Record<string, [number, number]> = {
  helsinki: [60.1699, 24.9384],
  espoo: [60.2055, 24.6559],
  vantaa: [60.2934, 25.0378],
  kauniainen: [60.2096, 24.7276],
  kerava: [60.4034, 25.105],
  jarvenpaa: [60.4736, 25.0897],
  tuusula: [60.4038, 25.0264],
  hyvinkaa: [60.6296, 24.8596],
  nurmijarvi: [60.464, 24.807],
  kirkkonummi: [60.1236, 24.4386],
  sipoo: [60.3764, 25.2614],
  porvoo: [60.3932, 25.6653],
  lohja: [60.2486, 24.0653],
  vihti: [60.4169, 24.3197],
  raasepori: [59.974, 23.437],
  tampere: [61.4978, 23.761],
  nokia: [61.477, 23.505],
  ylojarvi: [61.549, 23.596],
  kangasala: [61.464, 24.077],
  pirkkala: [61.465, 23.647],
  lempaala: [61.314, 23.752],
  turku: [60.4518, 22.2666],
  raisio: [60.486, 22.169],
  kaarina: [60.407, 22.369],
  naantali: [60.468, 22.024],
  salo: [60.3833, 23.1333],
  oulu: [65.0121, 25.4651],
  jyvaskyla: [62.2426, 25.7473],
  lahti: [60.9827, 25.6612],
  kuopio: [62.8924, 27.677],
  rovaniemi: [66.5039, 25.7294],
  vaasa: [63.0951, 21.6165],
  pori: [61.4851, 21.7974],
  kouvola: [60.8681, 26.7042],
  joensuu: [62.601, 29.7636],
  lappeenranta: [61.0587, 28.1887],
  hameenlinna: [60.995, 24.464],
  seinajoki: [62.7903, 22.8403],
  kajaani: [64.2273, 27.7285],
  kokkola: [63.8385, 23.1307],
  rauma: [61.1272, 21.5113],
  mikkeli: [61.6886, 27.2724],
  kotka: [60.4664, 26.9458],
  savonlinna: [61.8681, 28.8864],
  kemi: [65.7361, 24.5636],
  tornio: [65.8481, 24.1466],
  iisalmi: [63.559, 27.1907],
  raahe: [64.6847, 24.4794],
  valkeakoski: [61.264, 24.031],
  aanekoski: [62.6, 25.727],
  hamina: [60.569, 27.198],
  imatra: [61.172, 28.771],
  kankaanpaa: [61.804, 22.395],
  pieksamaeki: [62.3, 27.164],
  varkaus: [62.315, 27.873],
  heinola: [61.205, 26.038],
  forsso: [60.815, 23.621],
  akaa: [61.167, 23.868],
  sastamala: [61.341, 22.909],
  huittinen: [61.176, 22.698],
  uimaharju: [63.05, 30.25],
}

function cityKey(city: string) {
  return city
    .trim()
    .toLocaleLowerCase("fi")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "")
}

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function knownCity(city: string) {
  return cityKey(city) in cities
}

export function distanceBetween(from: string, to: string) {
  const a = cities[cityKey(from)]
  const b = cities[cityKey(to)]
  if (!a || !b) return null
  return Math.round(haversine(a, b))
}
