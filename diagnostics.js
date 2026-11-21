import { alignmentPass, alignmentReadings, alignmentSpecs, angleVerdict, axleAnglesPass, aim, aimPass, aimTolerance, beamPitchTarget, dippedSlope, floorProfile, freshAlignment, freshHeadlamp, headlampMethod, headStage,
  lampCenter, lampHeight, lampSides, lampTypes, measuredDipped, measuredWallLux, pendingAimAxis, requiredBeam, roadReach, wallAimTargets, wallLux, wallMark, wheels } from './diagnostic-model.js';
import { paintAimingWall, paintHeadlampIndicator, paintWall, screen, wallPoint } from './diagnostic-beams.js';

const words = {
  en: {
    lab: 'Basic Vehicle Service Lab', bay: 'Diagnostics bay', back: 'Service bay', alignment: 'Wheel alignment', headlamp: 'Headlamp aiming',
    bayIntro: 'Check wheel geometry and aim headlamps in a shared diagnostics bay.',
    alignmentIntro: 'Mount the four targets, measure the angles, then correct and verify toe.',
    headlampIntro: 'Aim the dipped and main beams, check the cutoff, and compare five lamp types in the diagnostics bay.',
    bayChoose: 'Select a stand in the scene or open an exercise below.', resetView: 'Reset view', rig: '3D stand', wall: 'Aiming wall',
    beamsetterView: 'Beamsetter', cabinView: 'Cabin', beamsView: '3D beams',
    cabinHint: 'Use the dashboard switch and steering-column stalk to control the lights.',
    beamsHint: 'Compare the light on the floor and in the haze. Use Cabin to change beams.',
    turnHeadlampsOn: 'Switch lights on', turnHeadlampsOff: 'Switch lights off', lightsOff: 'Headlamps off',
    lowOn: 'Dipped beam on', highOn: 'Main beam on',
    beamSelectHint: 'Open the cabin to switch on the beam for this test.',
    cabinLow: 'Select Dipped beam at the steering-column stalk.', cabinHigh: 'Select Main beam at the steering-column stalk.',
    cabinPower: 'Switch on the headlamps at the dashboard dial.',
    cabinReturnHint: 'The selected beam is on. Return to the test when ready.',
    returnRig: 'Return to beamsetter', returnWall: 'Return to aiming wall', returnBeams: 'Return to 3D beams', returnRoad: 'Return to beam comparison',
    startAiming: 'Start adjustment', resumeAiming: 'Resume adjustment', goToAdjustment: 'Go to adjustment', returnAdjusters: 'Return to adjusters',
    returnToAiming: 'Return to headlamp aiming',
    aimingReady: 'Headlamp adjustment', aimingReadyHelp: 'Choose the aiming method and select Start adjustment to begin the guided checks.', powerControls: 'Headlamp switches',
    rigMethod: 'Set the lens in front of the selected headlamp and use the beamsetter’s built-in screen.',
    wallMethod: 'Cover the other headlamp. Use line B for the left headlamp and line C for the right.',
    aimingMethod: 'Aiming method', wallTest: 'Wall test', wallPlot: 'Light distribution plots',
    splitMethod: 'Left on beamsetter, right on wall', rigBoth: 'Beamsetter for both', wallBoth: 'Wall test for both',
    wallTargetNotes: 'Wall markings and targets', wallMarkingGuide: 'HELLA wall layout',
    wallRegulation: 'UN Regulation No. 48, § 6.2.6.1.1',
    wallLateral: 'Horizontal from {line}', wallVertical: 'Vertical from H', closeUp: 'Live close-up of the aiming wall',
    wallCross: 'Target {line} × {level}', wallCloseUpLow: 'Align the cutoff elbow with {line} and the flat edge with D.',
    wallCloseUpHigh: 'Center the bright spot where {line} meets H.',
    wallMarks: 'A marks the vehicle centerline, B and C mark the lamp centers, H marks lamp height, and D marks the dipped-beam target.',
    wallTrainingValues: 'Training targets are {slope} down ({drop} below H at {distance}) and ±{tolerance} per axis. The vehicle manufacturer specifies the initial aim for a real vehicle.',
    openHood: 'Open hood', openHoodHelp: 'Open the hood to reach the aim screws beside the selected headlamp.',
    screwdriver: 'Pick up screwdriver', screwdriverHelp: 'Pick up the Phillips screwdriver from the tray beside the front wheel.',
    leftHeadlamp: 'Left headlamp', lampProgress: '{current} of {total}',
    leftward: '← Left', rightward: 'Right →', downward: '↓ Lower', upward: '↑ Raise',
    nextAction: 'Next',
    horizontalScrew: 'Horizontal aim screw · Drag left or right to turn',
    verticalScrew: 'Vertical aim screw · Drag left or right to turn',
    aimLeft: 'Move beam left', aimRight: 'Move beam right', aimUp: 'Raise beam', aimDown: 'Lower beam',
    horizontalNext: 'Adjust horizontal aim', verticalNext: 'Adjust vertical aim',
    beamPlot: 'Live beam position compared with the aiming target', aimTargetLine: 'Green target',
    actualOffTarget: 'Red measured aim', actualOnTarget: 'Measured aim in range',
    prepareWall: 'Cover the other headlamp', prepareWallHelp: 'Fit the cover, then check the exposed headlamp on the wall. Use the screwdriver if the aim is out of range.',
    road: 'Beam comparison', allCars: 'All five cars', comparisonLights: 'Lights on for all five cars', meterUnit: 'm', roadReach: 'Simulated beam reach',
    sameDipped: 'The LED and laser-assisted examples share the same dipped beam. Select Main beam to see the laser boost.',
    beamSources: 'Halogen and LED dipped profiles use UMTRI measurements. Xenon and bi-xenon dipped profiles and all main-beam profiles are modeled.',
    inspectionPit: 'Inspection pit', loading: 'Loading equipment…', fallback: '3D unavailable. The procedures and beam plots remain available.',
    rotateHint: 'Drag to orbit · Shift-drag to pan · Scroll to zoom', wallHint: 'Select a point on the wall to read lux.', simulated: 'Simulated profiles',
    alignmentReadout: 'Alignment readout', wheel: 'Wheel', toe: 'Toe', camber: 'Camber', caster: 'Caster',
    frontTotal: 'Front total', rearTotal: 'Rear total', thrust: 'Thrust angle', before: 'Before', after: 'After', tolerance: 'Target',
    setup: 'Prepare vehicle', setupHelp: 'Check tyres and steering, center the steering wheel, and position the vehicle on the turn and slip plates.',
    targets: 'Mount four targets', targetsHelp: 'Select a target at the stand and watch it attach to its wheel. A check mark shows each mounted target.',
    compensate: 'Roll for compensation', compensateHelp: 'Select the Tesla to roll it back and forward with all four targets attached.',
    sweep: 'Measure caster', sweepHelp: 'Use the steering-wheel control to turn left, turn right, and return to center to record caster.',
    steerLeft: 'Steer left', steerRight: 'Steer right', steerCenter: 'Center wheels',
    loosen: 'Loosen locknuts', loosenHelp: 'From the inspection pit, loosen both tie-rod locknuts with the tyres on the rails.',
    adjust: 'Adjust front toe', adjustHelp: 'Use + to move the tie-rod end inward and add toe-in. Use − to move it outward. When both readings are in range, tighten the locknuts.',
    tighten: 'Tighten locknuts', verify: 'Verify alignment', verifyHelp: 'Select the console to remeasure with the locknuts tightened.',
    alignmentDone: 'Alignment verified', alignmentPassed: 'All measured angles are within the selected Tesla specification.',
    alignmentFailed: 'Toe still needs correction. Unlock the adjusters and check the direction in the readout.',
    reset: 'Reset exercise', leftTieRod: 'Left tie rod', rightTieRod: 'Right tie rod', cameraRail: 'Camera beam height', turns: 'turns',
    lightReadout: 'Beamsetter readout', wallReadout: 'Wall readout', beamReadout: 'Headlamp readout',
    opticalDistance: 'Lens to headlamp', rightHeadlamp: 'Right headlamp',
    probe: 'Wall probe',
    lampType: 'Headlamp', distance: 'Wall distance', low: 'Dipped beam', high: 'Main beam', horizontal: 'Horizontal aim', vertical: 'Vertical aim',
    halogen: 'Halogen', xenon: 'Xenon', bixenon: 'Bi-xenon', led: 'LED', laser: 'Laser-assisted',
    position: 'Position beamsetter', positionHelp: 'Align the Fresnel lens 0.50 m from the selected headlamp. Read the pattern on the beamsetter’s own screen.',
    dipped: 'Aim dipped beam', dippedHelp: 'Drag the screwdriver or screw head left or right to turn it. Match the cutoff elbow to the centerline and the flat cutoff to the green line.',
    wallDippedHelp: 'Drag the screwdriver left or right to turn the highlighted screw. Align the cutoff elbow with the lamp’s vertical mark and the flat edge with line D.',
    main: 'Check main beam', mainHelp: 'Switch to the main beam and bring its bright center to the center mark. Then check the result.',
    recheck: 'Recheck dipped beam', recheckHelp: 'Switch back to dipped beam and verify the cutoff after the main-beam check.',
    verifyBeam: 'Check beam', verifyLeft: 'Verify left headlamp', verifyRight: 'Verify right headlamp',
    continueLeft: 'Continue to left headlamp', continueRight: 'Continue to right headlamp',
    leftVerified: 'Left headlamp verified', rightVerified: 'Right headlamp verified', pairDone: 'Both headlamps verified',
    finishLights: 'Switch lights off to finish', finishLightsHelp: 'Both headlamps have passed. Switch the lights off to finish the exercise.',
    aimingComplete: 'Headlamp adjustment complete', aimingCompleteHelp: 'Both headlamps passed the final check and the lights were switched off.',
    checkBeamHelp: 'Both axes are in range. Check the beam to continue.',
    verifyLampHelp: 'Both axes are in range. Confirm the final dipped-beam reading to finish this headlamp.',
    continueOnWall: 'Use the aiming wall for the next headlamp.', continueOnRig: 'Use the beamsetter for the next headlamp.',
    completeBeam: 'The main-beam center and dipped-beam cutoff meet the exercise targets.',
    outOfAim: 'Aim is outside the exercise tolerance. Adjust both axes and check again.', shared: 'Shared adjusters move both beams.',
    separate: 'This xenon example has a separate main-beam module.', laserExplanation: 'LED dipped beam with a white laser-assisted main beam.',
    beamNote: 'Training photometry. Lamp design and aiming targets vary by vehicle.',
    lampHeight: 'Lamp center', drop: 'Dipped target drop', scale: 'Same illuminance scale', roadScope: 'Centreline illuminance at nominal aim. Green floor marks show the reach at',
    references: 'Headlamp references', referenceNote: 'The supplied images illustrate wall marking and beam appearance. The infographic’s ranges are illustrative.',
    lampTypesImage: 'Illustration comparing four headlamp types', wallLayoutImage: 'AUXITO wall marking layout',
    dippedRoadImage: 'AUXITO dipped-beam road photograph', mainRoadImage: 'AUXITO main-beam road photograph',
    verticalAngle: 'Vertical angle', measuredTables: 'UMTRI-2019-5 · Tables 1–2',
    measuredDipped: 'Measured dipped-beam samples', measuredNote: 'These plots show what the median halogen and LED dipped beams look like on a screen, viewed straight on. The brightness comes from UMTRI measurements. H and V mark the horizontal and vertical reference lines. Select a point on either plot to compare illuminance in lux at the same point and distance.',
    hella: 'HELLA beamsetter procedure', wallGuide: 'Wall marking calculator',
    frontToe: 'Front toe', frontLeft: 'Front left', frontRight: 'Front right', inRange: 'In range',
    steeringAngle: 'Steering angle', enlargeMonitor: 'Enlarge the live alignment monitor',
    planScale: 'Top view · wheel angles enlarged 25×', exercise: 'Alignment exercise',
    four: 'Four-wheel alignment', fourHelp: 'Measure all four wheels, correct the rear toe first, then the front toe, and verify them together.',
    crossed: 'Opposing front toe errors', replacement: 'Left tie rod replaced',
    rear: 'Rear toe out of tolerance', rearToe: 'Rear toe', rearLeft: 'Rear left', rearRight: 'Rear right',
    rearHelp: 'Measure all four wheels and correct rear toe at the links on the rear subframe.',
    rearLoosen: 'Loosen toe-link nuts', rearLoosenHelp: 'Loosen the nuts at the rear toe-link mounts on the subframe.',
    rearAdjust: 'Adjust rear toe', rearAdjustHelp: 'Move each toe link inward to add toe-in or outward to reduce it. Tighten the nuts when both readings are in range.',
    rearTighten: 'Tighten toe-link nuts', leftRearLink: 'Left toe link', rightRearLink: 'Right toe link',
    increase: '+ Add toe-in', decrease: '− Reduce toe-in', monitor: 'Monitor', frontLimits: 'Front limits', rearLimits: 'Rear limits',
    referenceRanges: 'Tesla reference ranges',
    alignmentProfile: 'Model 3 (2017–2023) · Coil suspension · Without ballast', toeSign: 'Positive toe is toe-in.',
    adjustmentNotes: 'How Model 3 alignment is adjusted',
    alignmentNote: 'The lab simulates toe adjustment and measures camber and front caster. Tesla adjusts front camber and caster at the upper control-arm mounts, and rear camber at the suspension links. The readings and linkage motion are simulated. The limits come from Tesla’s service manual.',
    specSource: 'Tesla specifications', procedureSource: 'Tesla adjustment procedure',
    replacementHelp: 'The left tie rod was replaced. Measure both front wheels and correct the disturbed side.',
    photometry: 'Photometry', trainingRig: 'Training rig', fleetDipped: 'Measured dipped beams',
    pin: 'Pin this beam', unpin: 'Unpin beam', pinned: 'Pinned', current: 'Live', noSample: 'Outside measured grid',
    measuredScale: 'UMTRI measured medians · hatching indicates areas without measurements',
    wallHeight: 'Target height above floor',
  },
  uk: {
    lab: 'Лабораторія основ автосервісу', bay: 'Пост діагностики', back: 'Сервісний пост', alignment: 'Кути встановлення коліс', headlamp: 'Регулювання фар',
    bayIntro: 'Перевіряйте кути встановлення коліс і регулюйте фари на спільному посту.',
    alignmentIntro: 'Установіть чотири мішені, виміряйте кути, відрегулюйте й перевірте сходження.',
    headlampIntro: 'Відрегулюйте ближнє й дальнє світло, перевірте світлотіньову межу та порівняйте п’ять типів фар у зоні діагностики.',
    bayChoose: 'Виберіть стенд у сцені або відкрийте вправу нижче.', resetView: 'Початковий ракурс', rig: '3D-стенд', wall: 'Екран на стіні',
    beamsetterView: 'Прилад', cabinView: 'Салон', beamsView: 'Пучки в 3D',
    cabinHint: 'Керуйте світлом перемикачем на панелі та важелем під кермом.',
    beamsHint: 'Порівняйте освітлення підлоги й пучки в серпанку. Перемикайте світло в салоні.',
    turnHeadlampsOn: 'Увімкнути фари', turnHeadlampsOff: 'Вимкнути фари', lightsOff: 'Фари вимкнено',
    lowOn: 'Ближнє світло ввімкнено', highOn: 'Дальнє світло ввімкнено',
    beamSelectHint: 'Відкрийте салон, щоб увімкнути світло для перевірки.',
    cabinLow: 'Виберіть ближнє світло важелем під кермом.', cabinHigh: 'Виберіть дальнє світло важелем під кермом.',
    cabinPower: 'Увімкніть фари перемикачем на панелі приладів.',
    cabinReturnHint: 'Вибране світло ввімкнено. Поверніться до перевірки.',
    returnRig: 'Повернутися до приладу', returnWall: 'Повернутися до екрана', returnBeams: 'Повернутися до пучків у 3D', returnRoad: 'Повернутися до порівняння',
    startAiming: 'Почати регулювання', resumeAiming: 'Продовжити регулювання', goToAdjustment: 'До регулювання', returnAdjusters: 'Повернутися до гвинтів',
    returnToAiming: 'Повернутися до регулювання фар',
    aimingReady: 'Регулювання фар', aimingReadyHelp: 'Виберіть спосіб наведення й почніть регулювання, щоб пройти перевірку крок за кроком.', powerControls: 'Керування фарами',
    rigMethod: 'Встановіть лінзу навпроти вибраної фари та використовуйте вбудований екран приладу.',
    wallMethod: 'Закрийте іншу фару. Використовуйте лінію B для лівої фари та лінію C для правої.',
    aimingMethod: 'Спосіб наведення', wallTest: 'Перевірка на стіні', wallPlot: 'Діаграми розподілу світла',
    splitMethod: 'Ліва на приладі, права на стіні', rigBoth: 'Обидві фари на приладі', wallBoth: 'Обидві фари на стіні',
    wallTargetNotes: 'Розмітка стіни та цільові значення', wallMarkingGuide: 'Розмітка стіни HELLA',
    wallRegulation: 'Правила ООН № 48, п. 6.2.6.1.1',
    wallLateral: 'Горизонталь від {line}', wallVertical: 'Вертикаль від H', closeUp: 'Розмітка стіни зблизька',
    wallCross: 'Ціль {line} × {level}', wallCloseUpLow: 'Сумістіть злам світлотіньової межі з {line}, а горизонтальну ділянку — з D.',
    wallCloseUpHigh: 'Сумістіть центр яскравої плями з перетином {line} і H.',
    wallMarks: 'A позначає вісь автомобіля, B і C — осі фар, H — їхню висоту, D — цільову межу ближнього світла.',
    wallTrainingValues: 'Навчальна вправа використовує нахил {slope} вниз ({drop} нижче H на відстані {distance}) і допуск ±{tolerance} на кожній осі. Для справжнього автомобіля початковий нахил визначає виробник.',
    openHood: 'Відкрити капот', openHoodHelp: 'Відкрийте капот, щоб дістатися до регулювальних гвинтів вибраної фари.',
    screwdriver: 'Взяти викрутку', screwdriverHelp: 'Візьміть хрестову викрутку з лотка біля переднього колеса.',
    leftHeadlamp: 'Ліва фара', lampProgress: '{current} з {total}',
    leftward: '← Ліворуч', rightward: 'Праворуч →', downward: '↓ Опустити', upward: '↑ Підняти',
    nextAction: 'Далі',
    horizontalScrew: 'Гвинт горизонтального регулювання · Потягніть ліворуч або праворуч',
    verticalScrew: 'Гвинт вертикального регулювання · Потягніть ліворуч або праворуч',
    aimLeft: 'Змістити пучок ліворуч', aimRight: 'Змістити пучок праворуч', aimUp: 'Підняти пучок', aimDown: 'Опустити пучок',
    horizontalNext: 'Відрегулювати горизонталь', verticalNext: 'Відрегулювати вертикаль',
    beamPlot: 'Положення пучка відносно цілі', aimTargetLine: 'Зелена ціль',
    actualOffTarget: 'Червона виміряна мітка', actualOnTarget: 'Виміряне наведення в допуску',
    prepareWall: 'Закрити іншу фару', prepareWallHelp: 'Установіть накладку, потім перевірте на стіні світло відкритої фари. Якщо наведення поза допуском, скористайтеся викруткою.',
    road: 'Порівняння світла', allCars: 'Усі п’ять авто', comparisonLights: 'Увімкнути фари всіх п’яти авто', meterUnit: 'м', roadReach: 'Розрахункова дальність світла',
    sameDipped: 'Фари LED і з лазерним підсиленням мають однакове ближнє світло. Виберіть дальнє світло, щоб побачити лазерне підсилення.',
    beamSources: 'Профілі ближнього світла галогенних і LED фар відтворено за вимірюваннями UMTRI. Ближнє світло ксенонових і біксенонових фар та всі профілі дальнього світла змодельовано.',
    inspectionPit: 'Оглядова яма', loading: 'Завантаження обладнання…', fallback: '3D недоступне. Вправи та діаграми світла доступні.',
    rotateHint: 'Перетягніть для обертання · Shift і перетягування для зсуву · Коліщатко для масштабу', wallHint: 'Виберіть точку на стіні для вимірювання освітленості.', simulated: 'Розрахункові приклади',
    alignmentReadout: 'Покази стенда кутів', wheel: 'Колесо', toe: 'Сходження', camber: 'Розвал', caster: 'Кастер',
    frontTotal: 'Сумарне переднє', rearTotal: 'Сумарне заднє', thrust: 'Кут тяги', before: 'До', after: 'Після', tolerance: 'Цільове значення',
    setup: 'Підготувати автомобіль', setupHelp: 'Перевірте шини й кермовий механізм, відцентруйте кермо та розмістіть колеса на поворотних і ковзних платформах.',
    targets: 'Установити чотири мішені', targetsHelp: 'Виберіть мішень на стенді та простежте, як вона кріпиться до колеса. Позначка підтверджує кріплення.',
    compensate: 'Виконати компенсацію прокочуванням', compensateHelp: 'Виберіть Tesla, щоб прокотити автомобіль назад і вперед із чотирма встановленими мішенями.',
    sweep: 'Виміряти кастер', sweepHelp: 'Скористайтеся кнопкою на кермі, щоб повернути колеса ліворуч, праворуч і знову відцентрувати їх для вимірювання кастера.',
    steerLeft: 'Ліворуч', steerRight: 'Праворуч', steerCenter: 'Відцентрувати колеса',
    loosen: 'Послабити контргайки', loosenHelp: 'З оглядової ями послабте обидві контргайки рульових тяг. Колеса залишаються на доріжках.',
    adjust: 'Відрегулювати переднє сходження', adjustHelp: 'Натисніть +, щоб змістити наконечник тяги до центра і збільшити сходження, або −, щоб змістити назовні. Коли обидва значення в допуску, затягніть контргайки.',
    tighten: 'Затягнути контргайки', verify: 'Перевірити кути', verifyHelp: 'Виберіть монітор і повторіть вимірювання після затягування контргайок.',
    alignmentDone: 'Перевірку завершено', alignmentPassed: 'Усі виміряні кути в межах вибраних допусків Tesla.',
    alignmentFailed: 'Сходження потребує корекції. Послабте кріплення та перевірте напрямок у показах стенда.',
    reset: 'Почати спочатку', leftTieRod: 'Ліва тяга', rightTieRod: 'Права тяга', cameraRail: 'Висота балки камер', turns: 'об.',
    lightReadout: 'Покази приладу', wallReadout: 'Покази на стіні', beamReadout: 'Покази фар',
    opticalDistance: 'Від лінзи до фари', rightHeadlamp: 'Права фара',
    probe: 'Точка на стіні',
    lampType: 'Тип фари', distance: 'Відстань до стіни', low: 'Ближнє світло', high: 'Дальнє світло', horizontal: 'Горизонталь', vertical: 'Вертикаль',
    halogen: 'Галоген', xenon: 'Ксенон', bixenon: 'Біксенон', led: 'LED', laser: 'З лазерним підсиленням',
    position: 'Установити прилад', positionHelp: 'Сумістіть лінзу Френеля з вибраною фарою на відстані 0,50 м. Пучок видно на власному екрані приладу.',
    dipped: 'Відрегулювати ближнє світло', dippedHelp: 'Потягніть головки гвинтів під капотом, щоб повернути їх. Сумістіть злам межі з віссю, а горизонтальну ділянку із зеленою лінією.',
    wallDippedHelp: 'Потягніть викрутку ліворуч або праворуч, щоб повернути підсвічений гвинт. Сумістіть злам межі з вертикальною міткою фари, а горизонтальну ділянку з лінією D.',
    main: 'Перевірити дальнє світло', mainHelp: 'Увімкніть дальнє світло, сумістіть центр яскравої плями з міткою й перевірте результат.',
    recheck: 'Повторно перевірити ближнє', recheckHelp: 'Увімкніть ближнє світло та повторно перевірте межу після дальнього.',
    verifyBeam: 'Перевірити пучок', verifyLeft: 'Підтвердити перевірку лівої фари', verifyRight: 'Підтвердити перевірку правої фари',
    continueLeft: 'Перейти до лівої фари', continueRight: 'Перейти до правої фари',
    leftVerified: 'Ліву фару перевірено', rightVerified: 'Праву фару перевірено', pairDone: 'Обидві фари перевірено',
    finishLights: 'Вимкнути фари й завершити', finishLightsHelp: 'Обидві фари пройшли перевірку. Вимкніть фари, щоб завершити вправу.',
    aimingComplete: 'Регулювання фар завершено', aimingCompleteHelp: 'Обидві фари пройшли остаточну перевірку, після чого фари вимкнено.',
    checkBeamHelp: 'Обидві осі в допуску. Перевірте пучок, щоб продовжити.',
    verifyLampHelp: 'Обидві осі в допуску. Підтвердьте результат остаточної перевірки ближнього світла цієї фари.',
    continueOnWall: 'Наступну фару перевірте на розміченій стіні.', continueOnRig: 'Наступну фару перевірте приладом.',
    completeBeam: 'Центр дальнього світла та межа ближнього відповідають цілям вправи.',
    outOfAim: 'Поза допуском вправи. Відрегулюйте обидві осі та повторіть перевірку.', shared: 'Спільні регулятори зміщують обидва пучки.',
    separate: 'У цьому ксеноновому прикладі дальнє світло має окремий модуль.', laserExplanation: 'Ближнє світло LED і біле дальнє з лазерним підсиленням.',
    beamNote: 'Навчальна фотометрія. Розподіл світла й цільові значення залежать від автомобіля.',
    lampHeight: 'Висота фари', drop: 'Цільове зниження', scale: 'Спільна шкала освітленості', roadScope: 'Освітленість уздовж осі за номінального наведення. Зелені позначки на підлозі показують дальність при',
    references: 'Джерела про фари', referenceNote: 'Надані зображення ілюструють розмітку стіни та вигляд пучків. Дальність на інфографіці наведено для ілюстрації.',
    lampTypesImage: 'Ілюстрація для порівняння чотирьох типів фар', wallLayoutImage: 'Схема розмітки стіни AUXITO',
    dippedRoadImage: 'Фото дороги з ближнім світлом фар AUXITO', mainRoadImage: 'Фото дороги з дальнім світлом фар AUXITO',
    verticalAngle: 'Вертикальний кут', measuredTables: 'UMTRI-2019-5 · Таблиці 1–2',
    measuredDipped: 'Виміряні значення ближнього світла', measuredNote: 'Діаграми показують медіанні пучки галогенних і світлодіодних фар на екрані, якщо дивитися на нього прямо. Яскравість відтворено за вимірюваннями UMTRI. H і V позначають горизонтальну та вертикальну осі. Виберіть точку для порівняння освітленості в люксах у тій самій точці на однаковій відстані.',
    hella: 'Процедура з приладом HELLA', wallGuide: 'Калькулятор розмітки стіни',
    frontToe: 'Переднє сходження', frontLeft: 'Переднє ліве', frontRight: 'Переднє праве', inRange: 'У допуску',
    steeringAngle: 'Кут повороту коліс', enlargeMonitor: 'Збільшити монітор кутів коліс',
    planScale: 'Вигляд зверху · кути коліс збільшено у 25 разів', exercise: 'Вправа зі сходження',
    four: 'Регулювання чотирьох коліс', fourHelp: 'Виміряйте кути всіх коліс. Відрегулюйте заднє сходження, потім переднє та перевірте їх разом.',
    crossed: 'Протилежні похибки сходження', replacement: 'Після заміни лівої тяги',
    rear: 'Заднє сходження поза допуском', rearToe: 'Заднє сходження', rearLeft: 'Заднє ліве', rearRight: 'Заднє праве',
    rearHelp: 'Виміряйте кути всіх чотирьох коліс та відрегулюйте сходження тягами на задньому підрамнику.',
    rearLoosen: 'Послабити гайки тяг', rearLoosenHelp: 'Послабте гайки кріплення тяг сходження до заднього підрамника.',
    rearAdjust: 'Відрегулювати заднє сходження', rearAdjustHelp: 'Змістіть тягу до центра, щоб збільшити сходження, або назовні, щоб зменшити. Затягніть гайки, коли обидва значення в допуску.',
    rearTighten: 'Затягнути гайки тяг', leftRearLink: 'Ліва тяга сходження', rightRearLink: 'Права тяга сходження',
    increase: '+ Збільшити', decrease: '− Зменшити', monitor: 'Монітор', frontLimits: 'Передні межі', rearLimits: 'Задні межі',
    referenceRanges: 'Діапазони за специфікацією Tesla',
    alignmentProfile: 'Model 3 (2017–2023) · Пружинна підвіска · Без баласту', toeSign: 'Додатне значення відповідає сходженню.',
    adjustmentNotes: 'Як регулюють кути коліс Model 3',
    alignmentNote: 'У лабораторії регулюють сходження та вимірюють розвал і передній кастер. У Model 3 передній розвал і кастер регулюють кріпленням верхнього важеля, а задній розвал — важелями підвіски. Покази й рух деталей змодельовано. Допуски наведено за сервісним посібником Tesla.',
    specSource: 'Допуски Tesla', procedureSource: 'Процедура Tesla',
    replacementHelp: 'Ліву рульову тягу замінено. Виміряйте обидва передні колеса та відрегулюйте сходження з боку заміни.',
    photometry: 'Фотометрія', trainingRig: 'Навчальний стенд', fleetDipped: 'Виміряні пучки ближнього світла',
    pin: 'Закріпити цей пучок', unpin: 'Відкріпити пучок', pinned: 'Збережено', current: 'Поточний', noSample: 'Поза межами вимірювань',
    measuredScale: 'Медіани вимірювань UMTRI · штрихування позначає зону поза межами вимірювань',
    wallHeight: 'Висота мітки від підлоги',
  },
};
const $ = id => document.getElementById(id);
let language = 'en';
const t = key => words[language][key];
const formatters = Object.fromEntries(Object.keys(words).map(locale => [locale, [0, 1, 2].map(places =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: places, maximumFractionDigits: places }))]));
const format = (value, places = 0) => formatters[language][places].format(value);
const degrees = value => value == null ? '—' : format(value, 2) + '°';
const actionLabel = (key, help = false) => {
  const rearLabels = { loosen: 'rearLoosen', adjust: 'rearAdjust', tighten: 'rearTighten' };
  const label = (alignment.axle && rearLabels[key]) || key;
  return t(label + (help ? 'Help' : ''));
};
const centimeters = value => format(value * 100, 1) + ' ' + (language === 'uk' ? 'см' : 'cm');
const meters = (value, places = Number.isInteger(value) ? 0 : 2) => format(value, places) + ' ' + t('meterUnit');
const lux = language => language === 'uk' ? 'лк' : 'lx';
let station = null;
let navigate, requestDraw, focusView;
let walkingInPit = null;
let pinned = null;
let wallSource = 'measured';
const referenceWall = $('beam-reference');
const turnMotion = [null, null, null, null];
let alignment = freshAlignment();
const inspectionPit = () => walkingInPit ?? (alignment.axleView && !alignment.monitorView);
let head = freshHeadlamp();
let cabinReturn;
let comparisonReturn;
let comparisonMode = 'low';
let displayedBeam;
let steeringStep = 0;
let beamWarning = false;
let sceneStatus = 'loading';
let reachLanguage;
let renderedMeasurements = '';
const canvas = $('scene');
const wall = $('beam-wall');
const lampMethod = side => sceneStatus === 'fallback' ? 'wall' : headlampMethod(head.route, side);
const testMethod = () => lampMethod(head.side);
const types = Object.keys(lampTypes);
const lampName = side => t(side + 'Headlamp');
const nextLamp = () => lampSides.find(side => headStage(head, lampMethod(side), side) !== 'done');
const aimDirection = (axis, error) => axis === 0 ? (error > 0 ? 'aimLeft' : 'aimRight') : (error > 0 ? 'aimDown' : 'aimUp');

