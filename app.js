import { degrees, dimensions, exercises, measure, planes, spin, spinTime, tolerance, validDimensions } from './balance.js';
import { bayClearance, liftJog, liftLimit, liftSteps } from './lift-exercise.js';
import { diagnosticControls } from './diagnostics.js';

const translations = {
  en: {
    language: 'Language', brand: 'AutoMethods', lab: 'Basic Vehicle Service Lab', title: 'Wheel balancing', diagnosticBay: 'Diagnostics bay', loadingWorkshop: 'Preparing workshop…',
    aboutProject: 'About the project', contributors: 'Contributors', lomakin: 'V. O. Lomakin', melnychuk: 'S. V. Melnychuk',
    lomakinQualification: 'PhD in Engineering', melnychukQualification: 'PhD in Engineering, Associate Professor',
    aiAssistance: 'AI assistance with writing, translation, programming and verification (GPT-6 family).', projectCopyright: '© 2026 Project authors.',
    institution: 'Educational institution', college: 'Zhytomyr Agrotechnical Professional College', department: 'Department of Automotive Transport',
    intro: 'Measure a wheel, place correction weights, and verify the result on a two-plane balancer.',
    bayIntro: 'Service wheels in the left bay. The alignment rack and aiming wall are across the aisle.', followActions: 'Follow actions', liftIntro: 'Adjust the lift arms or raise a Model 3 on its support pads.',
    liftVehicle: 'Start Model 3 exercise', liftVehicleLoading: 'Loading the Model 3…', liftVehicleUnavailable: 'The Model 3 could not be loaded.',
    liftStartAtFloor: 'Fully lower the empty lift to start the exercise.', liftFree: 'Free lift', liftAgain: 'Repeat exercise',
    liftGuides: 'Show lift points', liftPadLegend: 'Body lift points', liftBatteryLegend: 'Battery area · keep pads clear',
    liftProcedure: 'Tesla Model 3 two-post lift procedure', liftGuided: 'Model 3 lift exercise',
    liftTraining: 'Guided simulation. Use the vehicle and lift manuals for actual service.',
    liftBusy: 'Movement in progress…', liftLocksSeated: 'Safety locks supporting the load', liftLocksUnloaded: 'Load lifted off the safety locks',
    liftStages: {
      preflight: ['Confirm pre-lift checks', 'Inspect the lift, unplug the charge cable, close the doors and trunks, and clear the bay.'],
      openArms: ['Swing arms clear', 'Select the highlighted arm to retract and swing the arms out of the vehicle path.'],
      driveIn: ['Drive into bay', 'Select the Model 3 to drive it between the posts.'],
      positionPads: ['Position pads', 'Select the highlighted arm to position all four pads under the body lift points. Keep them clear of the battery and side rails.'],
      raiseToCheck: ['Raise slightly', 'Hold Raise on the lift’s control panel until the lift stops for the initial support check.'],
      checkPads: ['Confirm four pads and arm locks', 'Check all four contacts, vehicle balance, and the arm restraints before raising farther.'],
      raiseToService: ['Raise to service height', 'Hold Raise to reach the exercise’s service height.'],
      seatLocks: ['Settle onto safety locks', 'Hold Lower until the carriages settle onto the locks.'],
      clearArea: ['Confirm area clear', 'Check that people, tools, and equipment are clear of the vehicle before lowering.'],
      raiseOffLocks: ['Raise off the locks', 'Hold Raise briefly to take the load off the safety locks.'],
      releaseLocks: ['Release safety locks', 'Select the safety-lock lever on the lift post before lowering the vehicle.'],
      lowerToFloor: ['Lower to the floor', 'Hold Lower until the tyres touch down and the pads clear the vehicle.'],
      withdrawArms: ['Retract and swing arms clear', 'Select the highlighted arm to move the arms out from under the vehicle.'],
      driveOut: ['Drive out', 'Select the Model 3 to drive it clear of the lift.'],
      done: ['Exercise complete', 'The vehicle is out of the bay and all four arms are clear.'],
    },
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', vehicleCredit: 'Tesla 2018 Model 3 by Ameer Studio',
    facePitStairs: 'Face stairs', walkControls: 'Walk controls',
    walkForward: 'Walk forward', walkBack: 'Walk back', walkLeft: 'Walk left', walkRight: 'Walk right',
    walkHint: 'WASD or arrows to walk · Drag to look · Esc to stop',
    changer: 'Tyre changer', changerIntro: 'Break both beads, clamp the rim, and watch each bead peel over the rim flange.',
    changerReference: 'Ranger swing-arm tyre changer manual', changerLoading: 'Loading the tyre changer and wheel.', changerUnavailable: 'The tyre changer or wheel model is unavailable.',
    changerLoad: 'Load wheel', changerBreak: 'Break both beads', changerClamp: 'Clamp rim', changerPaste: 'Lubricate bead',
    changerUpper: 'Demount upper bead', changerLower: 'Demount lower bead',
    changerEmpty: 'Select the wheel on the floor to move it to the bead breaker.',
    changerLoaded: 'Press the bead-breaker pedal on the right. Watch the sidewalls flex on both sides.',
    changerLoose: 'Both beads are free. Press the middle clamp pedal to seat and clamp the rim.',
    changerClamped: 'Select the brush in the paste pot to lubricate the bead.',
    changerLubricated: 'Press the turntable pedal on the left to lift the upper bead over the rim.',
    changerUpperOff: 'The upper bead is clear. Press the turntable pedal again to remove the tyre.',
    changerDone: 'Tyre removed. Press Reset to start again with an assembled wheel.',
    changerMoving: 'Moving the wheel to the bead breaker.', changerBreaking: 'Breaking the beads on both sides.', changerClamping: 'Seating the wheel and clamping the rim.',
    changerPeeling: 'Guiding the bead over the rim as the turntable rotates.', changerPasting: 'Applying mounting lubricant with the brush.',
    changerInstrument: 'Tyre changer readout', liftInstrument: 'Lift readout', changerProgress: 'Tyre removal progress',
    liftRaising: 'Raising', liftLowering: 'Lowering', liftStopped: 'Stopped', changerComplete: 'Tyre removed',
    startKey: 'Start',
    guidedNote: 'Start with no correction weights. Measure the imbalance, then fit the two indicated weights.',
    faultNote: 'A 25 g weight is already fitted on the wrong plane. Measure its effect, remove it, then remeasure to find the correct weights.',
    needsCorrection: 'Needs correction', withinTolerance: 'Within 2 g', nextStep: 'Next', removeFault: 'Remove the misplaced weight',
    lastSpin: 'Last spin · measure again after changing the weights.', prefitWeight: 'pre-fitted',
    faultMeasuredClosed: 'Open the guard to remove the pre-fitted outer weight.', faultMeasured: 'Remove the pre-fitted outer weight, then measure again.',
    exercise: 'Exercise', guided: 'Guided balance', fault: 'Wrong-plane weight', workshop: 'Workshop view', controls: 'Equipment controls',
    bay: 'Service bay', balancer: 'Balancer', lift: 'Two-post lift', view: 'Equipment view', rotateView: 'Change view', swapPlanes: 'Swap diagrams', liftRise: 'Lift rise',
    raiseLift: 'Raise lift', lowerLift: 'Lower lift', forkSpread: 'Arm spread', forkReach: 'Arm extension', keyboardControls: 'Keyboard controls',
    bayHint: 'Choose a close-up for larger controls.', liftHint: 'Hold Raise or Lower on the lift’s control panel.', parked: 'Wheel on floor',
    liftPumpHint: 'Hold Raise (↑) on the lift.', liftValveHint: 'Hold Lower (↓) on the lift.',
    viewHint: 'Drag to orbit · Scroll to zoom', fallback: 'Schematic view', instrument: 'Balancer readout', spinProgress: 'Spin progress', spinSpeed: 'Spin speed',
    inner: 'Inner plane', outer: 'Outer plane', mark: 'Mark', index: 'Turn to mark', closeHood: 'Close guard',
    openHood: 'Open guard', spin: 'Start spin', setup: 'Mount & measure', diameter: 'Rim diameter', width: 'Rim width',
    offset: 'Gauge distance', mount: 'Mount and clamp wheel', mounted: 'Wheel clamped', reset: 'Reset exercise',
    standHint: 'Select the wheel to mount it, move the guard by its handle, and start the spin on the touchscreen.',
    weights: 'Fit correction weights', weightsHelp: 'With the guard open, use Turn to mark to bring the selected plane’s marker to 12 o’clock.',
    weightsKeys: 'With the guard open, tap Inner or Outer on the touchscreen to turn its mark to 12 o’clock. Set the mass, then select the highlighted weight tray.',
    plane: 'Rim plane', mass: 'Weight', atTop: 'Angle at 12 o’clock', fit: 'Fit weight', fitted: 'Fitted weights',
    remove: 'Remove', none: 'No weights fitted.', references: 'References and technical data',
    vehicleReferences: 'Vehicles', equipmentReferences: 'Workshop equipment',
    teslaDimensions: 'Tesla Model 3 (2017–2023) · Dimensions', teslaManual: 'Tesla Model 3 (2017–2023) · Service manual',
    porscheSpecifications: 'Porsche 911 · Specifications by generation (PDF)',
    balancerBrochure: 'John Bean B800P · Datasheet (PDF)', beamsetterManual: 'HELLA SEG V · Operating manual (PDF)',
    modelCredits: '3D model credits',
    referenceText: 'The cabinet and fixtures draw on the B800P. The training cycle uses the S400’s 200 rpm and 8-second timing. The supplied Ukrainian lift has 1,800 mm of carriage travel.',
    s400: 'S400 User Manual, §§ 1.1 and 4', twf: 'TWF-50TPL-1850 Manual, §§ 2.1 and 7.2', liftSource: 'Lift model supplied for the Service Lab · Lift - Ukrainian.blend',
    johnbean: 'John Bean B800P cabinet and fixtures', wheelCredit: 'Grab3D alloy wheel',
    preparing: 'Enter the rim dimensions and clamp the wheel.',
    mounting: 'Mounting the wheel and tightening the clamp.', closing: 'Lowering the guard.', opening: 'Raising the guard.',
    indexing: 'Turning the wheel to the correction position.', fitting: 'Fitting the correction weight.',
    unclampedGuard: 'Close the guard before starting the measuring spin.',
    ready: 'Start an 8-second measuring spin.',
    running: 'Measuring imbalance. The guard stays closed during the spin.',
    measuredClosed: 'Open the guard to place the correction weights.',
    measured: 'Turn each plane’s mark to the top and fit the indicated weight.',
    recheck: 'When the corrections are in place, close the guard and spin again to measure the residual.',
    recheckClosed: 'Spin again to measure the residual.',
    balanced: 'Balanced. Both planes are within the 2 g exercise tolerance.',
    invalid: 'Check rim diameter, width, and gauge distance before spinning.',
    mismatch: 'The entered dimensions differ from the work order. Correct them and spin again before accepting this result.',
    faultHint: 'A previous correction was fitted on the wrong plane. Inspect the fitted weights before correcting the wheel.',
    order: 'Work order', g: 'g', rpm: 'rpm', millimeters: 'mm', inches: 'in',
  },
  uk: {
    language: 'Мова', brand: 'АвтоМетод', lab: 'Лабораторія основ автосервісу', title: 'Балансування коліс', diagnosticBay: 'Пост діагностики', loadingWorkshop: 'Завантаження майстерні…',
    aboutProject: 'Про проєкт', contributors: 'Учасники розробки', lomakin: 'Ломакін В. О.', melnychuk: 'Мельничук С. В.',
    lomakinQualification: 'к. т. н.', melnychukQualification: 'к. т. н., доц.',
    aiAssistance: 'Допомога ШІ з підготовкою текстів, перекладом, програмуванням і перевіркою (моделі родини GPT-6).', projectCopyright: '© 2026 Автори проєкту.',
    institution: 'Заклад освіти', college: 'Житомирський агротехнічний фаховий коледж', department: 'Кафедра автомобільного транспорту',
    intro: 'Визначте дисбаланс колеса, установіть коригувальні вантажі та перевірте результат на двоплощинному стенді.',
    bayIntro: 'Обслуговуйте колеса на лівому посту. Стенд кутів і екран для фар розташовані навпроти через прохід.', followActions: 'Камера за дією', liftIntro: 'Відрегулюйте лапи підйомника або підніміть Model 3 на опорних подушках.',
    liftVehicle: 'Почати вправу з Model 3', liftVehicleLoading: 'Завантаження Model 3…', liftVehicleUnavailable: 'Не вдалося завантажити Model 3.',
    liftStartAtFloor: 'Повністю опустіть порожній підйомник, щоб почати вправу.', liftFree: 'Вільне керування', liftAgain: 'Повторити вправу',
    liftGuides: 'Показати точки підйому', liftPadLegend: 'Точки підйому кузова', liftBatteryLegend: 'Зона батареї · без опор',
    liftProcedure: 'Піднімання Tesla Model 3 на двостійковому підйомнику', liftGuided: 'Вправа з піднімання Model 3',
    liftTraining: 'Навчальна вправа. Для реального обслуговування дотримуйтеся настанов автомобіля й підйомника.',
    liftBusy: 'Триває переміщення…', liftLocksSeated: 'Вага на запобіжних стопорах', liftLocksUnloaded: 'Вагу знято із запобіжних стопорів',
    liftStages: {
      preflight: ['Підтвердити перевірку перед підйомом', 'Огляньте підйомник, від’єднайте зарядний кабель, зачиніть двері й багажники та звільніть пост.'],
      openArms: ['Відвести лапи', 'Виберіть виділену лапу, щоб укоротити лапи й відвести їх від траєкторії автомобіля.'],
      driveIn: ['Заїхати на пост', 'Виберіть Model 3, щоб заїхати між стійками.'],
      positionPads: ['Установити опори', 'Виберіть виділену лапу, щоб установити всі чотири опори під точками підйому кузова, поза зоною батареї та порогів.'],
      raiseToCheck: ['Трохи підняти автомобіль', 'Утримуйте кнопку підйому до зупинки для первинної перевірки опор.'],
      checkPads: ['Підтвердити положення опор і фіксацію лап', 'Перевірте контакт усіх чотирьох опор, рівновагу автомобіля та фіксацію лап.'],
      raiseToService: ['Підняти до робочої висоти', 'Утримуйте кнопку підйому до досягнення робочої висоти вправи.'],
      seatLocks: ['Опустити на запобіжні стопори', 'Утримуйте кнопку опускання, доки каретки не сядуть на стопори.'],
      clearArea: ['Підтвердити, що зона вільна', 'Перед опусканням переконайтеся, що біля автомобіля немає людей, інструментів чи обладнання.'],
      raiseOffLocks: ['Підняти зі стопорів', 'Коротко утримуйте кнопку підйому, щоб розвантажити стопори.'],
      releaseLocks: ['Відвести запобіжні стопори', 'Перед опусканням автомобіля виберіть важіль стопорів на стійці.'],
      lowerToFloor: ['Опустити на підлогу', 'Утримуйте кнопку опускання, доки колеса не торкнуться підлоги, а опори не відійдуть від кузова.'],
      withdrawArms: ['Укоротити й відвести лапи', 'Виберіть виділену лапу, щоб відвести лапи з-під автомобіля.'],
      driveOut: ['Виїхати з поста', 'Виберіть Model 3, щоб виїхати з підйомника.'],
      done: ['Вправу завершено', 'Автомобіль виїхав із поста, усі чотири лапи відведено.'],
    },
    zoomIn: 'Збільшити', zoomOut: 'Зменшити', vehicleCredit: 'Tesla Model 3 2018 року від Ameer Studio',
    facePitStairs: 'До сходів', walkControls: 'Керування рухом',
    walkForward: 'Іти вперед', walkBack: 'Іти назад', walkLeft: 'Іти ліворуч', walkRight: 'Іти праворуч',
    walkHint: 'WASD або стрілки для руху · Перетягніть для огляду · Esc для виходу',
    changer: 'Шиномонтажний стенд', changerIntro: 'Відтисніть обидва борти, затисніть обід і простежте, як борти проходять через закраїну обода.',
    changerReference: 'Настанова шиномонтажного стенда Ranger', changerLoading: 'Завантаження стенда й колеса.', changerUnavailable: 'Модель стенда або колеса недоступна.',
    changerLoad: 'Подати колесо', changerBreak: 'Відтиснути борти', changerClamp: 'Затиснути обід', changerPaste: 'Змастити борт',
    changerUpper: 'Зняти верхній борт', changerLower: 'Зняти нижній борт',
    changerEmpty: 'Виберіть колесо на підлозі, щоб перенести його до відтискача.',
    changerLoaded: 'Натисніть праву педаль відтискача й простежте за деформацією обох боковин.',
    changerLoose: 'Обидва борти відтиснуто. Натисніть середню педаль, щоб установити й затиснути обід.',
    changerClamped: 'Виберіть пензель у ємності з пастою, щоб змастити борт.',
    changerLubricated: 'Натисніть ліву педаль обертання стола, щоб зняти верхній борт з обода.',
    changerUpperOff: 'Верхній борт знято. Натисніть педаль обертання ще раз, щоб зняти шину.',
    changerDone: 'Шину знято. Натисніть «Скинути», щоб почати із зібраним колесом.',
    changerMoving: 'Перенесення колеса до відтискача.', changerBreaking: 'Відтискання бортів з обох боків.', changerClamping: 'Установлення колеса й затискання обода.',
    changerPeeling: 'Борт шини проходить через закраїну обода під час обертання стола.', changerPasting: 'Пензель наносить монтажну пасту на борт.',
    changerInstrument: 'Покази шиномонтажного стенда', liftInstrument: 'Покази підйомника', changerProgress: 'Перебіг демонтажу шини',
    liftRaising: 'Підйом', liftLowering: 'Опускання', liftStopped: 'Зупинено', changerComplete: 'Шину знято',
    startKey: 'Пуск',
    guidedNote: 'На колесі ще немає вантажів. Виміряйте дисбаланс і встановіть два вказані вантажі.',
    faultNote: 'Вантаж масою 25 г вже стоїть у хибній площині. Виміряйте його вплив, зніміть його й повторіть вимірювання.',
    needsCorrection: 'Потрібне коригування', withinTolerance: 'У межах 2 г', nextStep: 'Далі', removeFault: 'Зніміть вантаж у хибній площині',
    lastSpin: 'Останнє вимірювання · після зміни вантажів повторіть обертання.', prefitWeight: 'попередньо встановлений',
    faultMeasuredClosed: 'Відкрийте кожух, щоб зняти попередньо встановлений зовнішній вантаж.',
    faultMeasured: 'Зніміть попередньо встановлений зовнішній вантаж і повторіть вимірювання.',
    exercise: 'Вправа', guided: 'Балансування з підказками', fault: 'Вантаж у хибній площині', workshop: 'Огляд майстерні', controls: 'Керування обладнанням',
    bay: 'Сервісний пост', balancer: 'Балансувальний стенд', lift: 'Двостійковий підйомник', view: 'Вибір обладнання', rotateView: 'Змінити ракурс',
    raiseLift: 'Підняти підйомник', lowerLift: 'Опустити підйомник', forkSpread: 'Розведення лап', forkReach: 'Виліт лап', keyboardControls: 'Керування з клавіатури',
    bayHint: 'Виберіть ближчий ракурс, щоб краще бачити органи керування.',
    liftHint: 'Утримуйте кнопку підйому або опускання на панелі підйомника.', parked: 'Колесо на підлозі',
    liftPumpHint: 'Утримуйте кнопку підйому (↑) на стійці.', liftValveHint: 'Утримуйте кнопку опускання (↓) на стійці.',
    swapPlanes: 'Поміняти місцями',
    liftRise: 'Хід підйому', viewHint: 'Перетягніть для обертання · Коліщатко для масштабу', fallback: 'Схематичний вигляд',
    instrument: 'Покази стенда', spinProgress: 'Перебіг вимірювання', spinSpeed: 'Частота обертання', inner: 'Внутрішня площина', outer: 'Зовнішня площина',
    mark: 'Мітка', index: 'Повернути до мітки', closeHood: 'Закрити кожух', openHood: 'Відкрити кожух',
    spin: 'Почати обертання', setup: 'Монтаж і вимірювання', diameter: 'Діаметр обода', width: 'Ширина обода',
    offset: 'Виліт до обода', mount: 'Установити й затиснути колесо', mounted: 'Колесо затиснено', reset: 'Почати спочатку',
    standHint: 'Виберіть колесо для встановлення. Кожух переміщуйте за ручку, а обертання запускайте на сенсорному екрані.',
    weights: 'Установлення вантажів', weightsHelp: 'За відкритого кожуха натисніть «Повернути до мітки», щоб установити мітку вибраної площини на 12-й годині.',
    weightsKeys: 'За відкритого кожуха виберіть площину на сенсорному екрані, щоб повернути мітку на 12-ту годину. Задайте масу й виберіть виділений лоток вантажів.',
    plane: 'Площина обода', mass: 'Маса вантажу', atTop: 'Кут у положенні 12 год', fit: 'Установити вантаж',
    fitted: 'Установлені вантажі', remove: 'Зняти', none: 'Вантажі ще не встановлено.', references: 'Джерела та технічні дані',
    vehicleReferences: 'Автомобілі', equipmentReferences: 'Сервісне обладнання',
    teslaDimensions: 'Tesla Model 3 (2017–2023) · Габаритні розміри', teslaManual: 'Tesla Model 3 (2017–2023) · Сервісний посібник',
    porscheSpecifications: 'Porsche 911 · Технічні характеристики за поколіннями (PDF)',
    balancerBrochure: 'John Bean B800P · Технічні характеристики (PDF)', beamsetterManual: 'HELLA SEG V · Настанова з експлуатації (PDF)',
    modelCredits: 'Автори 3D-моделей',
    referenceText: 'Корпус і оснащення змодельовано за зразком B800P. Частоту 200 об/хв і тривалість циклу 8 с взято з настанови S400. Хід кареток наданої моделі підйомника становить 1 800 мм.',
    s400: 'Настанова S400, розділи 1.1 і 4', twf: 'Настанова TWF-50TPL-1850, розділи 2.1 і 7.2',
    liftSource: 'Модель підйомника для лабораторії · Lift - Ukrainian.blend',
    johnbean: 'Корпус і оснащення John Bean B800P', wheelCredit: 'Легкосплавне колесо Grab3D',
    preparing: 'Уведіть розміри обода й затисніть колесо.',
    mounting: 'Монтаж і затискання колеса.', closing: 'Опускання кожуха.', opening: 'Піднімання кожуха.',
    indexing: 'Поворот колеса в положення для встановлення вантажу.', fitting: 'Установлення коригувального вантажу.',
    unclampedGuard: 'Закрийте кожух перед початком обертання.',
    ready: 'Почніть 8-секундний цикл вимірювання.',
    running: 'Вимірюємо дисбаланс. Під час обертання кожух залишається закритим.',
    measuredClosed: 'Відкрийте кожух, щоб установити коригувальні вантажі.',
    measured: 'Поверніть мітку кожної площини догори й установіть вантаж указаної маси.',
    recheck: 'Після встановлення вантажів закрийте кожух і повторіть вимірювання залишкового дисбалансу.',
    recheckClosed: 'Повторіть обертання, щоб виміряти залишковий дисбаланс.',
    balanced: 'Колесо збалансовано. Обидві площини в межах допуску вправи 2 г.',
    invalid: 'Перевірте діаметр, ширину й виліт обода перед обертанням.',
    mismatch: 'Уведені розміри відрізняються від завдання. Виправте їх і повторіть вимірювання.',
    faultHint: 'Попередній вантаж установлено в хибній площині. Перевірте встановлені вантажі, перш ніж виправити дисбаланс.',
    order: 'Завдання', g: 'г', rpm: 'об/хв', millimeters: 'мм', inches: 'дюйм',
  },
};

