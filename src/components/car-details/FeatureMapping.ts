// Move feature mapping to separate file to reduce main bundle size
export const FEATURE_MAPPING: { [key: string]: string } = {
  // String format (with leading zeros)
  "001": "Klimatizimi",
  "002": "Dritaret Elektrike",
  "003": "Mbyllja Qendrore",
  "004": "Frena ABS",
  "005": "Airbag Sistemi",
  "006": "Radio/Sistemi Audio",
  "007": "CD Player",
  "008": "Bluetooth",
  "009": "Navigacioni GPS",
  "010": "Kamera e Prapme",
  "011": "Sensorët e Parkimit",
  "012": "Kontrolli i Kursimit",
  "013": "Sistemi Start/Stop",
  "014": "Dritat LED",
  "015": "Dritat Xenon",
  "016": "Pasqyrat Elektrike",
  "017": "Pasqyrat e Ngrohura",
  "018": "Kontrolli Elektronik i Stabilitetit",
  "019": "Sistemi Kundër Bllokimit",
  "020": "Kontrolli i Traksionit",
  "021": "Distribimi Elektronik i Forcës së Frënimit",
  "022": "Sistemi i Monitorimit të Presionit të Gomas",
  "023": "Sistemi i Paralajmërimit të Largimit nga Korsia",
  "024": "Kontrolli Adaptiv i Kursimit",
  "025": "Sistemi i Paralajmërimit të Kolizionit",
  "026": "Frënimi Emergjent Automatik",
  "027": "Kontrolli i Bordit Elektronik",
  "028": "Sistemi Keyless",
  "029": "Filteri i Grimcave",
  "030": "Sistemi i Kontrollit të Stabilitetit",
  "031": "Rrota e Rezervës",
  "032": "Kompleti i RIPARIM të Gomas",
  "033": "Kapaku i Motorit",
  "034": "Spoiler i Prapëm",
  "035": "Rrota Alumini",
  "036": "Rrota Çeliku",
  "037": "Sistemi i Ngrohjes së Ulëseve",
  "038": "Ulëset e Lëkurës",
  "039": "Ulëset e Tekstilit",
  "040": "Kontrolli Elektrik i Ulëseve",
  "041": "Dritaret me Tinte",
  "042": "Sistemi i Alarmshmërisë",
  "043": "Imobilizuesi",
  "044": "Kopja e Çelësave",
  "045": "Kontrolli i Temperaturës",
  "046": "Ventilimi Automatik",
  "047": "Sistemi i Pastrimit të Dritareve",
  "048": "Sistemi i Ujit të Xhamit",
  "049": "Defogger i Prapëm",
  "050": "Sistemi i Ndriçimit të Brendshëm",
  // Extended mapping for higher codes
  "1001": "Pasqyra Anësore me Palosje Elektrike",
  "1002": "Pasqyrë e Brendshme ECM",
  "1003": "Hi Pass",
  "1004": "Timon me Drejtim Elektrik",
  "1005": "Dritare Elektrike",
  "1006": "Çelës Inteligjent",
  "1007": "Navigacion",
  "1008": "Monitor AV i Përparmë",
  "1009": "Terminal USB",
  "1010": "Sedilje Lëkure",
  "1011": "Sedilje të Përparme me Ngrohje",
  "1012": "Bllokim Elektrik i Dyerve",
  "1013": "Airbag për Pasagjerin",
  "1014": "Frena ABS",
  "1015": "Sistemi TCS",
  "1016": "Sistemi ESC",
  "1017": "Sistemi TPMS",
  "1018": "Sensor Parkimi i Pasmë",
  "1019": "Kamera e Pasme",
  "1020": "Bllokim Dyersh pa Tel",
};

export const convertOptionsToNames = (options: any): any => {
  console.log("🔧 Converting options:", options);
  if (!options) return {
    standard: [],
    choice: [],
    tuning: []
  };
  const result: any = {
    standard: [],
    choice: [],
    tuning: []
  };

  // Process standard equipment
  if (options.standard && Array.isArray(options.standard)) {
    result.standard = options.standard.map((option: any) => {
      const optionStr = option.toString().trim();
      const mapped = FEATURE_MAPPING[optionStr];
      if (mapped) {
        console.log(`📝 Mapping: ${optionStr} → ${mapped}`);
        return mapped;
      } else {
        console.log(`⚠️ No mapping found for: ${optionStr}, showing raw value`);
        return optionStr;
      }
    });
  }

  // Process optional equipment
  if (options.choice && Array.isArray(options.choice)) {
    result.choice = options.choice.map((option: any) => {
      const optionStr = option.toString().trim();
      const mapped = FEATURE_MAPPING[optionStr];
      return mapped || optionStr;
    });
  }

  // Process tuning/modifications
  if (options.tuning && Array.isArray(options.tuning)) {
    result.tuning = options.tuning.map((option: any) => {
      const optionStr = option.toString().trim();
      const mapped = FEATURE_MAPPING[optionStr];
      return mapped || optionStr;
    });
  }
  
  console.log("✅ Converted options:", result);
  return result;
};