function localize() {
  for (const part of document.querySelectorAll('[data-d]')) part.textContent = t(part.dataset.d);
  for (const image of document.querySelectorAll('[data-d-alt]')) image.alt = t(image.dataset.dAlt);
  for (const option of $('wall-distance').options) option.textContent = meters(Number(option.value));
  $('lamp-type').replaceChildren(...types.map(id => new Option(t(id), id)));
  $('comparison-toolbar').setAttribute('aria-label', t('allCars'));
  $('headlamp-power').setAttribute('aria-label', t('powerControls'));
  for (const plot of [wall, referenceWall]) plot.setAttribute('aria-label', t('wallHint'));
  $('alignment-monitor').setAttribute('aria-label', t('alignmentReadout'));
  $('axle-repeater').setAttribute('aria-label', t('enlargeMonitor'));
  const rangesTitle = $('alignment-limits').rows[0];
  $('alignment-limits').replaceChildren(rangesTitle, ...['frontLimits', 'rearLimits'].map((name, axle) => {
    const row = document.createElement('tr');
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = t(name);
    row.append(label);
    for (const limits of Object.values(alignmentSpecs)) {
      const band = limits[axle];
      row.insertCell().textContent = band ? degrees(band[0] - band[1]) + '…' + degrees(band[0] + band[1]) : '—';
    }
    return row;
  }));
}