const $ = id => document.getElementById(id);
const dimensionInputs = Object.fromEntries(Object.keys(dimensions).map(key => [key, $(key)]));
const weightsInput = $('mass');
const angleInput = $('angle');
const planeSelect = $('weight-plane');
const scenario = $('exercise');
const languageButtons = [...document.querySelectorAll('[data-language]')];
const indexButtons = [...document.querySelectorAll('[data-index]')];
const standControls = { mount: $('mount'), hood: $('hood'), spin: $('spin'), fit: $('fit'),
  ...Object.fromEntries(indexButtons.map(button => [button.dataset.index, button])) };
const changerControls = Object.fromEntries(['load', 'break', 'clamp', 'paste', 'turn', 'reset'].map(key => ['tyre-' + key, $('changer-' + key)]));
const operations = {
  empty: ['tyre-load', 'loaded', 1550, 'changerMoving'],
  loaded: ['tyre-break', 'loose', 3650, 'changerBreaking'],
  loose: ['tyre-clamp', 'clamped', 1740, 'changerClamping'],
  clamped: ['tyre-paste', 'lubricated', 2250, 'changerPasting'],
  lubricated: ['tyre-turn', 'upper', 5100, 'changerPeeling'],
  upper: ['tyre-turn', 'removed', 4900, 'changerPeeling'],
};
const changer = { step: 'empty', ready: false, failed: false, motion: null };
const liftHeight = $('lift-height');
const liftMax = Number(liftHeight.max);
const forkInputs = { spread: $('fork-spread'), reach: $('fork-reach') };
const liftVehicle = $('lift-vehicle');
const liftGuides = $('lift-guides');
const liftStageNames = Object.keys(liftSteps);
let liftRun = { stage: 'free', arms: 'manual', carZ: null };
let guidedLiftAvailable = false;
let vehicleStatus = '';
const viewButtons = { bay: $('bay-view'), balancer: $('balancer-view'), lift: $('lift-view'), changer: $('changer-view') };
const keyboardAnchors = [...Object.values(standControls), $('lift-inputs')].map(element => {
  const anchor = document.createComment('equipment control');
  element.before(anchor);
  return { element, anchor };
});
const localizedText = [...document.querySelectorAll('[data-t]')];
const accessibleLabels = [...document.querySelectorAll('[data-label]')];
const storageKey = 'motion-lab-language';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let remembered;
try { remembered = localStorage.getItem(storageKey); } catch {}
let language = remembered === 'en' || remembered === 'uk' ? remembered
  : navigator.languages.some(tag => /^uk(?:-|$)/i.test(tag)) ? 'uk' : 'en';
