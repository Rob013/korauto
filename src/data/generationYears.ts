// Real generation year data for automotive brands
// This data is based on actual automotive industry information and wikipedia sources

interface GenerationYearData {
  [manufacturerName: string]: {
    [modelName: string]: {
      [generationName: string]: {
        from_year: number;
        to_year: number;
      };
    };
  };
}

export const GENERATION_YEARS: GenerationYearData = {
  "BMW": {
    "3 Series": {
      "E30": { from_year: 1982, to_year: 1994 },
      "E36": { from_year: 1990, to_year: 2000 },
      "E46": { from_year: 1998, to_year: 2006 },
      "E90/E91/E92/E93": { from_year: 2005, to_year: 2013 },
      "F30/F31/F34/F35": { from_year: 2012, to_year: 2019 },
      "G20/G21": { from_year: 2019, to_year: 2025 }
    },
    "5 Series": {
      "E12": { from_year: 1972, to_year: 1981 },
      "E28": { from_year: 1981, to_year: 1988 },
      "E34": { from_year: 1988, to_year: 1996 },
      "E39": { from_year: 1995, to_year: 2003 },
      "E60/E61": { from_year: 2003, to_year: 2010 },
      "F10/F11/F07/F18": { from_year: 2010, to_year: 2017 },
      "G30/G31/G38": { from_year: 2017, to_year: 2025 }
    },
    "7 Series": {
      "E23": { from_year: 1977, to_year: 1986 },
      "E32": { from_year: 1986, to_year: 1994 },
      "E38": { from_year: 1994, to_year: 2001 },
      "E65/E66/E67/E68": { from_year: 2001, to_year: 2008 },
      "F01/F02/F03/F04": { from_year: 2008, to_year: 2015 },
      "G11/G12": { from_year: 2015, to_year: 2022 },
      "G70": { from_year: 2022, to_year: 2025 }
    },
    "X3": {
      "E83": { from_year: 2003, to_year: 2010 },
      "F25": { from_year: 2010, to_year: 2017 },
      "G01": { from_year: 2017, to_year: 2024 }
    },
    "X5": {
      "E53": { from_year: 1999, to_year: 2006 },
      "E70": { from_year: 2006, to_year: 2013 },
      "F15": { from_year: 2013, to_year: 2018 },
      "G05": { from_year: 2018, to_year: 2024 }
    }
  },
  "Mercedes-Benz": {
    "C-Class": {
      "W202": { from_year: 1993, to_year: 2000 },
      "W203": { from_year: 2000, to_year: 2007 },
      "W204": { from_year: 2007, to_year: 2014 },
      "W205": { from_year: 2014, to_year: 2021 },
      "W206": { from_year: 2021, to_year: 2025 }
    },
    "E-Class": {
      "W124": { from_year: 1984, to_year: 1995 },
      "W210": { from_year: 1995, to_year: 2002 },
      "W211": { from_year: 2002, to_year: 2009 },
      "W212": { from_year: 2009, to_year: 2016 },
      "W213": { from_year: 2016, to_year: 2024 }
    },
    "S-Class": {
      "W126": { from_year: 1979, to_year: 1991 },
      "W140": { from_year: 1991, to_year: 1998 },
      "W220": { from_year: 1998, to_year: 2005 },
      "W221": { from_year: 2005, to_year: 2013 },
      "W222": { from_year: 2013, to_year: 2020 },
      "W223": { from_year: 2020, to_year: 2024 }
    },
    "G-Class": {
      "W460": { from_year: 1979, to_year: 1991 },
      "W461": { from_year: 1991, to_year: 2024 },
      "W463": { from_year: 1989, to_year: 2018 },
      "W464": { from_year: 2018, to_year: 2024 }
    }
  },
  "Audi": {
    "A3": {
      "8L": { from_year: 1996, to_year: 2003 },
      "8P": { from_year: 2003, to_year: 2012 },
      "8V": { from_year: 2012, to_year: 2020 },
      "8Y": { from_year: 2020, to_year: 2025 }
    },
    "A4": {
      "B5": { from_year: 1994, to_year: 2001 },
      "B6": { from_year: 2000, to_year: 2005 },
      "B7": { from_year: 2004, to_year: 2008 },
      "B8": { from_year: 2007, to_year: 2015 },
      "B9": { from_year: 2015, to_year: 2024 }
    },
    "A6": {
      "C4": { from_year: 1994, to_year: 1997 },
      "C5": { from_year: 1997, to_year: 2004 },
      "C6": { from_year: 2004, to_year: 2011 },
      "C7": { from_year: 2011, to_year: 2018 },
      "C8": { from_year: 2020, to_year: 2025 }
    },
    "Q7": {
      "4L": { from_year: 2005, to_year: 2015 },
      "4M": { from_year: 2015, to_year: 2024 }
    }
  },
  "Volkswagen": {
    "Golf": {
      "Mk1": { from_year: 1974, to_year: 1983 },
      "Mk2": { from_year: 1983, to_year: 1991 },
      "Mk3": { from_year: 1991, to_year: 1997 },
      "Mk4": { from_year: 1997, to_year: 2003 },
      "Mk5": { from_year: 2003, to_year: 2008 },
      "Mk6": { from_year: 2008, to_year: 2012 },
      "Mk7": { from_year: 2012, to_year: 2019 },
      "Mk8": { from_year: 2019, to_year: 2024 }
    },
    "Passat": {
      "B1": { from_year: 1973, to_year: 1980 },
      "B2": { from_year: 1980, to_year: 1988 },
      "B3": { from_year: 1988, to_year: 1993 },
      "B4": { from_year: 1993, to_year: 1996 },
      "B5": { from_year: 1996, to_year: 2005 },
      "B6": { from_year: 2005, to_year: 2010 },
      "B7": { from_year: 2010, to_year: 2014 },
      "B8": { from_year: 2014, to_year: 2024 }
    }
  },
  "Toyota": {
    "Camry": {
      "V10": { from_year: 1982, to_year: 1986 },
      "V20": { from_year: 1986, to_year: 1991 },
      "V30": { from_year: 1991, to_year: 1996 },
      "V40": { from_year: 1996, to_year: 2001 },
      "V50": { from_year: 2001, to_year: 2006 },
      "V60": { from_year: 2006, to_year: 2011 },
      "V70": { from_year: 2011, to_year: 2017 },
      "V80": { from_year: 2017, to_year: 2024 }
    },
    "Corolla": {
      "E70": { from_year: 1979, to_year: 1983 },
      "E80": { from_year: 1983, to_year: 1987 },
      "E90": { from_year: 1987, to_year: 1991 },
      "E100": { from_year: 1991, to_year: 1995 },
      "E110": { from_year: 1995, to_year: 2000 },
      "E120": { from_year: 2000, to_year: 2006 },
      "E140/E150": { from_year: 2006, to_year: 2013 },
      "E170": { from_year: 2013, to_year: 2019 },
      "E210": { from_year: 2019, to_year: 2024 }
    },
    "Prius": {
      "XW10": { from_year: 1997, to_year: 2003 },
      "XW20": { from_year: 2003, to_year: 2009 },
      "XW30": { from_year: 2009, to_year: 2015 },
      "XW50": { from_year: 2015, to_year: 2022 },
      "XW60": { from_year: 2022, to_year: 2024 }
    }
  },
  "Honda": {
    "Civic": {
      "1st Gen": { from_year: 1972, to_year: 1979 },
      "2nd Gen": { from_year: 1979, to_year: 1983 },
      "3rd Gen": { from_year: 1983, to_year: 1987 },
      "4th Gen": { from_year: 1987, to_year: 1991 },
      "5th Gen": { from_year: 1991, to_year: 1995 },
      "6th Gen": { from_year: 1995, to_year: 2000 },
      "7th Gen": { from_year: 2000, to_year: 2005 },
      "8th Gen": { from_year: 2005, to_year: 2011 },
      "9th Gen": { from_year: 2011, to_year: 2015 },
      "10th Gen": { from_year: 2015, to_year: 2021 },
      "11th Gen": { from_year: 2021, to_year: 2024 }
    },
    "Accord": {
      "1st Gen": { from_year: 1976, to_year: 1981 },
      "2nd Gen": { from_year: 1981, to_year: 1985 },
      "3rd Gen": { from_year: 1985, to_year: 1989 },
      "4th Gen": { from_year: 1989, to_year: 1993 },
      "5th Gen": { from_year: 1993, to_year: 1997 },
      "6th Gen": { from_year: 1997, to_year: 2002 },
      "7th Gen": { from_year: 2002, to_year: 2007 },
      "8th Gen": { from_year: 2007, to_year: 2012 },
      "9th Gen": { from_year: 2012, to_year: 2017 },
      "10th Gen": { from_year: 2017, to_year: 2022 },
      "11th Gen": { from_year: 2022, to_year: 2024 }
    }
  },
  "Hyundai": {
    "Elantra": {
      "J1": { from_year: 1990, to_year: 1995 },
      "J2": { from_year: 1995, to_year: 2000 },
      "J3": { from_year: 2000, to_year: 2006 },
      "HD": { from_year: 2006, to_year: 2010 },
      "MD": { from_year: 2010, to_year: 2015 },
      "AD": { from_year: 2015, to_year: 2020 },
      "CN7": { from_year: 2020, to_year: 2024 }
    },
    "Sonata": {
      "Y1": { from_year: 1985, to_year: 1988 },
      "Y2": { from_year: 1988, to_year: 1993 },
      "Y3": { from_year: 1993, to_year: 1998 },
      "EF": { from_year: 1998, to_year: 2005 },
      "NF": { from_year: 2004, to_year: 2009 },
      "YF": { from_year: 2009, to_year: 2014 },
      "LF": { from_year: 2014, to_year: 2019 },
      "DN8": { from_year: 2019, to_year: 2024 }
    },
    "Tucson": {
      "JM": { from_year: 2004, to_year: 2009 },
      "LM": { from_year: 2009, to_year: 2015 },
      "TL": { from_year: 2015, to_year: 2020 },
      "NX4": { from_year: 2020, to_year: 2024 }
    }
  },
  "Kia": {
    "Optima": {
      "MS": { from_year: 2000, to_year: 2005 },
      "MG": { from_year: 2005, to_year: 2010 },
      "TF": { from_year: 2010, to_year: 2015 },
      "JF": { from_year: 2015, to_year: 2020 },
      "DL3": { from_year: 2020, to_year: 2024 }
    },
    "Sorento": {
      "BL": { from_year: 2002, to_year: 2009 },
      "XM": { from_year: 2009, to_year: 2015 },
      "UM": { from_year: 2015, to_year: 2020 },
      "MQ4": { from_year: 2020, to_year: 2024 }
    },
    "Sportage": {
      "JA": { from_year: 1993, to_year: 2002 },
      "KM": { from_year: 2004, to_year: 2010 },
      "SL": { from_year: 2010, to_year: 2015 },
      "QL": { from_year: 2015, to_year: 2021 },
      "NQ5": { from_year: 2021, to_year: 2024 }
    }
  },
  "Nissan": {
    "Altima": {
      "U13": { from_year: 1993, to_year: 1997 },
      "U14": { from_year: 1998, to_year: 2001 },
      "L31": { from_year: 2002, to_year: 2006 },
      "L32": { from_year: 2007, to_year: 2012 },
      "L33": { from_year: 2013, to_year: 2018 },
      "L34": { from_year: 2019, to_year: 2024 }
    },
    "Maxima": {
      "J30": { from_year: 1988, to_year: 1994 },
      "A32": { from_year: 1994, to_year: 1999 },
      "A33": { from_year: 1999, to_year: 2003 },
      "A34": { from_year: 2003, to_year: 2008 },
      "A35": { from_year: 2008, to_year: 2015 },
      "A36": { from_year: 2015, to_year: 2023 }
    },
    "Rogue": {
      "S35": { from_year: 2007, to_year: 2013 },
      "T32": { from_year: 2013, to_year: 2020 },
      "T33": { from_year: 2020, to_year: 2024 }
    }
  },
  "Ford": {
    "Focus": {
      "1st Gen": { from_year: 1998, to_year: 2004 },
      "2nd Gen": { from_year: 2004, to_year: 2010 },
      "3rd Gen": { from_year: 2010, to_year: 2018 },
      "4th Gen": { from_year: 2018, to_year: 2024 }
    },
    "Fusion": {
      "1st Gen": { from_year: 2005, to_year: 2012 },
      "2nd Gen": { from_year: 2012, to_year: 2020 }
    },
    "Mustang": {
      "1st Gen": { from_year: 1964, to_year: 1973 },
      "2nd Gen": { from_year: 1973, to_year: 1978 },
      "3rd Gen": { from_year: 1978, to_year: 1993 },
      "4th Gen": { from_year: 1993, to_year: 2004 },
      "5th Gen": { from_year: 2004, to_year: 2014 },
      "6th Gen": { from_year: 2014, to_year: 2024 }
    }
  },
  "Chevrolet": {
    "Camaro": {
      "1st Gen": { from_year: 1966, to_year: 1969 },
      "2nd Gen": { from_year: 1969, to_year: 1981 },
      "3rd Gen": { from_year: 1981, to_year: 1992 },
      "4th Gen": { from_year: 1992, to_year: 2002 },
      "5th Gen": { from_year: 2009, to_year: 2015 },
      "6th Gen": { from_year: 2015, to_year: 2024 }
    },
    "Corvette": {
      "C1": { from_year: 1953, to_year: 1962 },
      "C2": { from_year: 1963, to_year: 1967 },
      "C3": { from_year: 1968, to_year: 1982 },
      "C4": { from_year: 1984, to_year: 1996 },
      "C5": { from_year: 1997, to_year: 2004 },
      "C6": { from_year: 2005, to_year: 2013 },
      "C7": { from_year: 2014, to_year: 2019 },
      "C8": { from_year: 2020, to_year: 2024 }
    },
    "Malibu": {
      "1st Gen": { from_year: 1964, to_year: 1972 },
      "2nd Gen": { from_year: 1973, to_year: 1977 },
      "3rd Gen": { from_year: 1978, to_year: 1983 },
      "4th Gen": { from_year: 1997, to_year: 2003 },
      "5th Gen": { from_year: 2004, to_year: 2007 },
      "6th Gen": { from_year: 2008, to_year: 2012 },
      "7th Gen": { from_year: 2013, to_year: 2015 },
      "8th Gen": { from_year: 2016, to_year: 2024 }
    }
  }
};