function alignmentActions() {
  if (alignment.motion) return [];
  switch (alignment.stage) {
    case 'prepare': return [{ id: 'setup', label: t('setup') }];
    case 'targets': return wheels.filter(id => !alignment.mounts.includes(id)).map(id => ({ id: 'mount-' + id, label: id }));
    case 'compensate': return [{ id: 'compensate', label: t('compensate') }];
    case 'sweep': return [{ id: 'steer', label: t(['steerLeft','steerRight','steerCenter'][steeringStep]) }];
    case 'loosen': return [{ id: 'loosen', label: actionLabel('loosen') }];
    case 'adjust': return [{ id: 'tighten', label: actionLabel('tighten') }];
    case 'verify': return [{ id: 'verify', label: t('verify') }];
    case 'done': return alignmentPass(alignment.verified) ? [] : [{ id: 'loosen', label: actionLabel('loosen') }];
  }
}

function headView() {
  return sceneStatus === 'fallback' && ['rig', 'beams', 'adjusters'].includes(head.presentation) ? 'wall' : head.presentation;
}

function selectHeadView(view) {
  if (view === 'road') {
    if (head.comparisonBeam === null) {
      comparisonReturn = head.presentation;
      head.comparisonBeam = 'off';
    }
  } else {
    const previous = comparisonReturn ?? headView();
    head.comparisonBeam = null;
    comparisonReturn = undefined;
    if (view !== 'cabin') cabinReturn = undefined;
    else if (previous !== 'cabin') cabinReturn = previous;
  }
  head.presentation = view;
  focusView?.();
}