let state;
let workshop;
let diagnosticStation = null;
let fallbackView = 0;
let liftDirection = 0;
let liftFrame = 0;
let liftTime = 0;
const t = key => translations[language][key];
const number = (value, places = 0) => new Intl.NumberFormat(language, { maximumFractionDigits: places }).format(value);
const readings = () => Object.fromEntries(Object.entries(dimensionInputs).map(([key, input]) => [key, input.valueAsNumber]));
const correctSetup = rim => Object.keys(dimensions).every(key => rim[key] === exercises[state.exercise].rim[key]);
const roundedMass = value => number(value, 1) + ' ' + t('g');
const verdict = result => !result ? 'pending' : result.grams <= tolerance ? 'ok' : 'correct';
const correctionAngle = result => verdict(result) === 'correct' ? result.angle : null;
const station = () => state.view === 'bay' ? state.station : state.view;
const changerLabels = { empty: 'changerLoad', loaded: 'changerBreak', loose: 'changerClamp', clamped: 'changerPaste',
  lubricated: 'changerUpper', upper: 'changerLower', removed: 'changerComplete' };
const changerStages = Object.keys(changerLabels);
const liftMotionKey = () => liftDirection > 0 ? 'liftRaising' : liftDirection < 0 ? 'liftLowering' : 'liftStopped';

