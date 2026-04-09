export type Pairing =
  | { kind: "match"; home: string; away: string; score?: { home: number; away: number } }
  | { kind: "bye"; team: string };

export type RoundDef = {
  label: string;
  group: "A" | "B";
  week: number;
  dateYMD: string;
  games: Pairing[];
};


export const ROUNDS: RoundDef[] = [
  {
    "label": "A1",
    "group": "A",
    "week": 1,
    "dateYMD": "2025-05-17",
    "games": [
      {
        "kind": "bye",
        "team": "Katimba"
      },
      {
        "kind": "match",
        "home": "BSC",
        "away": "Cobbe Stingers",
        "score": {
          "home": 14,
          "away": 22
        }
      },
      {
        "kind": "match",
        "home": "BWB",
        "away": "Kapichira",
        "score": {
          "home": 8,
          "away": 28
        }
      },
      {
        "kind": "match",
        "home": "Nkula Bees",
        "away": "White Eagles",
        "score": {
          "home": 14,
          "away": 22
        }
      }
    ]
  },
  {
    "label": "B1",
    "group": "B",
    "week": 1,
    "dateYMD": "2025-05-17",
    "games": [
      {
        "kind": "bye",
        "team": "MUBAS Falcons"
      },
      {
        "kind": "match",
        "home": "MIE Spears",
        "away": "Tedzani",
        "score": {
          "home": 0,
          "away": 0
        }
      },
      {
        "kind": "match",
        "home": "MUBAS Ice",
        "away": "Newlands Socials",
        "score": {
          "home": 21,
          "away": 15
        }
      },
      {
        "kind": "match",
        "home": "Mighty Arrows",
        "away": "NTE Arrows",
        "score": {
          "home": 19,
          "away": 17
        }
      }
    ]
  },
  {
    "label": "A2",
    "group": "A",
    "week": 2,
    "dateYMD": "2025-05-24",
    "games": [
      {
        "kind": "bye",
        "team": "White Eagles"
      },
      {
        "kind": "match",
        "home": "Cobbe Stingers",
        "away": "BWB",
        "score": {
          "home": 27,
          "away": 9
        }
      },
      {
        "kind": "match",
        "home": "Kapichira",
        "away": "Nkula Bees",
        "score": {
          "home": 20,
          "away": 16
        }
      },
      {
        "kind": "match",
        "home": "Katimba",
        "away": "BSC",
        "score": {
          "home": 18,
          "away": 18
        }
      }
    ]
  },
  {
    "label": "B2",
    "group": "B",
    "week": 2,
    "dateYMD": "2025-05-24",
    "games": [
      {
        "kind": "bye",
        "team": "Tedzani"
      },
      {
        "kind": "match",
        "home": "MUBAS Falcons",
        "away": "MUBAS Ice"
      },
      {
        "kind": "match",
        "home": "NTE Arrows",
        "away": "MIE Spears"
      },
      {
        "kind": "match",
        "home": "Newlands Socials",
        "away": "Mighty Arrows",
        "score": {
          "home": 8,
          "away": 28
        }
      }
    ]
  },
  {
    "label": "A3",
    "group": "A",
    "week": 3,
    "dateYMD": "2025-05-31",
    "games": [
      {
        "kind": "bye",
        "team": "BSC"
      },
      {
        "kind": "match",
        "home": "BWB",
        "away": "Katimba",
        "score": {
          "home": 12,
          "away": 24
        }
      },
      {
        "kind": "match",
        "home": "Nkula Bees",
        "away": "Cobbe Stingers",
        "score": {
          "home": 11,
          "away": 25
        }
      },
      {
        "kind": "match",
        "home": "White Eagles",
        "away": "Kapichira",
        "score": {
          "home": 24,
          "away": 12
        }
      }
    ]
  },
  {
    "label": "B3",
    "group": "B",
    "week": 3,
    "dateYMD": "2025-05-31",
    "games": [
      {
        "kind": "bye",
        "team": "MUBAS Falcons"
      },
      {
        "kind": "match",
        "home": "MIE Spears",
        "away": "Newlands Socials"
      },
      {
        "kind": "match",
        "home": "Mighty Arrows",
        "away": "MUBAS Ice"
      },
      {
        "kind": "match",
        "home": "Tedzani",
        "away": "NTE Arrows"
      }
    ]
  },
  {
    "label": "A4",
    "group": "A",
    "week": 4,
    "dateYMD": "2025-06-14",
    "games": [
      {
        "kind": "bye",
        "team": "Kapichira"
      },
      {
        "kind": "match",
        "home": "BSC",
        "away": "BWB",
        "score": {
          "home": 25,
          "away": 11
        }
      },
      {
        "kind": "match",
        "home": "Cobbe Stingers",
        "away": "White Eagles",
        "score": {
          "home": 23,
          "away": 13
        }
      },
      {
        "kind": "match",
        "home": "Katimba",
        "away": "Nkula Bees",
        "score": {
          "home": 15,
          "away": 21
        }
      }
    ]
  },
  {
    "label": "B4",
    "group": "B",
    "week": 4,
    "dateYMD": "2025-06-14",
    "games": [
      {
        "kind": "match",
        "home": "MIE Spears",
        "away": "Mighty Arrows"
      },
      {
        "kind": "match",
        "home": "MUBAS Ice",
        "away": "MUBAS Falcons",
        "score": {
          "home": 26,
          "away": 10
        }
      },
      {
        "kind": "match",
        "home": "MUBAS Ice",
        "away": "NTE Arrows",
        "score": {
          "home": 28,
          "away": 8
        }
      },
      {
        "kind": "match",
        "home": "Newlands Socials",
        "away": "Tedzani",
        "score": {
          "home": 17,
          "away": 19
        }
      }
    ]
  },
  {
    "label": "A5",
    "group": "A",
    "week": 5,
    "dateYMD": "2025-06-21",
    "games": [
      {
        "kind": "bye",
        "team": "BWB"
      },
      {
        "kind": "match",
        "home": "Kapichira",
        "away": "Cobbe Stingers",
        "score": {
          "home": 17,
          "away": 19
        }
      },
      {
        "kind": "match",
        "home": "Nkula Bees",
        "away": "BSC",
        "score": {
          "home": 12,
          "away": 24
        }
      },
      {
        "kind": "match",
        "home": "White Eagles",
        "away": "Katimba",
        "score": {
          "home": 23,
          "away": 13
        }
      }
    ]
  },
  {
    "label": "B5",
    "group": "B",
    "week": 5,
    "dateYMD": "2025-06-21",
    "games": [
      {
        "kind": "bye",
        "team": "MUBAS Falcons"
      },
      {
        "kind": "match",
        "home": "MUBAS Ice",
        "away": "MIE Spears"
      },
      {
        "kind": "match",
        "home": "NTE Arrows",
        "away": "Newlands Socials",
        "score": {
          "home": 27,
          "away": 9
        }
      },
      {
        "kind": "match",
        "home": "Tedzani",
        "away": "MUBAS Falcons",
        "score": {
          "home": 20,
          "away": 16
        }
      },
      {
        "kind": "match",
        "home": "Tedzani",
        "away": "Mighty Arrows",
        "score": {
          "home": 12,
          "away": 24
        }
      }
    ]
  },
  {
    "label": "A6",
    "group": "A",
    "week": 6,
    "dateYMD": "2025-07-12",
    "games": [
      {
        "kind": "bye",
        "team": "Cobbe Stingers"
      },
      {
        "kind": "match",
        "home": "BSC",
        "away": "White Eagles",
        "score": {
          "home": 16,
          "away": 20
        }
      },
      {
        "kind": "match",
        "home": "BWB",
        "away": "Nkula Bees",
        "score": {
          "home": 18,
          "away": 18
        }
      },
      {
        "kind": "match",
        "home": "Katimba",
        "away": "Kapichira",
        "score": {
          "home": 11,
          "away": 25
        }
      }
    ]
  },
  {
    "label": "B6",
    "group": "B",
    "week": 6,
    "dateYMD": "2025-07-12",
    "games": [
      {
        "kind": "match",
        "home": "MUBAS Falcons",
        "away": "Newlands Socials",
        "score": {
          "home": 14,
          "away": 22
        }
      },
      {
        "kind": "match",
        "home": "Mighty Arrows",
        "away": "MUBAS Ice",
        "score": {
          "home": 17,
          "away": 19
        }
      },
      {
        "kind": "match",
        "home": "NTE Arrows",
        "away": "Tedzani",
        "score": {
          "home": 25,
          "away": 11
        }
      }
    ]
  },
  {
    "label": "A7",
    "group": "A",
    "week": 7,
    "dateYMD": "2025-08-02",
    "games": [
      {
        "kind": "bye",
        "team": "Nkula Bees"
      },
      {
        "kind": "match",
        "home": "Cobbe Stingers",
        "away": "Katimba",
        "score": {
          "home": 29,
          "away": 7
        }
      },
      {
        "kind": "match",
        "home": "Kapichira",
        "away": "BSC",
        "score": {
          "home": 17,
          "away": 19
        }
      },
      {
        "kind": "match",
        "home": "White Eagles",
        "away": "BWB",
        "score": {
          "home": 24,
          "away": 12
        }
      }
    ]
  },
  {
    "label": "B7",
    "group": "B",
    "week": 7,
    "dateYMD": "2025-08-02",
    "games": [
      {
        "kind": "match",
        "home": "MUBAS Falcons",
        "away": "MIE Spears"
      },
      {
        "kind": "match",
        "home": "MUBAS Falcons",
        "away": "Mighty Arrows",
        "score": {
          "home": 16,
          "away": 20
        }
      },
      {
        "kind": "match",
        "home": "MUBAS Falcons",
        "away": "NTE Arrows",
        "score": {
          "home": 10,
          "away": 26
        }
      },
      {
        "kind": "match",
        "home": "Tedzani",
        "away": "MUBAS Ice",
        "score": {
          "home": 11,
          "away": 25
        }
      }
    ]
  },
  {
    "label": "A8",
    "group": "A",
    "week": 8,
    "dateYMD": "2025-08-16",
    "games": [
      {
        "kind": "bye",
        "team": "Nkula Bees"
      },
      {
        "kind": "match",
        "home": "BSC",
        "away": "Kapichira",
        "score": {
          "home": 17,
          "away": 19
        }
      },
      {
        "kind": "match",
        "home": "BWB",
        "away": "White Eagles",
        "score": {
          "home": 7,
          "away": 29
        }
      },
      {
        "kind": "match",
        "home": "Katimba",
        "away": "Cobbe Stingers",
        "score": {
          "home": 9,
          "away": 27
        }
      }
    ]
  },
  {
    "label": "B8",
    "group": "B",
    "week": 8,
    "dateYMD": "2025-08-16",
    "games": [
      {
        "kind": "match",
        "home": "Mighty Arrows",
        "away": "Tedzani",
        "score": {
          "home": 26,
          "away": 10
        }
      },
      {
        "kind": "match",
        "home": "NTE Arrows",
        "away": "MUBAS Ice",
        "score": {
          "home": 15,
          "away": 21
        }
      },
      {
        "kind": "match",
        "home": "Newlands Socials",
        "away": "MUBAS Falcons",
        "score": {
          "home": 18,
          "away": 18
        }
      }
    ]
  },
  {
    "label": "A9",
    "group": "A",
    "week": 9,
    "dateYMD": "2025-08-23",
    "games": [
      {
        "kind": "bye",
        "team": "Cobbe Stingers"
      },
      {
        "kind": "match",
        "home": "Kapichira",
        "away": "Katimba",
        "score": {
          "home": 24,
          "away": 12
        }
      },
      {
        "kind": "match",
        "home": "Nkula Bees",
        "away": "BWB",
        "score": {
          "home": 27,
          "away": 9
        }
      },
      {
        "kind": "match",
        "home": "White Eagles",
        "away": "BSC",
        "score": {
          "home": 20,
          "away": 16
        }
      }
    ]
  },
  {
    "label": "B9",
    "group": "B",
    "week": 9,
    "dateYMD": "2025-08-23",
    "games": [
      {
        "kind": "match",
        "home": "MUBAS Ice",
        "away": "MUBAS Falcons",
        "score": {
          "home": 25,
          "away": 11
        }
      },
      {
        "kind": "match",
        "home": "Mighty Arrows",
        "away": "Newlands Socials",
        "score": {
          "home": 17,
          "away": 19
        }
      },
      {
        "kind": "match",
        "home": "Tedzani",
        "away": "NTE Arrows",
        "score": {
          "home": 17,
          "away": 19
        }
      }
    ]
  },
  {
    "label": "A10",
    "group": "A",
    "week": 10,
    "dateYMD": "2025-10-11",
    "games": [
      {
        "kind": "bye",
        "team": "BWB"
      },
      {
        "kind": "match",
        "home": "BSC",
        "away": "Nkula Bees",
        "score": {
          "home": 20,
          "away": 16
        }
      },
      {
        "kind": "match",
        "home": "Cobbe Stingers",
        "away": "Kapichira"
      },
      {
        "kind": "match",
        "home": "Katimba",
        "away": "White Eagles",
        "score": {
          "home": 12,
          "away": 24
        }
      }
    ]
  },
  {
    "label": "B10",
    "group": "B",
    "week": 10,
    "dateYMD": "2025-10-11",
    "games": [
      {
        "kind": "match",
        "home": "MUBAS Falcons",
        "away": "Tedzani",
        "score": {
          "home": 17,
          "away": 19
        }
      },
      {
        "kind": "match",
        "home": "MUBAS Ice",
        "away": "Mighty Arrows",
        "score": {
          "home": 24,
          "away": 12
        }
      },
      {
        "kind": "match",
        "home": "Newlands Socials",
        "away": "NTE Arrows",
        "score": {
          "home": 15,
          "away": 21
        }
      }
    ]
  },
  {
    "label": "A11",
    "group": "A",
    "week": 11,
    "dateYMD": "2025-10-18",
    "games": [
      {
        "kind": "bye",
        "team": "Kapichira"
      },
      {
        "kind": "match",
        "home": "BWB",
        "away": "BSC",
        "score": {
          "home": 13,
          "away": 23
        }
      },
      {
        "kind": "match",
        "home": "Nkula Bees",
        "away": "Katimba"
      },
      {
        "kind": "match",
        "home": "White Eagles",
        "away": "Cobbe Stingers"
      }
    ]
  },
  {
    "label": "B11",
    "group": "B",
    "week": 11,
    "dateYMD": "2025-10-18",
    "games": [
      {
        "kind": "bye",
        "team": "NTE Arrows"
      },
      {
        "kind": "match",
        "home": "MUBAS Ice",
        "away": "Tedzani",
        "score": {
          "home": 24,
          "away": 12
        }
      },
      {
        "kind": "match",
        "home": "Tedzani",
        "away": "Newlands Socials",
        "score": {
          "home": 25,
          "away": 11
        }
      }
    ]
  },
  {
    "label": "A12",
    "group": "A",
    "week": 12,
    "dateYMD": "2025-11-01",
    "games": [
      {
        "kind": "bye",
        "team": "BSC"
      },
      {
        "kind": "match",
        "home": "Cobbe Stingers",
        "away": "Nkula Bees"
      },
      {
        "kind": "match",
        "home": "Kapichira",
        "away": "White Eagles"
      },
      {
        "kind": "match",
        "home": "Katimba",
        "away": "BWB"
      }
    ]
  },
  {
    "label": "B12",
    "group": "B",
    "week": 12,
    "dateYMD": "2025-11-01",
    "games": [
      {
        "kind": "bye",
        "team": "MUBAS Ice"
      },
      {
        "kind": "match",
        "home": "MUBAS Falcons",
        "away": "Mighty Arrows",
        "score": {
          "home": 19,
          "away": 0
        }
      },
      {
        "kind": "match",
        "home": "NTE Arrows",
        "away": "Tedzani"
      },
      {
        "kind": "match",
        "home": "Newlands Socials",
        "away": "MIE Spears"
      }
    ]
  },
  {
    "label": "A13",
    "group": "A",
    "week": 13,
    "dateYMD": "2025-11-08",
    "games": [
      {
        "kind": "bye",
        "team": "White Eagles"
      },
      {
        "kind": "match",
        "home": "BSC",
        "away": "Katimba"
      },
      {
        "kind": "match",
        "home": "BWB",
        "away": "Cobbe Stingers"
      },
      {
        "kind": "match",
        "home": "Nkula Bees",
        "away": "Kapichira"
      }
    ]
  },
  {
    "label": "B13",
    "group": "B",
    "week": 13,
    "dateYMD": "2025-11-08",
    "games": [
      {
        "kind": "bye",
        "team": "Tedzani"
      },
      {
        "kind": "match",
        "home": "MIE Spears",
        "away": "NTE Arrows"
      },
      {
        "kind": "match",
        "home": "MUBAS Ice",
        "away": "MUBAS Falcons"
      },
      {
        "kind": "match",
        "home": "Mighty Arrows",
        "away": "Newlands Socials"
      }
    ]
  },
  {
    "label": "A14",
    "group": "A",
    "week": 14,
    "dateYMD": "2025-11-15",
    "games": [
      {
        "kind": "bye",
        "team": "Katimba"
      },
      {
        "kind": "match",
        "home": "Cobbe Stingers",
        "away": "BSC"
      },
      {
        "kind": "match",
        "home": "Kapichira",
        "away": "BWB"
      },
      {
        "kind": "match",
        "home": "White Eagles",
        "away": "Nkula Bees"
      }
    ]
  },
  {
    "label": "B14",
    "group": "B",
    "week": 14,
    "dateYMD": "2025-11-15",
    "games": [
      {
        "kind": "bye",
        "team": "MUBAS Falcons"
      },
      {
        "kind": "match",
        "home": "NTE Arrows",
        "away": "Mighty Arrows"
      },
      {
        "kind": "match",
        "home": "Newlands Socials",
        "away": "MUBAS Ice"
      },
      {
        "kind": "match",
        "home": "Tedzani",
        "away": "MIE Spears"
      }
    ]
  }
]

export default ROUNDS;