function waitingForBeam() {
  const expected = requiredBeam(headStage(head, testMethod()));
  return expected && (!head.lightsOn || head.mode !== expected) ? expected : null;
}

function cabinActions() {
  const expected = cabinReturn ? waitingForBeam() : null;
  return [{ id: 'lights-toggle', label: t(head.lightsOn ? 'turnHeadlampsOff' : 'turnHeadlampsOn') },
    ...['low', 'high'].map(mode => ({ id: 'beam-' + mode, label: t(mode), pressed: head.lightsOn && head.mode === mode,
      recommended: expected === mode }))];
}

function headActions() {
  if (!head.adjusting) return [];
  const method = testMethod();
  const stage = headStage(head, method);
  if (stage === 'position') return [{ id: 'position', label: t(method === 'wall' ? 'prepareWall' : 'position'), prominent: method === 'wall' }];
  if (stage === 'done') {
    const other = nextLamp();
    if (other) return [{ id: 'next-lamp', label: t(other === 'left' ? 'continueLeft' : 'continueRight'), prominent: true }];
    return head.lightsOn && !head.shutdownConfirmed ? [{ id: 'lights-toggle', label: t('finishLights'), prominent: true }] : [];
  }
  if (!requiredBeam(stage)) return [];
  const expected = waitingForBeam();
  if (expected) return [{ id: 'beam-cabin', label: t('cabinView') + ' · ' + t(expected) }];
  const aligned = aimPass(head);
  if (!aligned) {
    if (!head.hoodOpen) return [{ id: 'raise-hood', label: t('openHood') }];
    if (!head.toolPicked) return [{ id: 'pick-driver', label: t('screwdriver') }];
  }
  const finalCheck = stage === 'recheck' && aligned;
  return [{ id: 'check', label: t(finalCheck ? (head.side === 'left' ? 'verifyLeft' : 'verifyRight') : 'verifyBeam'), prominent: aligned }];
}