function activateStation(name) {
  if (state.view === 'bay') state.station = name;
}

function reset() {
  const exercise = scenario.value;
  const rim = exercises[exercise].rim;
  state = {
    exercise, view: state?.view || 'bay', station: state?.station || 'changer', liftHeight: state?.liftHeight ?? liftHeight.valueAsNumber,
    mounted: false, closed: false, spinning: false, elapsed: 0, rpm: 0, angle: 0, turn: 0,
    result: null, dirty: false, measuredWeights: [], weights: exercises[exercise].weights.map(weight => ({ ...weight, prefit: true })),
  };
  for (const key of Object.keys(dimensionInputs)) dimensionInputs[key].value = rim[key];
  weightsInput.value = 20;
  angleInput.value = 0;
  planeSelect.value = 'inner';
  render();
}

function getSceneState() {
  return {
    ...state, changer, rim: exercises[state.exercise].rim, follow: $('follow-actions').checked,
    zoneNames: [t('bay'), t('diagnosticBay')],
    liftActive: station() === 'lift', liftDirection, liftRun,
    liftTarget: liftSteps[liftRun.stage]?.target,
    showLiftGuides: liftGuides.checked,
    nextKey: suggestedAction(), correctionAngles: Object.fromEntries(planes.map(plane => [plane, correctionAngle(state.result?.[plane])])),
    forkSpread: forkInputs.spread.valueAsNumber, forkReach: forkInputs.reach.valueAsNumber,
    console: {
      title: language === 'uk' ? 'БАЛАНСУВАННЯ' : 'WHEEL BALANCE',
      start: t('startKey'),
      innerLabel: language === 'uk' ? 'ВНУТР.' : 'INNER', outerLabel: language === 'uk' ? 'ЗОВН.' : 'OUTER',
      innerMass: state.result ? roundedMass(state.result.inner.grams) : '—',
      outerMass: state.result ? roundedMass(state.result.outer.grams) : '—',
      innerAngle: correctionAngle(state.result?.inner) == null ? '—' : state.result.inner.angle + '°',
      outerAngle: correctionAngle(state.result?.outer) == null ? '—' : state.result.outer.angle + '°',
      innerVerdict: verdict(state.result?.inner), outerVerdict: verdict(state.result?.outer),
      rpm: number(Math.round(state.rpm)) + ' ' + t('rpm'),
    },
  };
}

