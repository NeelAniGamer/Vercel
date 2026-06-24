window.LVS = window.LVS || [];
window.LVS.push({
  "id": 4,
  "icon": "\ud83d\udcba",
  "name": "Seat Belt Challenge",
  "v": "\ud83d\ude97 Car",
  "col": "#2980b9",
  "gr": "linear-gradient(135deg,#1f618d,#2980b9)",
  "tg": "Cabin Restraint Systems",
  "ds": "Complete cabin validation routines prior to shifting transmission nodes.",
  "hps": [
    "Seat belts are required for all seating positions.",
    "Buckle logic must engage before vehicle goes into drive.",
    "Seatbelt Physics: Inertia and the prevention of secondary impacts.",
    "Airbag Deployment: Explosive deceleration cushioning via accelerometers.",
    "Vehicle Mass: How vehicle weight impacts survivability in collisions."
  ],
  "law": {
    "sec": "Section 194B, Motor Vehicles Act 1988",
    "fine": "\u20b91,000",
    "off": "Driving without wearing a seat belt"
  },
  "theory": "Restraint systems prevent structural collision trajectory deviations during deceleration events. [SEATBELT PHYSICS]: Inertia and the prevention of secondary impacts. [AIRBAG DEPLOYMENT]: Explosive deceleration cushioning via accelerometers. [VEHICLE MASS]: How vehicle weight impacts survivability in collisions.",
  "pract": "Execute pre-drive loop verification sequence: Mirror alignment -> Restraint engagement -> Shift to Drive.",
  "quiz": [
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
  "mode": "seatbelt"
});