function sceneActions() {
  if (!station) return [];
  if (station === 'diagnostics') return [{ id: 'open-alignment', label: t('alignment') }, { id: 'open-headlamp', label: t('headlamp') }];
  if (station === 'alignment') {
    const actions = alignmentActions();
    if (!inspectionPit() && ['loosen','adjust','done'].includes(alignment.stage)) {
      return actions.map(action => ({ ...action, id: 'panel-' + action.id }));
    }
    if (alignment.stage !== 'adjust' || alignment.motion) return actions;
    const { axle } = alignment;
    const { toe } = alignmentReadings(alignment);
    const names = axle ? ['rearLeft', 'rearRight'] : ['frontLeft', 'frontRight'];
    const adjusters = ['left', 'right'].flatMap((side, index) =>
      [['minus', '−'], ['plus', '+']].map(([direction, sign]) => ({
        id: 'toe-' + side + '-' + direction, label: wheels[2 * axle + index] + sign,
        description: t(names[index]) + ' · ' + t(direction === 'plus' ? 'increase' : 'decrease'),
        recommended: angleVerdict('toe', axle, toe[2 * axle + index]) === (direction === 'plus' ? 'increase' : 'decrease'),
      })));
    return actions.concat(adjusters);
  }
  if (head.comparisonBeam !== null) return [];
  const actions = headActions();
  const axis = actions[0]?.id === 'check' ? pendingAimAxis(head) : -1;
  if (axis >= 0) {
    return [{ id: 'aim-guide-' + axis, label: t(axis ? 'verticalScrew' : 'horizontalScrew'),
      marker: axis ? 'V' : 'H', guide: true, ring: true }];
  }
  const rings = [];
  if ((!head.adjusting && head.presentation === 'cabin') || actions[0]?.id === 'beam-cabin') {
    const expected = waitingForBeam();
    const id = !head.lightsOn ? 'lights-toggle' : expected ? 'beam-' + expected : head.mode === 'low' ? 'beam-high' : 'beam-low';
    const controls = cabinActions().filter(action => action.id === id || (!expected && action.id === 'lights-toggle'));
    rings.push(...controls.map(action => ({ ...action, ring: true })));
  }
  return rings.concat(actions.filter(action => head.presentation !== 'cabin' || action.id !== 'beam-cabin')
    .map(action => ({ ...action, ring: true })));
}

function actionButtons(container, actions, style = 'primary') {
  const previous = [...container.children].map(button => [button.dataset.action, button.textContent, button.getAttribute('aria-pressed')].join(':')).join('|');
  if (previous === actions.map(({ id, label, pressed }) => [id, label, pressed].join(':')).join('|')) return;
  container.replaceChildren(...actions.map(({ id, label, pressed }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = style;
    button.dataset.action = id;
    button.textContent = label;
    if (pressed !== undefined) button.setAttribute('aria-pressed', pressed);
    button.addEventListener('click', () => act(id));
    return button;
  }));
}

function renderAlignment() {
  const current = alignment.verified ?? alignmentReadings(alignment);
  const table = $('alignment-values');
  if (!table.rows.length) for (const id of wheels) {
    const row = document.createElement('tr');
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = id;
    row.append(heading);
    for (const kind of Object.keys(alignmentSpecs)) row.insertCell().dataset.kind = kind;
    table.append(row);
  }
  for (const [index, row] of Array.from(table.rows).entries()) {
    const axle = Math.floor(index / 2);
    for (const cell of Array.from(row.cells).slice(1)) {
      const kind = cell.dataset.kind;
      const value = alignment.baseline ? current[kind]?.[index] : null;
      const verdict = angleVerdict(kind, axle, value);
      cell.textContent = degrees(value);
      cell.dataset.verdict = verdict === 'ok' ? 'ok' : verdict ? 'correct' : 'pending';
      if (kind === 'toe' && verdict && verdict !== 'ok') {
        const direction = document.createElement('span');
        direction.className = 'toe-direction';
        direction.textContent = t(verdict);
        cell.append(direction);
      }
    }
  }
  $('alignment-totals').textContent = alignment.baseline
    ? [t('frontTotal') + ' ' + degrees(current.frontTotal), t('rearTotal') + ' ' + degrees(current.rearTotal),
      t('thrust') + ' ' + degrees(current.thrust)].join(' · ') : '—';
  const key = ({ prepare: 'setup', done: 'alignmentDone' })[alignment.stage] ?? alignment.stage;
  $('alignment-step').textContent = actionLabel(key);
  $('alignment-hint').textContent = alignment.stage === 'done'
    ? t(alignmentPass(current) ? 'alignmentPassed' : 'alignmentFailed') : actionLabel(key, true);
  $('alignment-before').hidden = !alignment.baseline;
  if (alignment.baseline) {
    $('alignment-before').textContent = (alignment.exercise === 'four' ? [1, 0] : [alignment.axle]).map(axle => {
      const first = axle * 2;
      const pair = readings => readings.toe.slice(first, first + 2).map(degrees).join(' / ');
      const after = alignment.verified ? ' · ' + t('after') + ' ' + pair(current) : '';
      return t(axle ? 'rearToe' : 'frontToe') + ' · ' + t('before') + ' ' + pair(alignment.baseline) + after;
    }).join(' | ');
  }
  actionButtons($('alignment-actions'), alignmentActions());
  $('alignment-exercise').value = alignment.exercise;
  if (alignment.stage === 'prepare' && alignment.exercise === 'replacement') $('alignment-hint').textContent = t('replacementHelp') + ' ' + t('setupHelp');
  if (alignment.stage === 'prepare' && alignment.axle) $('alignment-hint').textContent =
    t(alignment.exercise === 'four' ? 'fourHelp' : 'rearHelp') + ' ' + t('setupHelp');
  $('toe-controls').hidden = alignment.stage !== 'adjust';
  ['left', 'right'].forEach((side, index) => {
    const wheel = alignment.axle * 2 + index;
    $(side + '-adjuster').textContent = t(alignment.axle ? ['leftRearLink', 'rightRearLink'][index] : ['leftTieRod', 'rightTieRod'][index]);
    $(side + '-turns').value = alignment.turns[wheel];
    $(side + '-turns-value').textContent = format(alignment.turns[wheel], 2) + ' ' + t('turns');
  });
  $('camera-rail').value = alignment.rail;
}

