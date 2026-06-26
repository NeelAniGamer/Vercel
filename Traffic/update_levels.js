const fs = require('fs');
const levelsData = [
  {
    id: 1, icon: '🚶‍♂️', name: 'Pedestrian Courtesy', v: '🚶 Walking', col: '#2ecc71',
    ds: 'Walk on the footpath, but beware of bikes trying to use it! Stay safe and yield to proper traffic.',
    hps: ['Use zebra crossings.', 'Never walk on the road if a footpath exists.', 'Stay alert for rule-breaking bikers on footpaths.'],
    law: { sec: 'Rules of the Road', fine: '₹100', off: 'Jaywalking' },
    theory: 'Pedestrians have the right of way on footpaths and zebra crossings. Be a responsible citizen.',
    pract: 'Walk safely to your destination without stepping onto the main road unnecessarily.',
    mode: 'civic', startOutside: true,
    quiz: [
      { q: 'Where should pedestrians walk?', o: ['Main road', 'Footpath', 'Bicycle lane'], a: 1 },
      { q: 'What to do if a bike is on the footpath?', o: ['Fight them', 'Move aside and report', 'Run'], a: 1 }
    ]
  },
  {
    id: 2, icon: '🚗', name: 'Wait in Traffic (No Honking)', v: '🚗 Car', col: '#e74c3c',
    ds: 'You are stuck in heavy traffic. Others are honking impatiently. Keep your cool, don\'t honk, and wait patiently.',
    hps: ['Honking does not clear traffic.', 'Noise pollution affects everyone.', 'Wait for the signal to turn green.'],
    law: { sec: 'Section 190(2), MV Act', fine: '₹1000', off: 'Unnecessary Honking' },
    theory: 'Patience in traffic reduces stress and noise pollution. Avoid honking unless it is an emergency to alert someone.',
    pract: 'Drive through the heavy traffic without using your horn even once.',
    mode: 'civic',
    quiz: [
      { q: 'When is honking allowed?', o: ['To clear traffic', 'To alert someone of danger', 'To greet a friend'], a: 1 },
      { q: 'Does honking make traffic move faster?', o: ['Yes', 'No', 'Maybe'], a: 1 }
    ]
  },
  {
    id: 3, icon: '🏍️', name: 'Bike Footpath Temptation', v: '🏍️ Bike', col: '#3498db',
    ds: 'Traffic is completely jammed. You see other bikers jumping onto the footpath to bypass it. Will you follow the rules?',
    hps: ['Footpaths are strictly for pedestrians.', 'Riding on a footpath is illegal and dangerous.', 'Stay in your lane.'],
    law: { sec: 'Section 177, MV Act', fine: '₹500', off: 'Driving on Footpath' },
    theory: 'Two-wheelers often cause accidents by invading pedestrian spaces. Good civic sense means staying on the road.',
    pract: 'Stay on the road and do not drive onto the footpath to bypass the jam.',
    mode: 'civic',
    quiz: [
      { q: 'Can you ride on the footpath if the road is jammed?', o: ['Yes', 'No', 'Only slowly'], a: 1 },
      { q: 'Who has the right of way on a footpath?', o: ['Bikes', 'Cars', 'Pedestrians'], a: 2 }
    ]
  },
  {
    id: 4, icon: '🚲', name: 'Cyclist Rules', v: '🚲 Cycle', col: '#9b59b6',
    ds: 'You are riding a cycle. Some cyclists break signals because they think rules don\'t apply to them. Follow all traffic rules.',
    hps: ['Stop at red lights.', 'Stay on the left side of the road.', 'Use hand signals before turning.'],
    law: { sec: 'General Road Rules', fine: 'N/A', off: 'Reckless Cycling' },
    theory: 'Cyclists are vulnerable road users but must still obey traffic signals to ensure overall road safety.',
    pract: 'Ride safely and stop at every red light.',
    mode: 'civic',
    quiz: [
      { q: 'Do cyclists need to stop at red signals?', o: ['Yes', 'No', 'Only if cars are coming'], a: 0 },
      { q: 'Which side of the road should a cyclist ride on in India?', o: ['Right', 'Left', 'Middle'], a: 1 }
    ]
  },
  {
    id: 5, icon: '🌧️', name: 'Rain & Slippery Roads', v: '🚗 Car', col: '#34495e',
    ds: 'It\'s raining heavily. The roads are slippery, and pedestrians are nearby. Drive slowly to avoid splashing water on them.',
    hps: ['Reduce speed in the rain.', 'Maintain a larger safe distance.', 'Watch out for puddles near pedestrians.'],
    law: { sec: 'Section 184, MV Act', fine: '₹1000', off: 'Dangerous Driving' },
    theory: 'Wet roads reduce traction (hydroplaning). Splashing water on pedestrians is a serious lack of civic sense.',
    pract: 'Drive at a low speed, especially near pedestrians, to prevent splashing.',
    mode: 'civic',
    quiz: [
      { q: 'What happens to braking distance on a wet road?', o: ['It decreases', 'It increases', 'Stays the same'], a: 1 },
      { q: 'What should you do if you see a puddle near a pedestrian?', o: ['Speed up', 'Slow down or avoid it', 'Honk at them'], a: 1 }
    ]
  },
  {
    id: 6, icon: '🐄', name: 'Animal Crossing', v: '🚗 Car', col: '#e67e22',
    ds: 'Stray dogs and cows are on the road. Do not honk aggressively or drive recklessly. Yield and wait for them to pass safely.',
    hps: ['Animals get scared by loud horns.', 'Always yield to animals crossing the road.', 'Drive slowly in areas with strays.'],
    law: { sec: 'Prevention of Cruelty to Animals Act', fine: 'Varies', off: 'Harming an animal' },
    theory: 'In India, stray animals on roads are common. Civic sense dictates treating them with compassion and patience.',
    pract: 'Stop your vehicle if an animal blocks the path, and do not honk.',
    mode: 'civic',
    quiz: [
      { q: 'What should you do if a cow is sleeping on the road?', o: ['Honk loudly', 'Drive around it slowly', 'Hit it'], a: 1 },
      { q: 'Are animals affected by loud vehicle horns?', o: ['No', 'Yes, it causes panic', 'Only dogs'], a: 1 }
    ]
  },
  {
    id: 7, icon: '🚌', name: 'Bus Stop Etiquette', v: '🚶 Walking', col: '#1abc9c',
    ds: 'You are waiting for the bus. Do not rush or push when boarding. Let people exit first before you try to enter.',
    hps: ['Queue up patiently.', 'Let passengers exit before boarding.', 'Offer seats to the elderly or pregnant.'],
    law: { sec: 'Public Transport Etiquette', fine: 'N/A', off: 'Disruptive Behavior' },
    theory: 'Public transport efficiency relies on the civic sense of its users. Pushing causes delays and accidents.',
    pract: 'Wait for the bus, let passengers exit, and then board calmly.',
    mode: 'civic', startOutside: true,
    quiz: [
      { q: 'When a bus arrives, what is the first step?', o: ['Push inside quickly', 'Let passengers step down first', 'Block the door'], a: 1 },
      { q: 'Who should you offer your seat to on a bus?', o: ['Young adults', 'Elderly or pregnant individuals', 'Your friends'], a: 1 }
    ]
  },
  {
    id: 8, icon: '🚑', name: 'Ambulance Priority', v: '🚗 Car', col: '#c0392b',
    ds: 'You hear a siren. An ambulance is behind you. You must pull over to the left and give way immediately.',
    hps: ['Emergency vehicles always have right of way.', 'Move to the left edge of the road.', 'Never tailgate an ambulance.'],
    law: { sec: 'Section 194E, MV Act', fine: '₹10,000', off: 'Blocking Ambulance' },
    theory: 'A delayed ambulance can cost a life. Blocking emergency vehicles is a severe offense in India.',
    pract: 'Pull your car to the left as soon as you hear the siren to let the ambulance pass.',
    mode: 'civic',
    quiz: [
      { q: 'What is the fine for blocking an ambulance?', o: ['₹1000', '₹5000', '₹10,000'], a: 2 },
      { q: 'Where should you move when an ambulance is behind you?', o: ['To the left', 'To the right', 'Stop in the middle'], a: 0 }
    ]
  },
  {
    id: 9, icon: '🚇', name: 'Metro Station Decorum', v: '🚶 Walking', col: '#8e44ad',
    ds: 'Navigate the busy metro station. Stand on the left of the escalator, don\'t cross the yellow line, and don\'t spit.',
    hps: ['Keep the station clean.', 'Stand behind the yellow line on platforms.', 'Don\'t block the escalator.'],
    law: { sec: 'Metro Railways Act', fine: '₹200 - ₹500', off: 'Spitting / Nuisance' },
    theory: 'Metro systems require high passenger cooperation to run smoothly. Spitting or littering ruins public property.',
    pract: 'Walk through the metro station while obeying all safety guidelines.',
    mode: 'civic', startOutside: true,
    quiz: [
      { q: 'Where should you stand while waiting for the train?', o: ['Right at the edge', 'Behind the yellow line', 'On the tracks'], a: 1 },
      { q: 'Can you eat or spit inside metro premises?', o: ['Yes', 'No', 'Only water'], a: 1 }
    ]
  },
  {
    id: 10, icon: '🛺', name: 'Gully Driving (Narrow Roads)', v: '🛺 Auto', col: '#d35400',
    ds: 'You are driving an auto-rickshaw through a narrow gully. There are kids playing and tight turns. Drive with extreme caution.',
    hps: ['Speed limit is very low in residential alleys.', 'Watch out for kids and pets darting out.', 'Honk mildly only at blind turns.'],
    law: { sec: 'Section 112, MV Act', fine: '₹1000', off: 'Speeding' },
    theory: 'Narrow residential roads (gullies) have zero margin for error. Kids and pets can unexpectedly jump into the street.',
    pract: 'Navigate the narrow gully without hitting any obstacle or speeding.',
    mode: 'civic',
    quiz: [
      { q: 'What is the biggest risk in a narrow residential gully?', o: ['Traffic jams', 'Kids darting into the road', 'Highway speeds'], a: 1 },
      { q: 'Should you use high beam headlights in a gully?', o: ['Yes', 'No', 'Always'], a: 1 }
    ]
  },
  {
    id: 11, icon: '📱', name: 'No Mobile Phones', v: '🚗 Car', col: '#2980b9',
    ds: 'Your phone rings while driving. Do not answer it! Pull over safely if it is urgent.',
    hps: ['Using a phone while driving reduces reaction time by 50%.', 'Even hands-free calls are distracting.', 'Pull over to take an urgent call.'],
    law: { sec: 'Section 184, MV Act', fine: '₹1000 - ₹5000', off: 'Using Phone while Driving' },
    theory: 'Distracted driving is one of the leading causes of fatal accidents. Texting takes your eyes off the road for an average of 5 seconds.',
    pract: 'Ignore the ringing phone and continue driving safely to your destination.',
    mode: 'civic',
    quiz: [
      { q: 'What should you do if your phone rings while driving?', o: ['Answer quickly', 'Pull over safely to answer', 'Text instead'], a: 1 },
      { q: 'How does phone use affect reaction time?', o: ['Improves it', 'Delays it', 'No effect'], a: 1 }
    ]
  },
  {
    id: 12, icon: '🛤️', name: 'Railway Crossing', v: '🏍️ Bike', col: '#c0392b',
    ds: 'You approach a manned railway crossing and the gates are closing. DO NOT try to duck under the gates!',
    hps: ['Never cross a closed railway gate.', 'Trains cannot stop quickly.', 'Wait patiently till the gates open completely.'],
    law: { sec: 'Section 146, Railways Act', fine: 'Imprisonment/Fine', off: 'Trespassing Level Crossing' },
    theory: 'Ducking under railway gates is highly illegal and fatal. A train takes nearly a kilometer to come to a halt.',
    pract: 'Stop your bike behind the barrier and wait until the train passes and gates open.',
    mode: 'civic',
    quiz: [
      { q: 'Can you slide under the railway crossing gate if no train is visible?', o: ['Yes', 'No, never', 'Only if on a bike'], a: 1 },
      { q: 'Why is it hard for a train to stop for you?', o: ['High momentum takes a long stopping distance', 'Driver cant see you', 'Train brakes are weak'], a: 0 }
    ]
  },
  {
    id: 13, icon: '⚓', name: 'Coastal Drive & Beach Care', v: '🚗 Car', col: '#1abc9c',
    ds: 'Driving by the beach. Do not litter out of your car window. Keep the coastal areas clean.',
    hps: ['Littering pollutes the ocean.', 'Keep trash inside your car until you find a bin.', 'Maintain scenic beauty.'],
    law: { sec: 'Solid Waste Management Rules', fine: 'Varies by Municipality', off: 'Littering Public Places' },
    theory: 'Plastics thrown from cars end up in oceans, destroying marine life. Civic sense includes environmental care.',
    pract: 'Complete the scenic coastal drive without throwing out any trash.',
    mode: 'civic',
    quiz: [
      { q: 'What is the correct way to dispose of a wrapper while driving?', o: ['Throw it out the window', 'Keep it in the car to bin later', 'Leave it on the seat'], a: 1 },
      { q: 'Why is coastal littering especially dangerous?', o: ['It looks ugly', 'It pollutes the ocean and harms marine life', 'It slows down traffic'], a: 1 }
    ]
  },
  {
    id: 14, icon: '🛡️', name: 'Seatbelts & Helmets', v: '🚗 Car', col: '#f39c12',
    ds: 'Before starting, ensure all passengers are wearing seatbelts. It\'s not just for the driver!',
    hps: ['Seatbelts reduce the risk of fatal injury by 45%.', 'Rear passengers must wear seatbelts too.', 'Helmets save lives on two-wheelers.'],
    law: { sec: 'Section 194B, MV Act', fine: '₹1000', off: 'Driving without Seatbelt' },
    theory: 'In a crash, unbelted rear passengers can be thrown forward with immense force, injuring themselves and those in front.',
    pract: 'Verify seatbelts are fastened before driving off.',
    mode: 'civic',
    quiz: [
      { q: 'Do passengers in the back seat need to wear seatbelts?', o: ['Yes, always', 'No', 'Only on highways'], a: 0 },
      { q: 'What is the fine for not wearing a seatbelt?', o: ['₹100', '₹500', '₹1000'], a: 2 }
    ]
  },
  {
    id: 15, icon: '🌙', name: 'Night Driving Etiquette', v: '🚗 Car', col: '#2c3e50',
    ds: 'You are driving at night. Use low-beam headlights so you don\'t blind oncoming traffic.',
    hps: ['High beams blind oncoming drivers.', 'Switch to low beam when a vehicle approaches.', 'Keep windshields clean for better visibility.'],
    law: { sec: 'Section 177, MV Act', fine: '₹500', off: 'Improper use of headlights' },
    theory: 'High beams cause glare that can temporarily blind oncoming drivers, leading to head-on collisions.',
    pract: 'Drive through the night segment using low beams when approaching other cars.',
    mode: 'civic',
    quiz: [
      { q: 'When should you dip your headlights to low beam?', o: ['When it rains', 'When a vehicle is approaching from opposite side', 'Never'], a: 1 },
      { q: 'What is the danger of high beams?', o: ['Drains car battery', 'Blinds oncoming drivers', 'Overheats the bulbs'], a: 1 }
    ]
  },
  {
    id: 16, icon: '🚧', name: 'Speed Breakers & Potholes', v: '🚗 Car', col: '#e67e22',
    ds: 'The road has speed breakers and potholes. Do not swerve dangerously to avoid them; slow down instead.',
    hps: ['Speed breakers are there for safety in busy zones.', 'Sudden swerving causes accidents with adjacent vehicles.', 'Slow down early.'],
    law: { sec: 'General Road Rules', fine: 'N/A', off: 'Dangerous Lane Changing' },
    theory: 'Indian roads frequently have uneven surfaces. Defensive driving means slowing down rather than making erratic evasive maneuvers.',
    pract: 'Navigate over the speed bumps at a slow, safe speed.',
    mode: 'civic',
    quiz: [
      { q: 'What is the safest way to handle a pothole?', o: ['Swerve suddenly to another lane', 'Brake hard at the last second', 'Slow down gradually and drive over it carefully if you cant change lanes safely'], a: 2 },
      { q: 'Why are speed breakers placed?', o: ['To annoy drivers', 'To force vehicles to slow down in high-risk zones', 'To test shocks'], a: 1 }
    ]
  },
  {
    id: 17, icon: '🚸', name: 'School Zone', v: '🏍️ Bike', col: '#f1c40f',
    ds: 'You are entering a school zone. The speed limit is 25 km/h. Be alert for children crossing unexpectedly.',
    hps: ['Speed limits in school zones are strictly enforced.', 'Children may not look before crossing.', 'No honking near schools.'],
    law: { sec: 'Section 112, MV Act', fine: '₹1000 - ₹2000', off: 'Speeding in School Zone' },
    theory: 'School zones are high-risk areas because children lack traffic sense. Drivers must compensate with extra vigilance.',
    pract: 'Maintain a speed under 25 km/h through the entire school zone.',
    mode: 'civic',
    quiz: [
      { q: 'What is a typical speed limit in a school zone in India?', o: ['25 km/h', '40 km/h', '60 km/h'], a: 0 },
      { q: 'Why is honking prohibited near schools?', o: ['It scares birds', 'It disrupts classes and creates noise pollution', 'It drains the battery'], a: 1 }
    ]
  },
  {
    id: 18, icon: '🏛️', name: 'Monument Visit & Parking', v: '🚗 Car', col: '#d35400',
    ds: 'You are visiting a famous monument. Do not park on the road and block traffic. Find the designated parking spot.',
    hps: ['Illegal parking causes major traffic bottlenecks.', 'Always use designated parking lots.', 'Do not block gates or pedestrian paths.'],
    law: { sec: 'Section 122, MV Act', fine: '₹500', off: 'Dangerous or Obstructive Parking' },
    theory: 'Parking on the road near tourist spots creates severe congestion. Good civic sense means walking a bit further from a legal parking spot.',
    pract: 'Drive past the crowded entrance and park your car in the designated parking area.',
    mode: 'civic',
    quiz: [
      { q: 'Where should you park when visiting a crowded monument?', o: ['Right at the entrance gate', 'On the footpath', 'In the designated parking area'], a: 2 },
      { q: 'Why is roadside parking bad?', o: ['It blocks the flow of traffic', 'Its too cheap', 'It damages the road'], a: 0 }
    ]
  },
  {
    id: 19, icon: '🛑', name: 'Stop Line Discipline', v: '🚗 Car', col: '#c0392b',
    ds: 'Stop *behind* the solid white line at the traffic signal. Do not encroach on the zebra crossing.',
    hps: ['The zebra crossing is for pedestrians, not your bumper.', 'Stopping on the line is a traffic offense.', 'Leave space for walkers.'],
    law: { sec: 'Section 119, MV Act', fine: '₹500', off: 'Stop Line Violation' },
    theory: 'Encroaching on the zebra crossing forces pedestrians to walk into oncoming traffic. It is a fundamental violation of pedestrian rights.',
    pract: 'Stop your vehicle completely behind the white stop line at the red light.',
    mode: 'civic',
    quiz: [
      { q: 'Where should your vehicle stop at a red light?', o: ['On the zebra crossing', 'Before the solid white stop line', 'Halfway across the intersection'], a: 1 },
      { q: 'Who is the zebra crossing meant for?', o: ['Bikes to wait', 'Pedestrians to cross safely', 'Street vendors'], a: 1 }
    ]
  },
  {
    id: 20, icon: '🌟', name: 'The Perfect Citizen', v: '🚗 Car', col: '#27ae60',
    ds: 'The ultimate civic sense test! Drive to the Sneh Asha building while following EVERY rule: no speeding, yield to pedestrians, no honking, and perfect parking.',
    hps: ['Maintain all lane disciplines.', 'Obey every signal.', 'Apply all the knowledge from the previous 19 levels.'],
    law: { sec: 'Motor Vehicles Act', fine: 'N/A', off: 'N/A' },
    theory: 'A perfect citizen understands that traffic rules are not restrictions, but protocols for mutual safety and efficiency in society.',
    pract: 'Complete the route flawlessly with 0 penalties.',
    mode: 'civic',
    quiz: [
      { q: 'What is the ultimate goal of traffic rules?', o: ['To collect fines', 'To ensure mutual safety and efficiency for everyone', 'To slow people down'], a: 1 },
      { q: 'True or False: Civic sense only applies when police are watching.', o: ['True', 'False', 'Sometimes'], a: 1 }
    ]
  }
];

levelsData.forEach((ld, i) => {
  const content = "window.LVS = window.LVS || [];\nwindow.LVS.push(" + JSON.stringify(ld, null, 2) + ");\n";
  fs.writeFileSync("c:/Users/neelg/OneDrive/Desktop/Vercel/Traffic/levels/level" + (i+1) + ".js", content);
});
console.log('Successfully updated 20 levels');