function drawFallback() {
  const canvas = $('fallback');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#20352f';
  ctx.fillRect(0, 0, 640, 400);
  ctx.fillStyle = '#c1d7ca';
  ctx.fillRect(24, 333, 592, 2);
  if (state.view === 'lift') {
    ctx.fillStyle = '#517a71';
    ctx.fillRect(134, 45, 28, 288);
    ctx.fillRect(478, 45, 28, 288);
    ctx.fillRect(134, 45, 372, 15);
    const top = 300 - state.liftHeight / 9;
    ctx.fillStyle = '#e0b45b';
    ctx.fillRect(158, top, 132, 12);
    ctx.fillRect(350, top, 132, 12);
    return;
  }
  for (const [index, plane] of (fallbackView % 2 ? [...planes].reverse() : planes).entries()) {
    const center = index ? 454 : 186;
    ctx.fillStyle = '#dbe9da';
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(t(plane), center, 54);
    ctx.strokeStyle = '#526d63';
    ctx.beginPath();
    ctx.arc(center, 201, 94, 0, Math.PI * 2);
    ctx.stroke();
    if (!state.mounted) continue;
    const rotation = (state.angle - (reducedMotion.matches ? 0 : state.turn)) * Math.PI / 180;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#afc5b9';
    ctx.beginPath();
    ctx.arc(center, 201, 75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    const color = plane === 'inner' ? '#d6f789' : '#ffca72';
    ctx.fillStyle = plane === 'inner' ? '#91fa45' : '#ff8c2b';
    for (const weight of state.weights.filter(weight => weight.plane === plane)) {
      const angle = weight.angle * Math.PI / 180 - rotation;
      ctx.beginPath();
      ctx.arc(center + 75 * Math.sin(angle), 201 - 75 * Math.cos(angle), 5, 0, Math.PI * 2);
      ctx.fill();
    }
    const mark = correctionAngle(state.result?.[plane]);
    if (mark != null) {
      const angle = mark * Math.PI / 180 - rotation;
      ctx.save();
      ctx.translate(center, 201);
      ctx.rotate(angle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -77);
      ctx.lineTo(0, -94);
      ctx.stroke();
      if (plane === 'inner') {
        ctx.beginPath();
        ctx.arc(0, -101, 7, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.translate(0, -101);
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-5, -5, 10, 10);
      }
      ctx.restore();
    }
  }
  ctx.textAlign = 'start';
}

function draw() {
  if (workshop) workshop.draw();
  else drawFallback();
}

function renderSpeed() {
  $('rpm').textContent = number(Math.round(state.rpm)) + ' ' + t('rpm');
  $('spin-progress').value = state.elapsed;
  draw();
}

function statusKey() {
  if (state.motion) return state.motion.action;
  if (state.spinning) return 'running';
  if (!state.mounted) return state.exercise === 'fault' ? 'faultHint' : 'preparing';
  if (!validDimensions(readings())) return 'invalid';
  if (state.dirty) return state.closed ? 'recheckClosed' : 'recheck';
  if (state.result) {
    if (!correctSetup(readings())) return 'mismatch';
    if (planes.every(plane => state.result[plane].grams <= tolerance)) return 'balanced';
    if (state.weights.some(weight => weight.prefit)) return state.closed ? 'faultMeasuredClosed' : 'faultMeasured';
    return state.closed ? 'measuredClosed' : 'measured';
  }
  return state.closed ? 'ready' : 'unclampedGuard';
}

function suggestedAction() {
  if (station() === 'changer') {
    const key = operations[changer.step]?.[0] || 'tyre-reset';
    return changerControls[key].disabled ? null : key;
  }
  if (station() === 'lift' || state.spinning || state.motion || !validDimensions(readings())) return null;
  if (!state.mounted) return 'mount';
  if (!state.result) return state.closed ? 'spin' : 'hood';
  const activePlanes = planes.filter(plane => correctionAngle(state.result[plane]) != null);
  if (!state.dirty && (!activePlanes.length || !correctSetup(readings()))) return null;
  const pendingRespin = state.measuredWeights.some(weight => !state.weights.includes(weight));
  const matches = (weight, plane) => weight.plane === plane && weight.angle === state.result[plane].angle
    && weight.grams === Math.max(1, Math.min(100, Math.round(state.result[plane].grams)));
  const added = state.weights.filter(weight => !state.measuredWeights.includes(weight));
  const pending = activePlanes.filter(plane => !added.some(weight => matches(weight, plane)));
  if (pendingRespin || !pending.length || added.some(weight => !activePlanes.some(plane => matches(weight, plane)))) {
    return state.closed ? 'spin' : 'hood';
  }
  if (state.closed) return state.dirty ? 'spin' : 'hood';
  if (state.weights.some(weight => weight.prefit)) return 'remove';
  const plane = pending.includes(planeSelect.value) ? planeSelect.value : pending[0];
  return !$('fit').disabled && matches({ plane: planeSelect.value, angle: angleInput.valueAsNumber, grams: weightsInput.valueAsNumber }, plane)
    ? 'fit' : plane;
}

function renderChanger() {
  const operation = operations[changer.step];
  for (const [key, button] of Object.entries(changerControls)) {
    button.disabled = !changer.ready || Boolean(changer.motion) || (key === 'tyre-reset'
      ? changer.step === 'empty' : key !== operation?.[0]);
  }
  changerControls['tyre-turn'].textContent = t(changer.step === 'upper' ? 'changerLower' : 'changerUpper');
  const prompts = { empty: 'changerEmpty', loaded: 'changerLoaded', loose: 'changerLoose',
    clamped: 'changerClamped', lubricated: 'changerLubricated', upper: 'changerUpperOff', removed: 'changerDone' };
  $('changer-status').textContent = t(changer.failed ? 'changerUnavailable' : !changer.ready ? 'changerLoading' : changer.motion?.label || prompts[changer.step]);
  const completed = changerStages.indexOf(changer.step);
  $('changer-count').textContent = Math.min(completed + 1, 6) + '/6';
  $('changer-step').textContent = t(changerLabels[changer.step]);
  $('changer-progress').value = completed;
  $('changer-reset').hidden = !changer.ready || !completed;
}

function setKeyboardControls(inScene) {
  $('machine-keyboard').hidden = !inScene;
  $('mount-state').hidden = !inScene;
  for (const { element, anchor } of keyboardAnchors) {
    if (inScene) $(element.id === 'lift-inputs' ? 'keyboard-lift' : 'keyboard-balancer').append(element);
    else anchor.after(element);
  }
}

function renderLift() {
  $('lift-readout').textContent = number(Math.round(state.liftHeight)) + ' ' + t('millimeters');
  $('lift-motion').textContent = t(liftMotionKey());
  const { stage, motion, carZ } = liftRun;
  const guided = stage !== 'free';
  const step = liftSteps[stage];
  $('lift-controls-heading').textContent = t(guided ? 'liftGuided' : 'lift');
  if (station() === 'lift') {
    const hint = !workshop ? 'fallback' : !guided ? 'liftHint' : step.direction > 0 ? 'liftPumpHint' : 'liftValveHint';
    $('viewport-hint').textContent = t(hint);
    $('viewport-hint').hidden = guided && !step.direction;
  }
  $('lift-up').disabled = !canJog(1);
  $('lift-down').disabled = !canJog(-1);
  $('lift-vehicle-row').hidden = !guidedLiftAvailable || guided;
  $('lift-sequence').hidden = !guided;
  liftVehicle.disabled = !guidedLiftAvailable || Boolean(liftDirection) || state.liftHeight !== 0 || vehicleStatus === 'liftVehicleLoading';
  $('fork-controls').hidden = !guidedLiftAvailable || guided;
  liftHeight.hidden = liftHeight.disabled = guided;
  const startNote = !guided && guidedLiftAvailable && state.liftHeight > 0 ? 'liftStartAtFloor' : '';
  $('lift-vehicle-status').hidden = !vehicleStatus && !startNote;
  $('lift-vehicle-status').textContent = t(vehicleStatus || startNote) || '';
  for (const key of Object.keys(forkInputs)) {
    forkInputs[key].disabled = guided;
    $(key + '-readout').textContent = number(forkInputs[key].valueAsNumber) + '%';
  }
  if (!guided) return;
  const done = stage === 'done';
  const [title, hint] = t('liftStages')[stage];
  $('lift-step-count').textContent = done ? '' : (liftStageNames.indexOf(stage) + 1) + '/' + (liftStageNames.length - 1);
  $('lift-step-title').textContent = title;
  const message = motion ? t('liftBusy') : hint;
  if ($('lift-step-hint').textContent !== message) $('lift-step-hint').textContent = message;
  $('lift-step-action').hidden = Boolean(step.direction);
  $('lift-step-action').disabled = Boolean(motion);
  $('lift-step-action').dataset.control = step.target || '';
  $('lift-step-action').classList.toggle('scene-action', Boolean(step.target) && Boolean(workshop));
  $('lift-step-action').textContent = done ? t('liftAgain') : title;
  $('lift-guide-options').hidden = carZ !== 0 || motion?.carZ != null;
  $('lift-free').hidden = stage !== 'preflight' && !done;
  $('lift-lock-status').hidden = !step.locks;
  $('lift-lock-status').textContent = step.locks ? t(step.locks === 'seated' ? 'liftLocksSeated' : 'liftLocksUnloaded') : '';
}

function canJog(direction) {
  if (liftRun.motion || vehicleStatus === 'liftVehicleLoading') return false;
  const limit = liftLimit(liftRun.stage, direction, liftMax);
  return limit !== null && (direction > 0 ? state.liftHeight < limit : state.liftHeight > limit);
}

function setLiftHeight(height) {
  state.liftHeight = Math.min(liftMax, Math.max(0, height));
  liftHeight.value = Math.round(state.liftHeight);
  renderLift();
  draw();
}

function advanceLift(direction, distance) {
  if (!canJog(direction)) return false;
  const previous = liftRun.stage;
  const { stage, height } = liftJog(previous, state.liftHeight, direction, distance, liftMax);
  liftRun.stage = stage;
  setLiftHeight(height);
  return stage === previous && canJog(direction);
}

function moveLift(direction) {
  cancelAnimationFrame(liftFrame);
  if (!direction || !canJog(direction)) {
    liftDirection = 0;
    renderLift();
    draw();
    return;
  }
  liftDirection = direction;
  activateStation('lift');
  if (!advanceLift(direction, 12)) { moveLift(0); return; }
  render();
  liftTime = performance.now();
  const advance = now => {
    const elapsed = Math.max(0, Math.min(now - liftTime, 50));
    liftTime = now;
    if (advanceLift(direction, elapsed * .65)) {
      liftFrame = requestAnimationFrame(advance);
    } else moveLift(0);
  };
  liftFrame = requestAnimationFrame(advance);
}

function render() {
  document.documentElement.lang = language;
  const title = t(state.view === 'balancer' ? 'title' : state.view);
  document.title = title + ' · ' + t('brand');
  $('view-title').textContent = title;
  $('view-intro').textContent = t(state.view === 'balancer' ? 'intro' : state.view + 'Intro');
  $('weights-help').textContent = t(workshop ? 'weightsKeys' : 'weightsHelp');
  for (const element of localizedText) element.textContent = t(element.dataset.t);
  for (const element of accessibleLabels) element.setAttribute('aria-label', t(element.dataset.label));
  for (const button of languageButtons) button.setAttribute('aria-pressed', button.dataset.language === language);
  const spec = exercises[state.exercise].rim;
  $('exercise-note').textContent = t(state.exercise === 'fault' ? 'faultNote' : 'guidedNote');
  $('work-order').textContent = t('order') + ' · ' + number(spec.diameter, 1) + ' × ' + number(spec.width, 1)
    + ' ' + t('inches') + ' · ' + number(spec.offset) + ' ' + t('millimeters');
  $('hood').textContent = t(state.closed ? 'openHood' : 'closeHood');
  $('mount').textContent = t(state.mounted ? 'mounted' : 'mount');
  $('mount-state').textContent = t(state.mounted ? 'mounted' : 'parked');
  const busy = state.spinning || Boolean(state.motion);
  $('mount').disabled = state.mounted || busy || !validDimensions(readings());
  $('hood').disabled = !state.mounted || busy;
  $('spin').disabled = !state.closed || !state.mounted || busy || !validDimensions(readings());
  $('reset').disabled = busy;
  scenario.disabled = busy;
  for (const input of Object.values(dimensionInputs)) input.disabled = busy;
  const canAdjust = state.mounted && !state.closed && !busy;
  angleInput.disabled = planeSelect.disabled = weightsInput.disabled = !canAdjust;
  $('fit').disabled = !canAdjust || !weightsInput.checkValidity() || !angleInput.checkValidity()
    || !Number.isFinite(weightsInput.valueAsNumber) || !Number.isFinite(angleInput.valueAsNumber);
  for (const button of indexButtons) {
    const result = state.result?.[button.dataset.index];
    button.disabled = !canAdjust || correctionAngle(result) == null;
  }
  for (const plane of planes) {
    const result = state.result?.[plane];
    $(plane + '-mass').textContent = result ? roundedMass(result.grams) : '—';
    const flag = verdict(result);
    $(plane + '-mass').closest('.plane').dataset.verdict = flag;
    $(plane + '-verdict').hidden = flag === 'pending';
    $(plane + '-verdict').textContent = flag === 'pending' ? '' : t(flag === 'ok' ? 'withinTolerance' : 'needsCorrection');
    $(plane + '-angle').textContent = correctionAngle(result) == null ? '—' : result.angle + '°';
  }
  const status = statusKey();
  $('status').textContent = t(status);
  $('status').classList.toggle('success', status === 'balanced');
  $('reading-note').hidden = !state.result || !state.dirty;
  $('reading-note').textContent = t('lastSpin');
  const isLift = station() === 'lift';
  const isChanger = station() === 'changer';
  for (const [name, button] of Object.entries(viewButtons)) button.setAttribute('aria-pressed', !diagnosticStation && state.view === name);
  viewButtons.changer.disabled = !workshop;
  $('lift-controls').hidden = !isLift;
  $('balance-controls').hidden = isLift || isChanger;
  $('balance-instrument').hidden = $('rpm').hidden = isLift || isChanger;
  $('lift-instrument').hidden = !isLift;
  $('changer-readout').hidden = $('changer-count').hidden = !isChanger;
  $('instrument-heading').textContent = t(isLift ? 'liftInstrument' : isChanger ? 'changerInstrument' : 'instrument');
  $('stand-hint').hidden = !workshop;
  $('scene-status').textContent = t(state.view);
  $('viewport-hint').textContent = t(!workshop ? 'fallback' : state.view === 'bay' ? 'bayHint' : isLift ? 'liftHint' : 'viewHint');
  $('rotate-view').textContent = t(workshop ? 'rotateView' : 'swapPlanes');
  $('rotate-view').hidden = isLift && !workshop;
  $('zoom-in').hidden = $('zoom-out').hidden = !workshop;
  renderLift();
  renderChanger();
  const next = suggestedAction();
  for (const [key, button] of Object.entries({ ...standControls, ...changerControls })) {
    button.classList.toggle('next-control', key === next);
  }
  const nextText = next === 'remove' ? t('removeFault') : next === 'inner' || next === 'outer' ? t('index') + ' · ' + t(next)
    : (standControls[next] || changerControls[next])?.textContent;
  $('next-action').hidden = !nextText;
  $('next-action').textContent = nextText ? t('nextStep') + ' · ' + nextText : '';
  $('viewport-hint').hidden = Boolean(nextText) || (isLift && liftRun.stage !== 'free' && !liftSteps[liftRun.stage].direction);

  const oldFocus = document.activeElement?.dataset.remove;
  const items = state.weights.length ? state.weights.map((weight, index) => {
    const row = document.createElement('li');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = t('remove');
    remove.dataset.remove = index;
    remove.disabled = !canAdjust;
    remove.classList.toggle('next-control', next === 'remove' && Boolean(weight.prefit));
    const prefit = weight.prefit ? ' · ' + t('prefitWeight') : '';
    row.append(t(weight.plane) + ' · ' + roundedMass(weight.grams) + ' · ' + weight.angle + '°' + prefit, remove);
    return row;
  }) : [Object.assign(document.createElement('li'), { textContent: t('none') })];
  $('weight-list').replaceChildren(...items);
  if (oldFocus != null && canAdjust) {
    ($('weight-list').querySelector('[data-remove="' + oldFocus + '"]') || $('fit')).focus();
  }
  renderSpeed();
  diagnosticControls.render(language);
}

function animate(action, duration, commit, detail) {
  if (workshop && !reducedMotion.matches) {
    state.motion = { action, start: performance.now(), duration, detail };
    render();
    setTimeout(() => {
      state.motion = undefined;
      commit();
      render();
    }, duration);
  } else {
    commit();
    render();
  }
}

function startSpin() {
  if ($('spin').disabled) return;
  activateStation('balancer');
  const rim = readings();
  state.spinning = true;
  state.result = null;
  state.elapsed = 0;
  state.turn = 0;
  render();
  const start = performance.now();
  const update = now => {
    const elapsed = Math.min(spinTime, (now - start) / 1000);
    const { rpm, turn, done } = spin(elapsed);
    Object.assign(state, { elapsed, rpm, turn });
    if (!done) {
      renderSpeed();
      requestAnimationFrame(update);
      return;
    }
    state.angle = degrees(state.angle - turn);
    state.turn = 0;
    state.spinning = false;
    state.result = measure(state.exercise, state.weights, rim);
    state.measuredWeights = [...state.weights];
    state.dirty = false;
    angleInput.value = Math.round(state.angle) % 360;
    render();
  };
  requestAnimationFrame(update);
}

scenario.addEventListener('change', reset);
$('reset').addEventListener('click', reset);
$('mount').addEventListener('click', () => {
  activateStation('balancer');
  animate('mounting', 1640, () => {
    state.mounted = true;
  });
});
$('hood').addEventListener('click', () => {
  activateStation('balancer');
  const closed = !state.closed;
  animate(closed ? 'closing' : 'opening', 720, () => {
    state.closed = closed;
  });
});
$('spin').addEventListener('click', startSpin);
for (const input of Object.values(dimensionInputs)) {
  input.addEventListener('input', () => {
    state.result = null;
    state.elapsed = 0;
    render();
  });
}
weightsInput.addEventListener('input', render);
planeSelect.addEventListener('change', render);
angleInput.addEventListener('input', () => {
  const value = angleInput.valueAsNumber;
  if (angleInput.checkValidity() && Number.isFinite(value)) state.angle = value;
  render();
});
for (const button of indexButtons) button.addEventListener('click', () => {
  activateStation('balancer');
  const plane = button.dataset.index;
  const result = state.result[plane];
  angleInput.value = result.angle;
  planeSelect.value = plane;
  weightsInput.value = Math.max(1, Math.min(100, Math.round(result.grams)));
  animate('indexing', 540, () => {
    state.angle = result.angle;
  }, result.angle);
});
$('fit').addEventListener('click', () => {
  if ($('fit').disabled) return;
  activateStation('balancer');
  const weight = { plane: planeSelect.value, grams: weightsInput.valueAsNumber, angle: angleInput.valueAsNumber };
  animate('fitting', 520, () => {
    state.weights.push(weight);
    state.dirty = true;
  }, weight);
});
$('weight-list').addEventListener('click', event => {
  const target = event.target.closest('[data-remove]:enabled');
  if (!target) return;
  state.weights.splice(Number(target.dataset.remove), 1);
  state.dirty = true;
  render();
});
for (const [id, button] of Object.entries(changerControls)) {
  button.addEventListener('click', () => {
    if (button.disabled) return;
    activateStation('changer');
    if (id === 'tyre-reset') {
      changer.step = 'empty';
      render();
      return;
    }
    const [action, next, duration, label] = operations[changer.step];
    if (reducedMotion.matches) {
      changer.step = next;
      render();
      return;
    }
    const motion = { action, start: performance.now(), duration, label };
    changer.motion = motion;
    render();
    setTimeout(() => {
      if (changer.motion !== motion) return;
      changer.step = next;
      changer.motion = null;
      render();
    }, duration);
  });
}
for (const button of languageButtons) button.addEventListener('click', () => {
  language = button.dataset.language;
  try {
    localStorage.setItem(storageKey, language);
    localStorage.removeItem('motion-lab-language-auto');
  } catch {}
  render();
});
function navigate(name, push = true) {
  const diagnostic = ['diagnostics','alignment','headlamp'].includes(name);
  if (liftDirection) moveLift(0);
  workshop?.resetView();
  diagnosticStation = diagnostic ? name : null;
  document.body.dataset.zone = diagnostic ? 'diagnostics' : 'service';
  diagnosticControls.select(diagnosticStation);
  $('diagnostic-bay-link').setAttribute('aria-current', name === 'diagnostics' ? 'location' : 'false');
  for (const button of document.querySelectorAll('.workshop-nav [data-station]')) {
    button.setAttribute('aria-pressed', button.dataset.station === diagnosticStation);
  }
  $('fallback').hidden = Boolean(workshop) || diagnostic;
  if (!diagnostic) {
    $('scene').hidden = !workshop;
    if (!workshop && !['lift','balancer'].includes(name)) name = 'balancer';
    state.view = name;
    if (name !== 'bay') state.station = name;
  }
  const url = diagnostic ? 'diagnostics.html' + (name === 'diagnostics' ? '' : '#' + name) : './' + (name === 'bay' ? '' : '#' + name);
  if (push && location.href !== new URL(url, location.href).href) history.pushState(null, '', url);
  render();
  if (name === 'lift') openLiftStation();
}
function locationView() {
  const hash = location.hash.slice(1);
  return ['diagnostics','alignment','headlamp','balancer','changer','lift'].includes(hash) ? hash
    : location.pathname.endsWith('/diagnostics.html') ? 'diagnostics' : 'bay';
}
for (const [name, button] of Object.entries(viewButtons)) button.addEventListener('click', () => navigate(name));
$('diagnostic-bay-link').addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate('diagnostics');
});
window.addEventListener('popstate', () => navigate(locationView(), false));
diagnosticControls.connect(navigate, draw, () => workshop?.resetView());
$('follow-actions').addEventListener('change', event => {
  if (event.target.checked) workshop?.resetView();
  draw();
});
$('diagnostic-reset-view').addEventListener('click', () => workshop?.resetView());
liftHeight.addEventListener('input', () => {
  if (liftRun.stage === 'free' && !liftHeight.disabled) setLiftHeight(liftHeight.valueAsNumber);
});
$('lift-up').addEventListener('click', () => advanceLift(1, 150));
$('lift-down').addEventListener('click', () => advanceLift(-1, 150));
for (const input of Object.values(forkInputs)) input.addEventListener('input', () => { renderLift(); draw(); });
function openLiftStation() {
  if (guidedLiftAvailable && liftRun.carZ === null && !vehicleStatus) prepareLiftExercise();
}