function renderHeadlamp(view) {
  const method = testMethod();
  const optical = method === 'rig';
  const actions = headActions();
  const transition = head.comparisonBeam === null && actions[0]?.prominent ? actions[0] : null;
  const transitionButton = $('headlamp-progress-action');
  transitionButton.hidden = !transition;
  transitionButton.dataset.action = transition?.id ?? '';
  transitionButton.textContent = transition?.label ?? '';
  const activeBeam = head.comparisonBeam === 'off' ? null : head.comparisonBeam ?? (head.lightsOn ? head.mode : null);
  $('headlamp-start').textContent = t(head.comparisonBeam !== null ? (head.adjusting ? 'resumeAiming' : 'returnToAiming')
    : head.adjusting ? 'goToAdjustment' : 'startAiming');
  $('headlamp-power').hidden = head.comparisonBeam !== null;
  actionButtons($('headlamp-power'), cabinActions().filter(({ id }) => id !== 'lights-toggle' || transition?.id !== id), 'secondary');
  const expected = head.adjusting && waitingForBeam();
  for (const button of $('headlamp-power').children) button.dataset.recommended = expected && button.dataset.action === 'beam-' + expected;
  if (activeBeam !== displayedBeam) {
    paintHeadlampIndicator($('headlamp-mode-icon'), activeBeam);
    displayedBeam = activeBeam;
  }
  $('headlamp-mode-icon').hidden = !activeBeam;
  $('headlamp-mode-text').textContent = t(activeBeam ? activeBeam + 'On' : 'lightsOff');
  const returnView = { rig: 'returnRig', wall: 'returnWall', beams: 'returnBeams', road: 'returnRoad', adjusters: 'returnAdjusters' };
  const back = head.comparisonBeam === null && view === 'cabin' && cabinReturn && !waitingForBeam() && !transition
    ? { id: 'beam-return', label: t(returnView[cabinReturn]) } : null;
  $('headlamp-return').hidden = !back;
  $('headlamp-return').textContent = back?.label ?? '';
  $('headlamp-return').dataset.action = back?.id ?? '';
  if (head.comparisonBeam !== null) return;

  const stage = headStage(head, method);
  const live = head.adjusting && head.lightsOn && stage !== 'position';
  const [x, y] = wallMark(head);
  const [probeX, probeY] = head.probe;
  const [yaw, pitch] = aim(head);
  const pitchTarget = beamPitchTarget(head.mode);
  const aligned = aimPass(head);
  const axisToAdjust = actions[0]?.id === 'check' ? pendingAimAxis(head) : -1;
  const line = head.side === 'left' ? 'B' : 'C';
  $('beamsetter-preview').hidden = !live;
  if (live) {
    const plot = $('beamsetter-preview-plot');
    if (optical) paintWall(plot, { ...head, distance: 7.62 }, false);
    else paintAimingWall(plot, head, false, [head.side], true);
    plot.setAttribute('aria-label', t(optical ? 'beamPlot' : 'closeUp'));
    $('beam-target-legend').textContent = optical ? t('aimTargetLine') : t('wallCross')
      .replace('{line}', line).replace('{level}', head.mode === 'low' ? 'D' : 'H');
    const guide = $('beamsetter-preview-guide');
    guide.hidden = optical;
    guide.textContent = optical ? '' : t(head.mode === 'low' ? 'wallCloseUpLow' : 'wallCloseUpHigh').replace('{line}', line);
    $('beamsetter-preview-state').dataset.verdict = aligned ? 'ok' : 'correct';
    $('beamsetter-preview-state').textContent = t(aligned ? 'actualOnTarget' : 'actualOffTarget');
  }
  $('beam-readout-title').textContent = t(optical ? 'lightReadout' : 'wallReadout');
  $('beam-mark-label').textContent = t(optical ? 'horizontal' : 'wallLateral').replace('{line}', line);
  $('beam-probe-label').textContent = t(optical ? 'vertical' : 'wallVertical');
  const targets = optical ? [0, pitchTarget].map(target => ({ target, tolerance: aimTolerance })) : wallAimTargets(head);
  const values = optical ? [yaw, pitchTarget + pitch] : [x, y];
  const verdicts = [yaw, pitch].map(error => Math.abs(error) <= aimTolerance ? 'ok' : 'correct');
  const unit = optical ? degrees : centimeters;
  for (const [index, id] of ['beam-mark', 'beam-lux'].entries()) {
    const error = index === 0 ? yaw : pitch;
    const verdict = verdicts[index];
    const { target, tolerance } = targets[index];
    $(id).textContent = live ? unit(values[index]) : '—';
    $(id).dataset.verdict = live ? verdict : '';
    $(id + '-target').textContent = t('tolerance') + ' ' + unit(target) + ' ± ' + unit(tolerance);
    $(id + '-direction').hidden = !live;
    $(id + '-direction').dataset.verdict = verdict;
    $(id + '-direction').textContent = t(verdict === 'ok' ? 'inRange' : aimDirection(index, error));
  }
  $('beam-probe-position').textContent = lampName(head.side) + (optical
    ? ' · ' + t('opticalDistance') + ' ' + meters(.50)
    : live ? ' · ' + t('probe') + ' ' + format(wallLux(head, probeX, probeY), 1) + ' ' + lux(language) +
      ' · x ' + centimeters(probeX) + ' · y ' + centimeters(probeY) : '');
  $('aiming-method').closest('label').hidden = !stage;
  $('aiming-method').value = sceneStatus === 'fallback' ? 'wall' : head.route;
  $('aiming-method').disabled = sceneStatus === 'fallback';
  $('lamp-progress').textContent = lampName(head.side) + ' · ' + t('lampProgress')
    .replace('{current}', lampSides.indexOf(head.side) + 1).replace('{total}', lampSides.length);
  const step = method === 'wall' && stage === 'position' ? 'prepareWall' : stage;
  const bothVerified = !nextLamp();
  const complete = bothVerified && head.shutdownConfirmed;
  $('headlamp-step').textContent = t(!head.adjusting ? 'aimingReady' : complete ? 'aimingComplete'
    : step === 'done' ? (bothVerified ? 'pairDone' : head.side + 'Verified') : step);
  const cabinBeam = head.adjusting && view === 'cabin' ? waitingForBeam() : null;
  const cabinHint = cabinBeam ? (!head.lightsOn ? 'cabinPower' : cabinBeam === 'low' ? 'cabinLow' : 'cabinHigh') : cabinReturn && head.lightsOn ? 'cabinReturnHint' : 'cabinHint';
  const transitionHint = ({ check: stage === 'recheck' ? 'verifyLampHelp' : 'checkBeamHelp', 'lights-toggle': 'finishLightsHelp',
    'next-lamp': lampMethod(nextLamp()) === 'wall' ? 'continueOnWall' : 'continueOnRig' })[transition?.id];
  const viewHint = transitionHint ?? (cabinBeam ? cabinHint : null)
    ?? ({ 'beam-cabin': 'beamSelectHint', 'raise-hood': 'openHoodHelp', 'pick-driver': 'screwdriverHelp' })[actions[0]?.id];
  $('headlamp-hint').textContent = t(!head.adjusting ? 'aimingReadyHelp' : complete ? 'aimingCompleteHelp' : viewHint ?? (beamWarning ? 'outOfAim' : step === 'done' ? 'completeBeam'
    : step === 'dipped' && method === 'wall' ? 'wallDippedHelp' : step + 'Help'));
  $('headlamp-method').hidden = step === 'done';
  $('headlamp-method').textContent = t(method + 'Method');
  const direction = axisToAdjust < 0 ? '' : t(aimDirection(axisToAdjust, aim(head)[axisToAdjust]));
  const next = direction || (cabinBeam ? t(cabinBeam) : actions[0]?.label);
  if (next) {
    $('next-action').hidden = false;
    $('next-action').textContent = t('nextAction') + ' · ' + next;
  }
  $('lamp-type').value = head.lamp;
  $('wall-distance').value = head.distance;
  $('wall-distance').closest('label').hidden = !stage || method !== 'wall';
  $('wall-target-notes').hidden = method !== 'wall';
  $('wall-training-values').textContent = t('wallTrainingValues').replace('{slope}', format(dippedSlope) + '%')
    .replace('{drop}', format(head.distance * dippedSlope, 2) + ' ' + (language === 'uk' ? 'см' : 'cm'))
    .replace('{distance}', meters(head.distance))
    .replace('{tolerance}', degrees(aimTolerance));
  const canAdjust = head.adjusting && head.hoodOpen && head.toolPicked && stage !== 'position' && head.lightsOn && !waitingForBeam();
  $('headlamp-aim-inputs').hidden = !canAdjust;
  const cue = $('headlamp-aim-next');
  const cueText = axisToAdjust < 0 ? '' : t(axisToAdjust ? 'verticalNext' : 'horizontalNext') + ' · ' + direction;
  cue.hidden = !cueText;
  if (cue.textContent !== cueText) cue.textContent = cueText;
  ['horizontal','vertical'].forEach((axis, index) => {
    const slider = $('aim-' + axis);
    slider.value = index === 0 ? yaw : pitch;
    slider.disabled = !canAdjust;
    for (const button of slider.closest('.aim-adjustment').querySelectorAll('button')) {
      const increase = Number(button.dataset.aimStep) > 0;
      button.disabled = slider.disabled || slider.valueAsNumber === Number(increase ? slider.max : slider.min);
      button.dataset.recommended = index === axisToAdjust && increase === (slider.valueAsNumber < 0);
      button.setAttribute('aria-label', t(index === 0 ? (increase ? 'aimRight' : 'aimLeft') : (increase ? 'aimUp' : 'aimDown')));
    }
    const output = $('aim-' + axis + '-value');
    output.textContent = unit(values[index]);
    output.dataset.verdict = verdicts[index];
  });
  $('beam-coupling').textContent = t(head.lamp === 'laser' ? 'laserExplanation' : lampTypes[head.lamp].separate ? 'separate' : 'shared');
  actionButtons($('headlamp-actions'), actions.filter(({ id, prominent }) => !prominent && (view !== 'cabin' || id !== 'beam-cabin')));
  $('wall-caption').textContent = t('lampHeight') + ' ' + centimeters(lampHeight) + ' · ' + t('distance') + ' ' + meters(head.distance, 2)
    + (head.mode === 'low' ? ' · ' + t('drop') + ' ' + centimeters(head.distance * dippedSlope / 100) + ' · ' + t('wallHeight') + ' ' + centimeters(lampHeight - head.distance * dippedSlope / 100) : '');
  $('wall-scale').textContent = '0–' + screen.scale + '+ ' + lux(language) + ' · ' + t('simulated');
  const measurementKey = head.distance + ':' + language;
  if (measurementKey !== renderedMeasurements) {
    $('measured-values').replaceChildren(...measuredDipped.map(([angle, ...values]) => {
      const row = document.createElement('tr');
      const heading = document.createElement('th');
      heading.scope = 'row';
      heading.textContent = degrees(angle);
      row.append(heading);
      for (const cd of values) row.insertCell().textContent = format(cd) + ' cd · ' + format(measuredWallLux(cd, angle, head.distance), 1) + ' ' + lux(language);
      return row;
    }));
    renderedMeasurements = measurementKey;
  }
}

function renderReach() {
  const table = $('road-reach-table');
  table.dataset.mode = head.comparisonBeam ?? 'off';
  if (reachLanguage === language) return;
  $('road-scope').textContent = t('roadScope') + ' ' + format(floorProfile.threshold, 1) + ' ' + lux(language) + '.';
  table.tBodies[0].replaceChildren(...types.map(lamp => {
    const row = document.createElement('tr');
    const name = document.createElement('th');
    name.scope = 'row';
    name.textContent = t(lamp);
    row.append(name);
    for (const mode of ['low', 'high']) {
      const cell = row.insertCell();
      const reach = roadReach(lamp, mode);
      cell.dataset.meters = reach;
      cell.textContent = meters(Math.round(reach));
    }
    return row;
  }));
  reachLanguage = language;
}