// Function to get generation years by manufacturer, model, and generation name
export const getGenerationYears = (
  manufacturerName: string,
  modelName: string,
  generationName: string
): { from_year?: number; to_year?: number } | null => {
  const manufacturer = GENERATION_YEARS[manufacturerName];
  if (!manufacturer) return null;

  const model = manufacturer[modelName];
  if (!model) return null;

  const generation = model[generationName];
  if (!generation) return null;

  return generation;
};

// Function to find generation years by partial matching
export const findGenerationYears = (
  manufacturerName: string,
  modelName: string,
  generationName: string
): { from_year?: number; to_year?: number } | null => {
  const manufacturer = GENERATION_YEARS[manufacturerName];
  if (!manufacturer) return null;

  // Try exact model match first
  let model = manufacturer[modelName];
  
  // If no exact match, try partial matching
  if (!model) {
    const modelKeys = Object.keys(manufacturer);
    const fuzzyModelMatch = modelKeys.find(key => 
      (key || '').toLowerCase().includes((modelName || '').toLowerCase()) ||
      (modelName || '').toLowerCase().includes((key || '').toLowerCase())
    );
    if (fuzzyModelMatch) {
      model = manufacturer[fuzzyModelMatch];
    }
  }

  if (!model) return null;

  // Try exact generation match first
  let generation = model[generationName];
  
  // If no exact match, try partial matching
  if (!generation) {
    const generationKeys = Object.keys(model);
    const fuzzyGenerationMatch = generationKeys.find(key =>
      (key || '').toLowerCase().includes((generationName || '').toLowerCase()) ||
      (generationName || '').toLowerCase().includes((key || '').toLowerCase())
    );
    if (fuzzyGenerationMatch) {
      generation = model[fuzzyGenerationMatch];
    }
  }

  if (!generation) return null;

  return generation;
};

// Function to get all available models for a manufacturer
export const getManufacturerModels = (manufacturerName: string): string[] => {
  const manufacturer = GENERATION_YEARS[manufacturerName];
  return manufacturer ? Object.keys(manufacturer) : [];
};

// Function to get all available generations for a model
export const getModelGenerations = (manufacturerName: string, modelName: string): string[] => {
  const manufacturer = GENERATION_YEARS[manufacturerName];
  if (!manufacturer) return [];

  const model = manufacturer[modelName];
  return model ? Object.keys(model) : [];
};