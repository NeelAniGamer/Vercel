// Legacy Academy level data + UI layer.
// NOTE: Scoped inside an IIFE on purpose — Cyberpunk/Traffic.html loads this file
// but defines its own inline LVS/BADGES/ui. Exposing globals here would cause
// "Identifier has already been declared" errors and crash that page.
;(function () {
const LVS = [
  {
    "id": 1,
    "icon": "ðŸš¦",
    "name": "Traffic Signals",
    "v": "ðŸš— Car",
    "col": "#e74c3c",
    "gr": "linear-gradient(135deg,#c0392b,#e74c3c)",
    "tg": "Master Junction Management",
    "ds": "Navigate intersection signal arrays correctly. Absolute stop lines apply.",
    "hps": [
      "Red configuration: Absolute stop priority.",
      "Yellow indicator: Safely decelerate.",
      "Green signal: Safely cross intersection bounds."
    ],
    "law": {
      "sec": "Section 119, Motor Vehicles Act 1988",
      "fine": "â‚¹500",
      "off": "Jumping automated signals"
    },
    "theory": "Automated signal synchronization patterns direct city flow constraints efficiently.",
    "pract": "Navigate the Andheri Junction grid. Obey all traffic signals at 8 intersections. Red means stop, green means go.",
    "quiz": {
      "car": [
        {
          "q": "What does an active yellow signal mean?",
          "o": [
            "Speed up before it turns red",
            "Slow down and get ready to stop",
            "Honk the horn"
          ],
          "a": 1
        },
        {
          "q": "What is the fine for running a red light?",
          "o": [
            "â‚¹100",
            "â‚¹500",
            "â‚¹2,000"
          ],
          "a": 1
        },
        {
          "q": "Which law covers traffic signal rules?",
          "o": [
            "Section 119, MV Act",
            "Section 177, MV Act",
            "Municipal Act"
          ],
          "a": 0
        }
      ],
      "pedestrian": [
        {
          "q": "What does an active yellow signal mean?",
          "o": [
            "Speed up before it turns red",
            "Slow down and get ready to stop",
            "Honk the horn"
          ],
          "a": 1
        },
        {
          "q": "What is the fine for running a red light?",
          "o": [
            "â‚¹100",
            "â‚¹500",
            "â‚¹2,000"
          ],
          "a": 1
        },
        {
          "q": "Which law covers traffic signal rules?",
          "o": [
            "Section 119, MV Act",
            "Section 177, MV Act",
            "Municipal Act"
          ],
          "a": 0
        }
      ],
      "final": [
        {
          "q": "What does an active yellow signal mean?",
          "o": [
            "Speed up before it turns red",
            "Slow down and get ready to stop",
            "Honk the horn"
          ],
          "a": 1
        },
        {
          "q": "What is the fine for running a red light?",
          "o": [
            "â‚¹100",
            "â‚¹500",
            "â‚¹2,000"
          ],
          "a": 1
        },
        {
          "q": "Which law covers traffic signal rules?",
          "o": [
            "Section 119, MV Act",
            "Section 177, MV Act",
            "Municipal Act"
          ],
          "a": 0
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 2,
    "icon": "ðŸš¶",
    "name": "Zebra Crossings",
    "v": "ðŸš¶ Pedestrian",
    "col": "#27ae60",
    "gr": "linear-gradient(135deg,#1e8449,#27ae60)",
    "tg": "Pedestrian Right-of-Way",
    "ds": "Manage street crossings. Yield cleanly to active crosswalk users.",
    "hps": [
      "Zebra lanes give absolute pedestrian right of way.",
      "Always yield when pedestrians step off the curb bounds."
    ],
    "law": {
      "sec": "Section 140, Motor Vehicles Act 1988",
      "fine": "â‚¹100",
      "off": "Failure to yield at crosswalk markings"
    },
    "theory": "Pedestrian safety grids reduce vehicle conflict metrics inside highly dense urban zones.",
    "pract": "Walk safely across Dadar Junction. Use zebra crossings and wait for green signals before crossing busy roads.",
    "quiz": {
      "car": [
        {
          "q": "Who holds the right of way at zebra crossings?",
          "o": [
            "Trucks and buses",
            "Pedestrians",
            "Two-wheelers"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "Who holds the right of way at zebra crossings?",
          "o": [
            "Trucks and buses",
            "Pedestrians",
            "Two-wheelers"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "Who holds the right of way at zebra crossings?",
          "o": [
            "Trucks and buses",
            "Pedestrians",
            "Two-wheelers"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 3,
    "icon": "â›‘ï¸",
    "name": "Helmet Security",
    "v": "ðŸï¸ Two-Wheeler",
    "col": "#f39c12",
    "gr": "linear-gradient(135deg,#d68910,#f39c12)",
    "tg": "Protective Safety Gear",
    "ds": "Secure BIS certified protective gear before igniting two-wheeler engine loops.",
    "hps": [
      "ISI-marked certified safety helmet is mandatory for all occupants.",
      "Chin straps must be anchored tight."
    ],
    "law": {
      "sec": "Section 194D, Motor Vehicles Act 1988",
      "fine": "â‚¹1,000",
      "off": "Operating two-wheeler without protective headgear"
    },
    "theory": "Fastened safety headgear mitigates impact severity metrics significantly.",
    "pract": "Ride your two-wheeler through the narrow Bandra backroads. Collect your helmet before riding.",
    "quiz": {
      "car": [
        {
          "q": "What is the helmet rule for bike riders?",
          "o": [
            "Helmets are not needed for the passenger",
            "Both rider and passenger must wear helmets",
            "Only the driver needs a helmet"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "What is the helmet rule for bike riders?",
          "o": [
            "Helmets are not needed for the passenger",
            "Both rider and passenger must wear helmets",
            "Only the driver needs a helmet"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "What is the helmet rule for bike riders?",
          "o": [
            "Helmets are not needed for the passenger",
            "Both rider and passenger must wear helmets",
            "Only the driver needs a helmet"
          ],
          "a": 1
        }
      ],
      "bike": [
        {
          "q": "What is the helmet rule for bike riders?",
          "o": [
            "Helmets are not needed for the passenger",
            "Both rider and passenger must wear helmets",
            "Only the driver needs a helmet"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian",
      "bike"
    ]
  },
  {
    "id": 4,
    "icon": "ðŸ’º",
    "name": "Seat Belt Challenge",
    "v": "ðŸš— Car",
    "col": "#2980b9",
    "gr": "linear-gradient(135deg,#1f618d,#2980b9)",
    "tg": "Cabin Restraint Systems",
    "ds": "Complete cabin validation routines prior to shifting transmission nodes.",
    "hps": [
      "Seat belts are required for all seating positions.",
      "Buckle logic must engage before vehicle goes into drive."
    ],
    "law": {
      "sec": "Section 194B, Motor Vehicles Act 1988",
      "fine": "â‚¹1,000",
      "off": "Driving without wearing a seat belt"
    },
    "theory": "Restraint systems prevent structural collision trajectory deviations during deceleration events.",
    "pract": "Execute pre-drive loop verification sequence: Mirror alignment -> Restraint engagement -> Shift to Drive.",
    "quiz": {
      "car": [
        {
          "q": "When must seat belts be locked?",
          "o": [
            "After getting on the highway",
            "Before you start driving",
            "Only when encountering police details"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "When must seat belts be locked?",
          "o": [
            "After getting on the highway",
            "Before you start driving",
            "Only when encountering police details"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "When must seat belts be locked?",
          "o": [
            "After getting on the highway",
            "Before you start driving",
            "Only when encountering police details"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 5,
    "icon": "ðŸšŒ",
    "name": "School Bus Safety",
    "v": "ðŸšŒ BEST Bus",
    "col": "#d4ac0d",
    "gr": "linear-gradient(135deg,#b7950b,#d4ac0d)",
    "tg": "School Zone Containment",
    "ds": "Operate multi-passenger transit units inside restricted school facility boundaries.",
    "hps": [
      "School perimeter maximum threshold is strictly set at 30 km/h.",
      "Deploy caution light arrays while embarking passengers."
    ],
    "law": {
      "sec": "Section 112, Motor Vehicles Act 1988",
      "fine": "â‚¹2,000",
      "off": "Exceeding speed limit near schools"
    },
    "theory": "School speed zones protect variable pedestrian trajectories from collision energy transfers.",
    "pract": "Drive the BEST bus through Parel school zone streets. Stay under 30 km/h near the school.",
    "quiz": {
      "car": [
        {
          "q": "What is the speed limit in school zones?",
          "o": [
            "50 km/h",
            "30 km/h",
            "No special restriction"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "What is the speed limit in school zones?",
          "o": [
            "50 km/h",
            "30 km/h",
            "No special restriction"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "What is the speed limit in school zones?",
          "o": [
            "50 km/h",
            "30 km/h",
            "No special restriction"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 6,
    "icon": "ðŸš†",
    "name": "Railway Crossing",
    "v": "ðŸš— Car",
    "col": "#8e44ad",
    "gr": "linear-gradient(135deg,#6c3483,#8e44ad)",
    "tg": "Grade Separation Intersections",
    "ds": "Halt safely at rail infrastructure interfaces. Wait for heavy rail units to clear.",
    "hps": [
      "Halt completely behind gate limits when warning lights activate.",
      "Switch transmission to neutral while idling."
    ],
    "law": {
      "sec": "Section 131, Motor Vehicles Act 1988",
      "fine": "â‚¹1,000",
      "off": "Bypassing active railway crossing safety barriers"
    },
    "theory": "Heavy rail rolling stock components require extended deceleration paths; you must stop completely.",
    "pract": "Approach active track corridors, shift transmission to neutral, and wait for transit clearance.",
    "quiz": {
      "car": [
        {
          "q": "What action is mandated when crossing gates begin alignment down?",
          "o": [
            "Speed up to beat the gate",
            "Stop fully behind the line",
            "Zigzag through the barriers"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "What action is mandated when crossing gates begin alignment down?",
          "o": [
            "Speed up to beat the gate",
            "Stop fully behind the line",
            "Zigzag through the barriers"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "What action is mandated when crossing gates begin alignment down?",
          "o": [
            "Speed up to beat the gate",
            "Stop fully behind the line",
            "Zigzag through the barriers"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 7,
    "icon": "ðŸ“¢",
    "name": "Device Distractions",
    "v": "ðŸš— Car",
    "col": "#c0392b",
    "gr": "linear-gradient(135deg,#922b21,#c0392b)",
    "tg": "Attentional Focus Controls",
    "ds": "Suppress phone notifications while vehicle velocity tracking is live.",
    "hps": [
      "Handheld operations are fully illegal during target navigation.",
      "Pull off-road to safe parking zones before answering communications data."
    ],
    "law": {
      "sec": "Section 184, Motor Vehicles Act 1988",
      "fine": "â‚¹1,000",
      "off": "Operating motor vehicle while using handheld communication arrays"
    },
    "theory": "Attentional load shifting to mobile devices degrades real-time visual tracking reaction matrices.",
    "pract": "Drive along Marine Drive seafront. Ignore phone distractions and keep your eyes on the road.",
    "quiz": {
      "car": [
        {
          "q": "When is it legal to use your phone while driving?",
          "o": [
            "While stopped at a red light",
            "Only when fully parked off the road",
            "When driving in low gear"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "When is it legal to use your phone while driving?",
          "o": [
            "While stopped at a red light",
            "Only when fully parked off the road",
            "When driving in low gear"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "When is it legal to use your phone while driving?",
          "o": [
            "While stopped at a red light",
            "Only when fully parked off the road",
            "When driving in low gear"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 8,
    "icon": "ðŸš‘",
    "name": "Emergency Vehicles",
    "v": "ðŸš— Car",
    "col": "#c0392b",
    "gr": "linear-gradient(135deg,#922b21,#e74c3c)",
    "tg": "Emergency Lane Yields",
    "ds": "Provide immediate passage lanes to active life-saving transit modules.",
    "hps": [
      "Yield left immediately upon receiving audible siren alerts.",
      "Do not follow emergency transit within close spacing vectors."
    ],
    "law": {
      "sec": "Section 194E, Motor Vehicles Act 1988",
      "fine": "â‚¹10,000",
      "off": "Blocking an ambulance or fire truck"
    },
    "theory": "Unobstructed transport vectors significantly minimize destination arrival time variables for trauma units.",
    "pract": "Detect oncoming rear emergency warnings, execute immediate lane changes to the left, and halt safely.",
    "quiz": {
      "car": [
        {
          "q": "What is the regulatory penalty for blocking ambulances and fire trucks?",
          "o": [
            "â‚¹500",
            "â‚¹2,000",
            "An official e-challan of â‚¹10,000"
          ],
          "a": 2
        }
      ],
      "pedestrian": [
        {
          "q": "What is the regulatory penalty for blocking ambulances and fire trucks?",
          "o": [
            "â‚¹500",
            "â‚¹2,000",
            "An official e-challan of â‚¹10,000"
          ],
          "a": 2
        }
      ],
      "final": [
        {
          "q": "What is the regulatory penalty for blocking ambulances and fire trucks?",
          "o": [
            "â‚¹500",
            "â‚¹2,000",
            "An official e-challan of â‚¹10,000"
          ],
          "a": 2
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 9,
    "icon": "ðŸŒ§ï¸",
    "name": "Monsoon Traction",
    "v": "ðŸš— Car",
    "col": "#2471a3",
    "gr": "linear-gradient(135deg,#1a5276,#2471a3)",
    "tg": "Adverse Friction Adaptations",
    "ds": "Manage safety vectors along low-friction monsoon street networks.",
    "hps": [
      "Reduce base speed metrics by 50% on moisture-heavy roads.",
      "Avoid deep water pooling indices to mitigate hydroplaning risks."
    ],
    "law": {
      "sec": "Section 184, Motor Vehicles Act 1988",
      "fine": "â‚¹1,500",
      "off": "Reckless operation under extreme atmospheric visibility constraints"
    },
    "theory": "Fluid layer buildup disrupts physical contact patches between tire threads and asphalt surfaces.",
    "pract": "Navigate the flooded Hindmata roads during monsoon. Avoid puddles and drive slowly on wet surfaces.",
    "quiz": {
      "car": [
        {
          "q": "What hazard occurs when tire component matrices lose contact with asphalt due to water pooling?",
          "o": [
            "Tailgating",
            "Hydroplaning",
            "Vapor locking"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "What hazard occurs when tire component matrices lose contact with asphalt due to water pooling?",
          "o": [
            "Tailgating",
            "Hydroplaning",
            "Vapor locking"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "What hazard occurs when tire component matrices lose contact with asphalt due to water pooling?",
          "o": [
            "Tailgating",
            "Hydroplaning",
            "Vapor locking"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 10,
    "icon": "ðŸ›º",
    "name": "Lane Discipline",
    "v": "ðŸ›º Auto Rickshaw",
    "col": "#d68910",
    "gr": "linear-gradient(135deg,#9a6b0a,#d68910)",
    "tg": "Spatial Lane Allocation",
    "ds": "Maintain localized structural positioning inside designated highway markers.",
    "hps": [
      "Slower commercial transport units must stay positioned inside the leftmost lane limits.",
      "Overtake only using rightward lane parameters."
    ],
    "law": {
      "sec": "Section 112, Motor Vehicles Act 1988",
      "fine": "1,000",
      "off": "Improper lane utilization / erratic lane weaving patterns"
    },
    "theory": "Predictable trajectory mapping reduces lateral collision vectors across heavy high-speed networks.",
    "pract": "Guide your auto rickshaw along the Eastern Express Highway. Stay in the left lane.",
    "quiz": {
      "car": [
        {
          "q": "Which lane is legally designated for slower transport units?",
          "o": [
            "The rightmost fast track",
            "The leftmost slow track lane",
            "Any arbitrary line marker"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "Which lane is legally designated for slower transport units?",
          "o": [
            "The rightmost fast track",
            "The leftmost slow track lane",
            "Any arbitrary line marker"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "Which lane is legally designated for slower transport units?",
          "o": [
            "The rightmost fast track",
            "The leftmost slow track lane",
            "Any arbitrary line marker"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 11,
    "icon": "ðŸ¤«",
    "name": "Silent Perimeters",
    "v": "ðŸš— Car",
    "col": "#148f77",
    "gr": "linear-gradient(135deg,#0e6655,#148f77)",
    "tg": "Acoustic Noise Containment",
    "ds": "Suppress acoustic warning arrays entirely while driving inside healthcare or school parameters.",
    "hps": [
      "Audible horn arrays are restricted within 100 meters of hospital gates.",
      "Utilize light flashing indicators for nighttime visibility cues."
    ],
    "law": {
      "sec": "Section 190(2), Motor Vehicles Act 1988",
      "fine": "â‚¹2,000",
      "off": "Honking in a no-honk zone"
    },
    "theory": "High decibel emissions elevate physiological stress profiles within patient recovery spaces.",
    "pract": "Drive carefully past medical structures with structural horn relays completely deactivated.",
    "quiz": {
      "car": [
        {
          "q": "What spatial radius defines silent parameters around institutional facilities?",
          "o": [
            "20 meters",
            "100 meters",
            "500 meters"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "What spatial radius defines silent parameters around institutional facilities?",
          "o": [
            "20 meters",
            "100 meters",
            "500 meters"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "What spatial radius defines silent parameters around institutional facilities?",
          "o": [
            "20 meters",
            "100 meters",
            "500 meters"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 12,
    "icon": "ðŸš¦",
    "name": "Overloading Risks",
    "v": "ðŸï¸ Two-Wheeler",
    "col": "#c0392b",
    "gr": "linear-gradient(135deg,#922b21,#c0392b)",
    "tg": "Payload Threshold Boundaries",
    "ds": "Enforce passenger limit constraints onto two-wheeler asset links strictly.",
    "hps": [
      "Payload constraints allow maximum 2 occupants per unit.",
      "Excess loading severely limits target braking and deceleration performance metrics."
    ],
    "law": {
      "sec": "Section 128, Motor Vehicles Act 1988",
      "fine": "â‚¹1,000",
      "off": "Triple riding or exceeding payload index on two-wheelers"
    },
    "theory": "Excess mass distributions alter the center of gravity coordinates, causing rolling stability failures.",
    "pract": "Filter and deny illegal passenger addition requests on your two-wheeler array.",
    "quiz": {
      "car": [
        {
          "q": "How does payload overloading modify braking performance dimensions?",
          "o": [
            "Makes stopping easier",
            "Makes it much harder to stop",
            "Has no effect"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "How does payload overloading modify braking performance dimensions?",
          "o": [
            "Makes stopping easier",
            "Makes it much harder to stop",
            "Has no effect"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "How does payload overloading modify braking performance dimensions?",
          "o": [
            "Makes stopping easier",
            "Makes it much harder to stop",
            "Has no effect"
          ],
          "a": 1
        }
      ],
      "bike": [
        {
          "q": "How does payload overloading modify braking performance dimensions?",
          "o": [
            "Makes stopping easier",
            "Makes it much harder to stop",
            "Has no effect"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian",
      "bike"
    ]
  },
  {
    "id": 13,
    "icon": "ðŸ·",
    "name": "Sober Inspection",
    "v": "ðŸš— Car",
    "col": "#7d3c98",
    "gr": "linear-gradient(135deg,#5b2c6f,#7d3c98)",
    "tg": "Chemical Testing Compliance",
    "ds": "Interface with automated law details at roadside evaluation checkpoints.",
    "hps": [
      "Legal threshold limit for blood-alcohol content is capped at 0.03%.",
      "PUC verification emissions data must undergo updates every 180 days."
    ],
    "law": {
      "sec": "Section 185, Motor Vehicles Act 1988",
      "fine": "â‚¹10,000",
      "off": "Driving under influence of alcohol or drugs"
    },
    "theory": "Chemical tracking shows neural processing speed dropping by 30%, which extends stopping distance rules.",
    "pract": "Submit configuration documents cleanly at unexpected inspection block checkpoints.",
    "quiz": {
      "car": [
        {
          "q": "What is the legal blood alcohol limit in India?",
          "o": [
            "0.08%",
            "0.03% (30mg per 100ml blood)",
            "0.05%"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "What is the legal blood alcohol limit in India?",
          "o": [
            "0.08%",
            "0.03% (30mg per 100ml blood)",
            "0.05%"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "What is the legal blood alcohol limit in India?",
          "o": [
            "0.08%",
            "0.03% (30mg per 100ml blood)",
            "0.05%"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 14,
    "icon": "ðŸ›£ï¸",
    "name": "Highway Corridors",
    "v": "ðŸš— Car",
    "col": "#34495e",
    "gr": "linear-gradient(135deg,#1c2833,#34495e)",
    "tg": "Speed limit driving",
    "ds": "Maintain speed rules within structured minimum and maximum limits on major bridges.",
    "hps": [
      "Bandra-Worli Sea Link constraints mandate velocity tracking between 40 km/h and 80 km/h.",
      "Deploy higher transmission ratios to stabilize power efficiency maps."
    ],
    "law": {
      "sec": "Section 112, Motor Vehicles Act 1988",
      "fine": "â‚¹2,000",
      "off": "Breaking speed limits on highways"
    },
    "theory": "Velocity boundaries avoid traffic accumulation waves and catastrophic impact energy profiles.",
    "pract": "Drive across the Bandra-Worli Sea Link. Maintain speed between 40-80 km/h on the bridge.",
    "quiz": {
      "car": [
        {
          "q": "What speed must you maintain on the Sea Link freeway infrastructure?",
          "o": [
            "20 to 50 km/h",
            "40 to 80 km/h",
            "No speed limit"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "What speed must you maintain on the Sea Link freeway infrastructure?",
          "o": [
            "20 to 50 km/h",
            "40 to 80 km/h",
            "No speed limit"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "What speed must you maintain on the Sea Link freeway infrastructure?",
          "o": [
            "20 to 50 km/h",
            "40 to 80 km/h",
            "No speed limit"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  },
  {
    "id": 15,
    "icon": "ðŸŒŸ",
    "name": "Final Evaluation",
    "v": "ðŸš— All Vehicles",
    "col": "#ff6b35",
    "gr": "linear-gradient(135deg,#ff6b35,#ffd54a)",
    "tg": "System Integration Exam",
    "ds": "Demonstrate perfect compliance profiles across all integrated scenario models concurrently.",
    "hps": [
      "All automated monitoring arrays are fully initialized simultaneously.",
      "Perfect routing tracking is required across high-density mixed traffic patterns."
    ],
    "law": {
      "sec": "All MV Act Sections Apply Simultaneously",
      "fine": "Variable",
      "off": "Any compliance boundary exception failure"
    },
    "theory": "The synthesis of tactical perception and strategic tracking defines safe operations metrics inside dense urban grids.",
    "pract": "Navigate the final integrated city-block framework flawlessly without a single compliance exception error.",
    "quiz": {
      "car": [
        {
          "q": "A driver tracking high safety metrics does ALL EXCEPT:",
          "o": [
            "Stays in their lane safely",
            "Speeds through yellow lights",
            "Gives way to emergency vehicles"
          ],
          "a": 1
        }
      ],
      "pedestrian": [
        {
          "q": "A driver tracking high safety metrics does ALL EXCEPT:",
          "o": [
            "Stays in their lane safely",
            "Speeds through yellow lights",
            "Gives way to emergency vehicles"
          ],
          "a": 1
        }
      ],
      "final": [
        {
          "q": "A driver tracking high safety metrics does ALL EXCEPT:",
          "o": [
            "Stays in their lane safely",
            "Speeds through yellow lights",
            "Gives way to emergency vehicles"
          ],
          "a": 1
        }
      ]
    },
    "modes": [
      "car",
      "pedestrian"
    ]
  }
];

    const BADGES = [
      { id: 'safe_walker', name: 'Safe Walker Badge', icon: 'ðŸš¶', desc: 'Crossed all roads safely as a pedestrian' },
      { id: 'law_abider', name: 'Law Abider Badge', icon: 'ðŸ›ï¸', desc: 'Passed all checkpoint inspections cleanly' },
      { id: 'speed_king', name: 'Speed King Badge', icon: 'ðŸŽï¸', desc: 'Completed Sea Link with zero speed violations' },
      { id: 'traffic_hero', name: 'Traffic Hero Badge', icon: 'ðŸŒŸ', desc: 'Completed all 15 levels of the Academy' },
      { id: 'smart_citizen', name: 'Mumbai Smart Citizen', icon: 'ðŸ™ï¸', desc: 'Earned the Traffic Hero badge ðŸ”„ A true road hero' },
      { id: 'signal_master', name: 'Signal Master', icon: 'ðŸš¦', desc: 'Completed 5+ levels without a single red-light violation' }
    ];

    // ðŸš¦ STATE MANAGEMENT ðŸš¦
    let S = { comp: {}, badges: [], total: 0, name: 'Traffic Hero', wallet: 10000 };
    try { const s = localStorage.getItem('mth4'); if (s) S = Object.assign(S, JSON.parse(s)); } catch (e) { }
    const save = () => { try { localStorage.setItem('mth4', JSON.stringify(S)); } catch (e) { } };

    // ðŸš¦ UTILS ðŸš¦
    let _tt = null;
    function toast(msg, col = '#ffd54a') { const t = document.getElementById('toast'), ti = document.getElementById('ti'); ti.textContent = msg; ti.style.background = col; t.classList.add('on'); clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('on'), 2500); }
    const mob = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // ðŸš¦ SOUND FX ðŸš¦
    const sfx = {
      _c: null, init() { if (this._c) return; try { this._c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } },
      play(t) {
        if (!this._c) return; const p = { horn: { f: 440, ty: 'square', d: .18, v: .12 }, brake: { f: 160, ty: 'sawtooth', d: .15, v: .08 }, challan: { f: 880, ty: 'triangle', d: .32, v: .11 }, ok: { f: 660, ty: 'sine', d: .22, v: .09 }, error: { f: 110, ty: 'square', d: .28, v: .1 } }; const pp = p[t] || p.horn;
        try { const o = this._c.createOscillator(), g = this._c.createGain(); o.connect(g); g.connect(this._c.destination); o.type = pp.ty; o.frequency.setValueAtTime(pp.f, this._c.currentTime); g.gain.setValueAtTime(pp.v, this._c.currentTime); g.gain.exponentialRampToValueAtTime(.001, this._c.currentTime + pp.d); o.start(); o.stop(this._c.currentTime + pp.d); } catch (e) { }
      }
    };

    // ðŸš¦ UI INTERACTION LOGIC LAYER ðŸš¦
    const ui = {
    showProfile() {
        const dlg = document.getElementById('profile-dlg');
        if(!dlg) return;
        document.getElementById('prof-name').value = S.name || '';
        document.getElementById('prof-veh').value = S.vehicle || 'Car';
        dlg.style.display = 'flex';
    },
    saveProfile() {
        const n = document.getElementById('prof-name').value.trim();
        const v = document.getElementById('prof-veh').value;
        if(n.length > 0 && n.length < 3) { toast('Please enter a valid name', 'darkred'); return; }
        S.name = n;
        S.vehicle = v;
        save();
        document.getElementById('profile-dlg').style.display = 'none';
        toast('Profile Saved!', '#3b8c66');
        
        const cnameEl = document.getElementById('cname');
        if(cnameEl) { cnameEl.innerText = S.name || 'DRIVER'; }
    },

      cur: null, qst: null, cq: [], cbusy: false, _ccb: null,
      adminUnlock() { LVS.forEach(l => { if (!S.comp[l.id]) S.comp[l.id] = { score: 500, time: Date.now() } }); BADGES.forEach(b => { if (!S.badges.includes(b.id)) S.badges.push(b.id) }); S.total += 7500; save(); toast('ðŸ”“ Developer Unlock Triggered!', '#00c851'); this.showLevels(); },
      hardReset() { if (confirm('Reset all progress?')) { S.comp = {}; S.badges = []; S.total = 0; save(); toast('âš ï¸ Progress Reset!', '#ff3b30'); this.showStart(); } },
      show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); if (id) document.getElementById(id).classList.add('active'); },
      showStart() { this.show('ss'); this._rain(); if (!S.name || S.name === 'Traffic Hero') { setTimeout(() => this.showProfile(), 1000); } },
      showNameDlg() { document.getElementById('name-dlg').classList.add('on'); setTimeout(() => { const i = document.getElementById('name-input'); if (i) i.focus(); }, 200); },
      showProfile() {
        const dlg = document.getElementById('profile-dlg');
        if(!dlg) return;
        document.getElementById('prof-name').value = S.name || '';
        document.getElementById('prof-veh').value = S.vehicle || 'Car';
        dlg.style.display = 'flex';
      },
      saveProfile() {
        const n = document.getElementById('prof-name').value.trim();
        const v = document.getElementById('prof-veh').value;
        if(n.length > 0 && n.length < 3) { toast('Please enter a valid name', 'darkred'); return; }
        S.name = n;
        S.vehicle = v;
        save();
        document.getElementById('profile-dlg').style.display = 'none';
        toast('Profile Saved!', '#3b8c66');
        
        const cnameEl = document.getElementById('cname');
        if(cnameEl) { cnameEl.innerText = S.name || 'DRIVER'; }
      },
      _rain() { const r = document.getElementById('rl'); if (r && !r._b) { r._b = 1; for (let i = 0; i < 30; i++) { const d = document.createElement('div'); d.className = 'rd'; d.style.left = Math.random() * 100 + '%'; d.style.height = (50 + Math.random() * 50) + 'px'; d.style.animationDuration = ('.6' + Math.random() * .5) + 's'; r.appendChild(d); } } },
      showLevels() { this.show('screen-levels'); this._bldLvs(); },
      _bldLvs() {
        const body = document.getElementById('lvbody'); body.innerHTML = '';
        const done = Object.keys(S.comp).length; document.getElementById('pchip').textContent = done + '/15 âœ…';
        const secs = [{ t: 'ðŸ”° Beginner Modules', ids: [1, 2, 3, 4] }, { t: 'ðŸ”° Intermediate Corridors', ids: [5, 6, 7, 8, 9] }, { t: 'ðŸ”° Advanced Systems', ids: [10, 11, 12, 13] }, { t: 'ðŸŽ“ Expert Gauntlets', ids: [14, 15] }];
        secs.forEach(sec => {
          const sh = document.createElement('div'); sh.className = 'sec-hdr'; sh.textContent = sec.t; body.appendChild(sh);
          const tr = document.createElement('div'); tr.className = 'lv-track';
          sec.ids.forEach(id => {
            const lv = LVS.find(l => l.id === id), idx = LVS.indexOf(lv);
            const un = idx === 0 || S.comp[LVS[idx - 1].id]; const cm = !!S.comp[lv.id]; const ip = !cm && idx > 0 && S.comp[LVS[idx - 1].id];
            const c = document.createElement('div'); c.className = 'lcard' + (cm ? ' done' : '') + (un ? '' : ' lk');
            c.innerHTML = `<div class="lbar" style="background:${lv.gr}"></div>
        <div class="lct"><div class="lico" style="background:${lv.gr}">${un ? lv.icon : 'ðŸ”’'}</div><div class="lst ${cm ? 'sdk' : ip ? 'sip' : 'sns'}">${cm ? 'âœ… Done' : ip ? 'â–¶ï¸ Start' : 'ðŸ”’ Locked'}</div></div>
        <div class="lnum">Module ${lv.id}</div><div class="lnm">${lv.name}</div><div class="ltg">${lv.tg}</div>
        <div class="lmt"><span class="lvc">${lv.v}</span><span class="lfi">${lv.law.fine}</span></div>`;
            if (un) { c.onclick = () => this.showBriefing(lv.id); }
            tr.appendChild(c);
          }); body.appendChild(tr);
        });
      },
      showBriefing(lid) {
        const lv = LVS.find(l => l.id === lid); this.cur = lv;
        document.getElementById('blt').textContent = 'Level ' + lv.id; document.getElementById('bvh').textContent = lv.v;
        const items = [
          { id: 'intro', icon: 'ðŸ“–', label: 'Introduction', sub: 'Course overview' },
          ...lv.hps.map((hp, i) => ({ id: 'rule' + i, icon: 'âš–ï¸', label: 'Rule ' + (i + 1), sub: hp.split(':')[0].substring(0, 24) })),
          { id: 'law', icon: 'ðŸ›ï¸', label: 'Framework', sub: 'Penal provisions' },
          { id: 'theory', icon: 'ðŸ“Š', label: 'Concepts', sub: 'Analytical metrics' },
          { id: 'practical', icon: 'ðŸ“–', label: 'Execution', sub: 'Simulation profile' }
        ];
        this._sylItems = items; this._sylViewed = new Set(); this._sylLv = lv;
        const list = document.getElementById('br-syllabus');
        if (list) {
          list.innerHTML = '';
          items.forEach((it) => {
            const el = document.createElement('div');
            el.className = 'syl-item'; el.id = 'syl-' + it.id;
            el.innerHTML = `<div class="syl-ck" id="sylck-${it.id}"></div><div class="syl-info"><div class="syl-lbl">${it.icon} ${it.label}</div><div class="syl-sub">${it.sub}</div></div>`;
            el.onclick = () => this.showBriefing(lv.id);
            list.appendChild(el);
          });
        }
        this.show('screen-briefing');
      },
      _selSyl(id) { if (this._sylItems) { const it = this._sylItems.find(i => i.id === id); if (it && !this._sylViewed.has(id)) { this._sylViewed.add(id); const sylEl = document.getElementById('syl-' + id); if (sylEl) sylEl.classList.add('syl-done'); } } }
    };
    window.__lvsLegacy = { LVS, BADGES, ui, sfx, save, toast, mob };
  })();