function renderWall() {
  const measured = wallSource === 'measured';
  const sameBench = { distance: head.distance, probe: head.probe };
  const field = lamp => ({ ...head, ...sameBench, lamp, mode: 'low', measured: true });
  const live = measured ? field('halogen') : head;
  const reference = measured ? field('led') : pinned && { ...pinned, ...sameBench,
    probe: [head.probe[0] + lampCenter(head.side) - lampCenter(pinned.side), head.probe[1]] };
  const describe = (beam, label) => {
    const value = wallLux(beam, ...head.probe);
    const reading = value === null ? t('noSample') : format(value, 1) + ' ' + lux(language);
    return [label, t(beam.lamp), t(beam.mode), beam.measured || beam.lightsOn ? reading : '—'].filter(Boolean).join(' · ');
  };
  $('current-caption').textContent = describe(live, measured ? '' : t('current'));
  $('reference-beam').hidden = !reference;
  $('pin-beam').hidden = measured;
  $('pin-beam').disabled = !pinned && !head.lightsOn;
  $('pin-beam').textContent = t(pinned ? 'unpin' : 'pin');
  $('pin-beam').setAttribute('aria-pressed', Boolean(pinned));
  const paint = measured ? paintWall : paintAimingWall;
  paint(wall, live);
  if (reference) {
    $('reference-caption').textContent = describe(reference, measured ? '' : t('pinned'));
    paint(referenceWall, reference);
  }
  if (measured) {
    $('wall-caption').textContent = t('distance') + ' ' + meters(head.distance, 2) + ' · x ' + centimeters(head.probe[0]) + ' · y ' + centimeters(head.probe[1]);
    $('wall-scale').textContent = t('measuredScale') + ' · 0–' + screen.scale + '+ ' + lux(language);
  }
}

function render() {
  if (!station) { requestDraw?.(); return; }
  const ready = sceneStatus === 'ready';
  const key = station === 'diagnostics' ? 'bay' : station;
  const title = t(key);
  document.title = title + ' · AutoMethods';
  $('view-title').textContent = title;
  $('view-intro').textContent = t(key + 'Intro');
  for (const id of ['bay','alignment','headlamp']) $(id + '-panel').hidden = key !== id;
  $('lighting-references').hidden = station !== 'headlamp';
  $('diagnostic-views').hidden = key === 'bay' || (station === 'alignment' && sceneStatus === 'fallback');
  $('alignment-views').hidden = station !== 'alignment';
  $('headlamp-views').hidden = station !== 'headlamp';
  $('headlamp-controls').hidden = station !== 'headlamp';
  const view = headView();
  const comparing = station === 'headlamp' && head.comparisonBeam !== null;
  const fallbackPlot = station === 'headlamp' && view === 'wall' && sceneStatus === 'fallback';
  const plotParent = $(fallbackPlot ? 'stage' : 'photometry');
  if ($('wall-view').parentElement !== plotParent) plotParent.append($('wall-view'));
  $('headlamp-panel').classList.toggle('measured-wall', fallbackPlot && wallSource === 'measured');
  for (const button of document.querySelectorAll('[data-light-view]')) button.setAttribute('aria-pressed', button.dataset.lightView === view);
  for (const button of document.querySelectorAll('[data-axle-view]')) button.setAttribute('aria-pressed', !alignment.monitorView && (button.dataset.axleView === 'true') === alignment.axleView);
  $('view-alignment-monitor').setAttribute('aria-pressed', Boolean(alignment.monitorView));
  $('wall-view').hidden = !fallbackPlot && station !== 'headlamp';
  $('road-reach-panel').hidden = !comparing;
  $('comparison-toolbar').hidden = !comparing;
  $('comparison-lights').checked = comparing && head.comparisonBeam !== 'off';
  for (const button of $('comparison-toolbar').querySelectorAll('button')) {
    button.setAttribute('aria-pressed', button.dataset.comparisonBeam === head.comparisonBeam);
  }
  $('beam-instrument').hidden = $('beam-exercise-panel').hidden = comparing;
  canvas.hidden = sceneStatus === 'fallback';
  $('diagnostic-hotspots').hidden = canvas.hidden;
  $('headlamp-mode-status').hidden = station !== 'headlamp';
  $('headlamp-return').hidden = true;
  $('axle-repeater').hidden = !(ready && station === 'alignment' && inspectionPit());
  if ($('axle-repeater').hidden) $('axle-repeater').setAttribute('aria-pressed', false);
  $('scene-message').hidden = ready || fallbackPlot;
  $('scene-message').textContent = ready ? '' : t(sceneStatus);
  $('scene-status').textContent = station === 'headlamp'
    ? t(({ rig: 'beamsetterView', cabin: 'cabinView', beams: 'beamsView', adjusters: 'aimingReady' })[view] ?? view)
    : station === 'alignment' && inspectionPit() ? t('inspectionPit') : title;
  $('viewport-hint').hidden = false;
  $('viewport-hint').textContent = !canvas.hidden && ready ? t('rotateHint') : station === 'headlamp' && view === 'wall' ? t('wallHint') : '';
  $('next-action').hidden = true;
  if (station === 'alignment') renderAlignment();
  if (station === 'headlamp') {
    renderHeadlamp(view);
    if (fallbackPlot || $('photometry').open) renderWall();
    if (comparing) renderReach();
  }
  requestDraw?.();
}

function motion(kind, duration, finish, from = 0) {
  const time = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
  const operation = { kind, start: performance.now(), duration: time, from };
  if (!time) { finish(); render(); return; }
  alignment.motion = operation;
  render();
  setTimeout(() => {
    if (alignment.motion !== operation) return;
    alignment.motion = null;
    finish();
    render();
  }, time);
}

function setAim(index, value) {
  if (head.comparisonBeam !== null || !head.lightsOn || !head.hoodOpen || !head.toolPicked || headStage(head, testMethod()) === 'position' || waitingForBeam()) return;
  const next = Math.min(1.5, Math.max(-1.5, Math.round(value * 20) / 20));
  if (aim(head)[index] === next) return;
  aim(head)[index] = next;
  head.shutdownConfirmed = false;
  beamWarning = false;
  for (const method of ['rig','wall']) {
    const stage = headStage(head, method);
    if (stage === 'done' || (stage === 'recheck' && !lampTypes[head.lamp].separate)) head.stages[method][head.side] = 'dipped';
  }
  render();
}
function setToe(index, value, animate = false) {
  if (alignment.motion || alignment.stage !== 'adjust' || Math.floor(index / 2) !== alignment.axle) return;
  const to = Math.min(2.5, Math.max(-2.5, Math.round(value * 20) / 20));
  const from = alignment.turns[index];
  const move = { to, start: performance.now() };
  turnMotion[index] = null;
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches && from !== to) {
    turnMotion[index] = move;
    const tick = time => {
      if (turnMotion[index] !== move) return;
      const f = Math.max(0, Math.min(1, (time - move.start) / 260));
      alignment.turns[index] = from + (to - from) * f;
      if (f < 1) requestAnimationFrame(tick); else turnMotion[index] = null;
      render();
    };
    requestAnimationFrame(tick);
    return;
  }
  alignment.turns[index] = to;
  render();
}
function setProbe(probe) {
  head.probe = [Math.max(-screen.halfWidth, Math.min(screen.halfWidth, probe[0])), Math.max(screen.bottom, Math.min(screen.top, probe[1]))];
  render();
}
function act(action) {
  if (action.startsWith('open-')) { navigate(action.slice(5)); return; }
  if (action.startsWith('panel-')) {
    alignment.axleView = true;
    action = action.slice(6);
  }
  if (station === 'alignment') {
    if (action.startsWith('toe-')) {
      const [, side, direction] = action.split('-');
      const index = alignment.axle * 2 + (side === 'left' ? 0 : 1);
      setToe(index, (turnMotion[index]?.to ?? alignment.turns[index]) + (direction === 'plus' ? .25 : -.25), true);
      return;
    }
    if (!alignmentActions().some(item => item.id === action)) return;
    if (action === 'setup') alignment.stage = 'targets';
    else if (action.startsWith('mount-')) {
      alignment.mounts.push(action.slice(6));
      if (alignment.mounts.length === 4) alignment.stage = 'compensate';
    } else if (action === 'compensate') {
      motion('roll', 1650, () => { alignment.baseline = alignmentReadings(alignment); alignment.stage = 'sweep'; });
      return;
    } else if (action === 'steer') {
      const from = alignment.steer;
      alignment.steer = [-20,20,0][steeringStep];
      motion('steer', 620, () => {
        steeringStep++;
        if (steeringStep === 3) {
          alignment.caster = true;
          alignment.stage = 'loosen';
          if ($('follow-actions').checked) {
            alignment.axleView = true;
            alignment.monitorView = false;
          }
        }
      }, from);
      return;
    } else if (action === 'loosen') {
      alignment.verified = null;
      if ($('follow-actions').checked) {
        alignment.axleView = true;
        alignment.monitorView = false;
      }
      motion('lock', 1100, () => { alignment.stage = 'adjust'; }, 0);
      return;
    } else if (action === 'tighten') {
      turnMotion.forEach((move, i) => { if (move) setToe(i, move.to); });
      motion('lock', 1100, () => {
        if (alignment.exercise === 'four' && alignment.axle === 1 && !axleAnglesPass(alignmentReadings(alignment), 'toe', 0)) {
          alignment.axle = 0;
          alignment.stage = 'loosen';
          return;
        }
        alignment.stage = 'verify';
        if ($('follow-actions').checked) alignment.axleView = false;
      }, 1);
      return;
    } else if (action === 'verify') {
      motion('roll', 1650, () => {
        alignment.verified = alignmentReadings(alignment);
        alignment.stage = 'done';
        alignment.axle = [1, 0].find(axle => !axleAnglesPass(alignment.verified, 'toe', axle)) ?? alignment.axle;
      });
      return;
    }
  } else if (station === 'headlamp') {
    if (action === 'beam-cabin') selectHeadView('cabin');
    if (action === 'beam-return' && cabinReturn && !waitingForBeam()) selectHeadView(cabinReturn);
    if (head.comparisonBeam === null && ['lights-toggle','beam-low','beam-high'].includes(action)) {
      if (action === 'lights-toggle') {
        head.lightsOn = !head.lightsOn;
        if (!head.lightsOn && head.adjusting && !nextLamp()) head.shutdownConfirmed = true;
      } else {
        head.mode = action.slice(5);
        head.lightsOn = true;
      }
      beamWarning = false;
    }
    const method = testMethod();
    const stage = head.adjusting && head.comparisonBeam === null ? headStage(head, method) : null;
    if (action === 'position' && stage === 'position') {
      head.stages[method][head.side] = 'dipped';
      if (method === 'wall' && head.toolPicked && !aimPass(head, 'low') && $('follow-actions').checked) selectHeadView('adjusters');
    } else if (action === 'raise-hood' && requiredBeam(stage) && !waitingForBeam()) {
      head.hoodOpen = true;
    } else if (action === 'pick-driver' && head.hoodOpen && requiredBeam(stage) && !waitingForBeam()) {
      head.toolPicked = true;
      if (method === 'wall' && $('follow-actions').checked) selectHeadView('adjusters');
    } else if (action === 'next-lamp' && stage === 'done') {
      const other = nextLamp();
      if (other) {
        const previousMethod = head.method;
        selectLamp(other);
        if ((head.method !== previousMethod || head.presentation === 'cabin') && $('follow-actions').checked) {
          selectHeadView(head.method === 'wall' ? 'beams' : 'rig');
        }
      }
    } else if (action === 'check' && requiredBeam(stage)) {
      if (waitingForBeam()) return;
      if (aimPass(head)) {
        head.stages[method][head.side] = ({ dipped: 'main', main: 'recheck', recheck: 'done' })[stage];
        if (!nextLamp()) {
          head.hoodOpen = false;
          head.toolPicked = false;
        }
        beamWarning = false;
      } else beamWarning = true;
    }
  }
  render();
}