async function prepareLiftExercise() {
  if (!workshop || vehicleStatus === 'liftVehicleLoading') return;
  const startGuided = state.liftHeight === 0 && !liftDirection;
  moveLift(0);
  vehicleStatus = 'liftVehicleLoading';
  renderLift();
  try {
    const activeWorkshop = workshop;
    await activeWorkshop.loadVehicle();
    if (workshop !== activeWorkshop) return;
    vehicleStatus = '';
    liftRun = { stage: startGuided ? 'preflight' : 'free', arms: 'manual', carZ: -bayClearance };
  } catch (error) {
    console.warn('The lift vehicle could not be loaded.', error);
    vehicleStatus = 'liftVehicleUnavailable';
  }
  renderLift();
  draw();
}

liftVehicle.addEventListener('click', prepareLiftExercise);
$('lift-step-action').addEventListener('click', () => {
  const step = liftSteps[liftRun.stage];
  if (!step || step.direction || liftRun.motion) return;
  if (liftRun.stage === 'done') {
    liftRun = { stage: 'preflight', arms: 'parked', carZ: -bayClearance };
    renderLift();
    draw();
    return;
  }
  const commit = () => {
    liftRun = { stage: step.next, arms: step.arms ?? liftRun.arms,
      carZ: step.carZ ?? liftRun.carZ };
    renderLift();
    draw();
  };
  if (!step.duration || reducedMotion.matches) { commit(); return; }
  const motion = { start: performance.now(), duration: step.duration, arms: step.arms, carZ: step.carZ };
  liftRun.motion = motion;
  renderLift();
  draw();
  setTimeout(() => { if (liftRun.motion === motion) commit(); }, step.duration);
});
$('lift-free').addEventListener('click', () => {
  if (!['preflight', 'done'].includes(liftRun.stage)) return;
  if (liftRun.arms === 'parked') {
    forkInputs.spread.value = 100;
    forkInputs.reach.value = 0;
  }
  liftRun = { stage: 'free', arms: 'manual', carZ: liftRun.carZ };
  renderLift();
  draw();
});
liftGuides.addEventListener('change', draw);
window.addEventListener('blur', () => moveLift(0));
$('zoom-in').addEventListener('click', () => workshop?.zoom(.8));
$('zoom-out').addEventListener('click', () => workshop?.zoom(1.25));
$('rotate-view').addEventListener('click', () => {
  if (workshop) workshop.rotate();
  else { fallbackView++; drawFallback(); }
});

reset();
function useSchematic() {
  workshop = undefined;
  $('workshop-loading').hidden = true;
  moveLift(0);
  if (state.view === 'bay' || state.view === 'changer') state.view = 'balancer';
  changer.step = 'empty';
  changer.ready = false;
  changer.motion = null;
  $('scene').hidden = true;
  $('fallback').hidden = Boolean(diagnosticStation);
  $('fork-controls').hidden = true;
  guidedLiftAvailable = false;
  liftRun = { stage: 'free', arms: 'manual', carZ: null };
  vehicleStatus = '';
  setKeyboardControls(false);
  diagnosticControls.status('fallback');
  render();
}
try {
  const { makeWorkshop } = await import('./workshop.js');
  const canvas = $('scene');
  workshop = makeWorkshop(canvas, getSceneState, { ...standControls, ...changerControls, raise: $('lift-up'), lower: $('lift-down'),
    'lift-arms': $('lift-step-action'), 'lift-car': $('lift-step-action'), 'lift-lock': $('lift-step-action') }, moveLift, diagnosticControls);
  canvas.hidden = false;
  $('fallback').hidden = true;
  canvas.addEventListener('webglcontextlost', useSchematic);
  canvas.addEventListener('liftmodelready', () => {
    guidedLiftAvailable = Boolean(workshop);
    renderLift();
    if (state.view === 'lift') openLiftStation();
  });
  canvas.addEventListener('changermodelready', () => { changer.ready = Boolean(workshop); render(); });
  canvas.addEventListener('changermodelfailed', () => { changer.failed = true; render(); });
  setKeyboardControls(true);
  render();
} catch {
  useSchematic();
}
navigate(locationView(), false);