function selectLamp(side) {
  const method = lampMethod(side);
  if (side === head.side && method === head.method) return;
  head.side = side;
  head.method = method;
  head.probe = [0, -.2];
  beamWarning = false;
  focusView?.();
}

for (const button of document.querySelectorAll('[data-station], [data-open]')) button.addEventListener('click', () => navigate(button.dataset.station || button.dataset.open));
for (const button of document.querySelectorAll('[data-light-view]')) button.addEventListener('click', () => {
  selectHeadView(button.dataset.lightView);
  render();
});
$('aiming-method').addEventListener('change', event => {
  head.route = event.target.value;
  const unfinished = nextLamp();
  if (unfinished) head.shutdownConfirmed = false;
  selectLamp(unfinished ?? lampSides.at(-1));
  selectHeadView(head.method === 'wall' ? 'beams' : 'rig');
  render();
});
$('photometry').addEventListener('toggle', () => { if ($('photometry').open) render(); });
for (const button of document.querySelectorAll('[data-axle-view]')) button.addEventListener('click', () => {
  alignment.monitorView = false;
  alignment.axleView = button.dataset.axleView === 'true';
  focusView?.();
  render();
});
$('view-alignment-monitor').addEventListener('click', () => { alignment.monitorView = !alignment.monitorView; focusView?.(); render(); });
$('headlamp-return').addEventListener('click', event => act(event.currentTarget.dataset.action));
$('headlamp-progress-action').addEventListener('click', event => {
  const button = event.currentTarget;
  act(button.dataset.action);
  if (button.hidden) $('stage').focus({ preventScroll: true });
});
$('headlamp-start').addEventListener('click', () => {
  if (head.comparisonBeam !== null) {
    selectHeadView(comparisonReturn);
  } else {
    head.adjusting = true;
    const method = testMethod();
    selectHeadView(headStage(head, method) === 'position' ? (method === 'wall' ? 'beams' : 'rig') : 'adjusters');
  }
  render();
});
$('comparison-toolbar').addEventListener('click', event => {
  const mode = event.target.closest('button')?.dataset.comparisonBeam;
  if (!mode || station !== 'headlamp' || head.comparisonBeam === null) return;
  comparisonMode = mode;
  head.comparisonBeam = mode;
  render();
});
$('comparison-lights').addEventListener('change', event => {
  if (station !== 'headlamp' || head.comparisonBeam === null) return;
  head.comparisonBeam = event.target.checked ? comparisonMode : 'off';
  render();
});
$('reset-headlamp').addEventListener('click', () => {
  const { presentation, route, lamp, distance } = head;
  head = { ...freshHeadlamp(), presentation, route, lamp, distance };
  head.method = testMethod();
  cabinReturn = undefined;
  comparisonReturn = undefined;
  pinned = null;
  beamWarning = false;
  render();
});
function resetAlignment() {
  turnMotion.fill(null);
  alignment = freshAlignment($('alignment-exercise').value);
  steeringStep = 0;
  render();
}
$('reset-alignment').addEventListener('click', resetAlignment);
$('alignment-exercise').addEventListener('change', resetAlignment);
$('axle-repeater').addEventListener('click', event => {
  const button = event.currentTarget;
  button.setAttribute('aria-pressed', button.getAttribute('aria-pressed') !== 'true');
});
$('wall-source').addEventListener('change', event => { wallSource = event.target.value; render(); });
$('pin-beam').addEventListener('click', () => { pinned = pinned ? null : structuredClone(head); render(); });
$('lamp-type').addEventListener('change', event => {
  head.lamp = event.target.value;
  head.shutdownConfirmed = false;
  for (const method of ['rig','wall']) for (const side of lampSides) {
    if (headStage(head, method, side) !== 'position') head.stages[method][side] = 'dipped';
  }
  selectLamp(lampSides[0]);
  beamWarning = false;
  render();
});
$('wall-distance').addEventListener('change', event => { head.distance = Number(event.target.value); render(); });
$('camera-rail').addEventListener('input', event => { alignment.rail = event.target.valueAsNumber; render(); });
$('left-turns').addEventListener('input', event => setToe(alignment.axle * 2, event.target.valueAsNumber));
$('right-turns').addEventListener('input', event => setToe(alignment.axle * 2 + 1, event.target.valueAsNumber));
$('aim-horizontal').addEventListener('input', event => setAim(0, event.target.valueAsNumber));
$('aim-vertical').addEventListener('input', event => setAim(1, event.target.valueAsNumber));
for (const button of document.querySelectorAll('[data-aim-step]')) button.addEventListener('click', () => {
  const slider = $('aim-' + button.dataset.aimAxis);
  const index = Number(button.dataset.aimAxis === 'vertical');
  setAim(index, slider.valueAsNumber + Number(button.dataset.aimStep) * Number(slider.step));
});
for (const plot of [wall, referenceWall]) plot.addEventListener('click', event => {
  const bounds = plot.getBoundingClientRect();
  const [x, y] = wallPoint((event.clientX - bounds.left) / bounds.width, 1 - (event.clientY - bounds.top) / bounds.height);
  setProbe([x - (wallSource === 'measured' ? 0 : lampCenter(head.side)), y]);
});
for (const plot of [wall, referenceWall]) plot.addEventListener('keydown', event => {
  const movement = { ArrowLeft: [-.05,0], ArrowRight: [.05,0], ArrowUp: [0,.05], ArrowDown: [0,-.05] }[event.key];
  if (!movement) return;
  event.preventDefault();
  setProbe(head.probe.map((value, index) => value + movement[index]));
});

export const diagnosticControls = {
  getState: () => ({ station, alignment, head, inspectionPit: inspectionPit(), actions: sceneActions() }),
  act, setProbe, text: t, degrees,
  turnAimScrew(index, steps) {
    if (station === 'headlamp') setAim(index, aim(head)[index] + steps * .05);
  },
  connect(go, draw, preset) { navigate = go; requestDraw = draw; focusView = preset; },
  setPitLocation(inPit) {
    if (walkingInPit === inPit) return;
    walkingInPit = inPit;
    if (station === 'alignment') render();
  },
  select(next) { station = next; },
  status(value) {
    sceneStatus = value;
    if (value === 'fallback') {
      $('wall-source').value = wallSource = 'training';
      selectLamp(nextLamp() ?? lampSides.at(-1));
    }
    render();
  },
  render(lang) {
    if (language !== lang || !$('lamp-type').options.length) { language = lang; localize(); }
    if (station) render();
  },
};
