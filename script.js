function construct_option(text, callback) {
  return {text, callback};
}
function construct_decision(text, option_objects) {
  return {
    text,
    options: option_objects
  };
}

function object_spread(object1, object2) {
  // This replaces the {object1, ...object2} syntax which is in new JavaScript.
  // object2 overrides object1
  let result = {};
  for(let key in object1) {
    result[key] = object1[key];
  }
  for(let key in object2) {
    result[key] = object2[key];
  }
  return result;
}

function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}
function weightedRand(spec) {
  var i, j, table=[];
  for (i in spec) {
    // The constant 10 below should be computed based on the
    // weights in the spec for a correct and optimal table size.
    // E.g. the spec {0:0.999, 1:0.001} will break this impl.
    for (j=0; j<spec[i]*100; j++) {
      table.push(i);
    }
  }
  return table[Math.floor(Math.random() * table.length)];
}
function weightedRandOfObject(spec) {
  // spec: object of the form { text1: weight1, text2: weight2, ...}
  // returns the text
  let weights = [];
  let keys = [];
  for(const id in spec) {
    weights.push(spec[id]);
    keys.push(id);
  }
  return keys[weightedRand(weights)];
}

function getDisplaced(start, change) {
  // start must be between 0 and 1 inclusive
  // change may be negative
  // returns between 0 and 1 inclusive
  let result = start + change;
  if(result < 0) {
    result = 0
  } else if(result > 1) {
    result = 1;
  }
  return result;
}

function sigmoid(x) {
  return 1/(1 + Math.exp(-x));
}
function inverseSigmoid(x) {
  // x better be between 0 and 1 NOT inclusive
  return -Math.log((1 / x) - 1);
}
function adjustedSigmoid(x) {
  return sigmoid(4 * x);
}
function inverseAdjustedSigmoid(x) {
  // x better be between 0 and 1 NOT inclusive
  return inverseSigmoid(x) / 4;
}
function getAdjustedSigmoidDisplaced(original, displacement) {
  return adjustedSigmoid(inverseAdjustedSigmoid(original) + displacement);
}
function getLowerSideSigmoidDisplaced(original, displacement) {
  if(original > 0.5) {
    return getDisplaced(original, displacement);
  } else {
    return adjustedSigmoid(inverseAdjustedSigmoid(original) + displacement);
  }
}

const SIMPLE_HASH_MAX = 56789;
function simpleHash(s) {
  // returns a somewhat random integer in [0, SIMPLE_HASH_MAX)
  return s.split('').reduce((acc, c) => (34567 * acc + 4321 * c.charCodeAt(0)) % SIMPLE_HASH_MAX, 0);
}

const PROF_QUOTES = [
  "If getting a degree was easy, everyone would do it.", // assumptive language
  "Not everyone is good at everything."
];

const MONTHS = ['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July'];
const NUM_DAYS_IN_YEAR = 360; // it makes the math easier
const NUM_DAYS_IN_MONTH = NUM_DAYS_IN_YEAR / MONTHS.length; // === 30
const DAY_OF_AUGUST_WHEN_SCHOOL_BEGINS = 20;
const FALL_LAST_DAY = {month: 'December', day_in_month: 15};
const SPRING_LAST_DAY = {month: 'May', day_in_month: 15};
const SPRING_FIRST_DAY = {month: 'January', day_in_month: 16};
const FALL_FIRST_DAY = {month: 'August', day_in_month: DAY_OF_AUGUST_WHEN_SCHOOL_BEGINS - 1};
const INTEREST_RATE_PER_DAY = 0.01/100;
const NUM_HOURS_WORKED_WHEN_NOT_IN_SCHOOL = 40; // (hr/week) per day
const MIN_PASSING_GRADE = 0.7;
function getDateFromDay(day) {
  // day starts from August 1
  const month = MONTHS[Math.floor((day % NUM_DAYS_IN_YEAR) * 1.0 / NUM_DAYS_IN_MONTH)];
  const day_in_month = ((day % NUM_DAYS_IN_YEAR) % NUM_DAYS_IN_MONTH) + 1;
  const year = Math.floor(day / NUM_DAYS_IN_YEAR) + 1;
  return {month, day_in_month, year};
}
function getIfSchoolIsInSessionFromDay(day) {
  // returns true if school is in session, false otherwise
  // day starts from August 1
  const date = getDateFromDay(day);
  if(['September', 'October', 'November', 'February', 'March', 'April'].indexOf(date.month) !== -1) {
    return true;
  } else if(['June', 'July'].indexOf(date.month) !== -1) {
    return false;
  } else if(date.month === 'August') {
    return date.day_in_month >= DAY_OF_AUGUST_WHEN_SCHOOL_BEGINS;
  } else if(date.month === 'December') {
    return date.day_in_month < FALL_LAST_DAY.day_in_month;
  } else if(date.month === 'January') {
    return date.day_in_month > SPRING_FIRST_DAY.day_in_month;
  } else if(date.month === 'May') {
    return date.day_in_month < SPRING_LAST_DAY.day_in_month;
  }
}
function getIfCanDropClasses(date) {
  return ['August', 'September', 'October', 'January', 'February', 'March']
    .indexOf(date.month) !== -1
  || (date.month === 'November' && date.day_in_month < 20)
  || (date.month === 'April' && date.day_in_month < 20);
}
function getIfMonthDayPairsAreEquivalent(pair1, pair2) {
  return pair1.month === pair2.month && pair1.day_in_month === pair2.day_in_month;
}
function hasPassed(class_id, transcript) {
  return (
    state.transcript[class_id] !== undefined
    && state.transcript[class_id].passed === true
  );
}
function getWeightedScore(grade_array) {
  if(grade_array === undefined) {
    return undefined;
  }
  const accumulated_pair = grade_array.reduce(
    ({total_weight, weighted_score}, cur_pair) => {
      return {total_weight: total_weight + cur_pair.weight, weighted_score: weighted_score + (cur_pair.weight * cur_pair.score)};
    },
    {total_weight: 0, weighted_score: 0}
  );
  return accumulated_pair.weighted_score / accumulated_pair.total_weight;
}
const MAX_EXPONENT_FOR_SCORE_GENERATION = 0.8;
const DIFFICULTY_MOD = SIMPLE_HASH_MAX / 10;
function get_class_difficulty_number(class_id) {
  // returns in [0, 1) where 1 is the hardest
  return (simpleHash(class_id) % DIFFICULTY_MOD) / DIFFICULTY_MOD;
}
function getRandomGradePairFromClassIdAndCarefulness(class_id, carefulness) {
  return {
    weight: Math.pow(Math.random(), 2),
    score: Math.pow(
      Math.random(),
      (
        (get_class_difficulty_number(class_id) * MAX_EXPONENT_FOR_SCORE_GENERATION)
      ) / Math.exp(2 * carefulness)
    )
  };
}
function getIfClassGetsCurved(class_id) {
  return (
    get_class_difficulty_number(class_id) > 0.95
  );
}
const MINIMUM_WAGE = 0.000025; // money bars per (hr/week) per day
const GPA_EXPONENT = 4;
function getWagePerHour(transcript) {
  return MINIMUM_WAGE + (Math.pow(getGPA(transcript) || 0, GPA_EXPONENT) * Object.keys(transcript).length / 200000000);
}
const A = 'A';
const B = 'B';
const C = 'C';
const D = 'D';
const F = 'F';
function getLetterGradeFromScore(score) {
  if(score >= 0.9) {
    return A; // grudgingly
  } else if(score >= 0.8) {
    return B; // "you should be happy with a B in calculus" - Paul Runnion
  } else if(score >= 0.7) {
    return C; // they get degrees
  } else if(score >= 0.6) {
    return D; // "not everyone is good at everything" - Clayton Price
  } else {
    return F; // MUHAHAHAHA
  }
}
const LETTER_GRADE_POINT_VALUES = {
  'A': 4.0,
  'B': 3.0,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
};
function getGPA(transcript) {
  // NaN if transcript is empty
  let total_points = 0;
  let total_credit_hours = 0;
  for(const class_id in transcript) {
    total_points += transcript[class_id].num_credit_hours * LETTER_GRADE_POINT_VALUES[transcript[class_id].letter_grade];
    total_credit_hours += transcript[class_id].num_credit_hours;
  }
  return total_points * 1.0 / total_credit_hours;
}
const FALL = 'FALL';
const SPRING = 'SPRING';
function getFallSpringOrNullFromMonth(month) {
  if(['August', 'September', 'October', 'November', 'December'].indexOf(month) !== -1) {
    return FALL;
  } else if(['January', 'February', 'March', 'April', 'May'].indexOf(month) !== -1) {
    return SPRING;
  } else {
    return null;
  }
}
function getNumDaysSinceSemBeganOrNullFromDate({month, day_in_month}) {
  if(getFallSpringOrNullFromMonth(month) === SPRING) {
    return (
      day_in_month
      + ['January', 'February', 'March', 'April', 'May'].indexOf(month) * NUM_DAYS_IN_MONTH
      - SPRING_FIRST_DAY.day_in_month);
  } else if(getFallSpringOrNullFromMonth(month) === FALL) {
    return (
      day_in_month
      + (['August', 'September', 'October', 'November', 'December'].indexOf(month) * NUM_DAYS_IN_MONTH)
      - FALL_FIRST_DAY.day_in_month);
  } else {
    return null;
  }
}
function getNumDaysUntilSemEndsOrNullFromDate({month, day_in_month}) {
  if(getFallSpringOrNullFromMonth(month) === SPRING) {
    return (
      day_in_month
      + ['January', 'February', 'March', 'April', 'May'].indexOf(month) * NUM_DAYS_IN_MONTH
      - SPRING_FIRST_DAY.day_in_month);
  } else if(getFallSpringOrNullFromMonth(month) === FALL) {
    return (
      day_in_month
      + (['August', 'September', 'October', 'November', 'December'].indexOf(month) * NUM_DAYS_IN_MONTH)
      - FALL_FIRST_DAY.day_in_month);
  } else {
    return null;
  }
}
function getTakeableClasses(class_graph, schedule, transcript) {
  return Object.keys(class_graph)
    .filter(class_id => 
      schedule[class_id] === undefined
      && !hasPassed(class_id, transcript)
      && class_graph[class_id].prerequisites.every(prereq =>
        hasPassed(prereq, transcript)
        || schedule[prereq] === true
      )
    );
}


const O_WEEK_MATH_OPTIONS = [
  'PSW',
  'TW',
  'exempt'
];
const O_WEEK_MATH_OPTION_MEANINGS = {
  PSW: 'This stands for Problem Solving Workshop.',
  TW: 'This stands for Trigonometry Workshop.',
  exempt: 'This means you don\'t have to do math during O-Week!'
}
const MATH_PLACEMENT_OPTIONS = [
  'intermediate algebra',
  'college algebra',
  'trigonometry',
  'calculus'
];
const MATH_PLACEMENT_O_WEEK_TEST_STUDY_PROBABILITIES = [
  [0.10, 0.45, 0.45, 0.00],
  [0.00, 0.00, 0.20, 0.80],
  [0.00, 0.00, 0.00, 1.00],
];
const MATH_PLACEMENT_O_WEEK_TEST_SOCIALIZE_PROBABILITIES = [
  [0.50, 0.25, 0.25, 0.00],
  [0.00, 0.00, 0.50, 0.50],
  [0.00, 0.00, 0.00, 1.00],
];
const MATH_PLACEMENT_NO_O_WEEK_PROBABILITIES = [
  [0.5, 0.3, 0.0, 0.0],
  [0.2, 0.2, 0.3, 0.2],
  [0.0, 0.0, 0.0, 1.0],
];
const BAR_WIDTH = 200; // pixels

const INITIAL_STATE = {
  day: 0,
  mathPlacement: null, // will only be from O_WEEK_MATH_OPTIONS before the o-week results come out, then will be from MATH_PLACEMENT_OPTIONS
  mentalHealth: null,
  happiness: null,
  timeCrunchedness: null,
  money: null,
  class_graph: null,
  current_classes: null,
  class_difficulties: null,
  temp_next_sem_schedule: null,
  next_sem_schedule: null,
  transcript: null, // map from class to object
  may_not_inform_of_high_tc: null,
  num_in_school_job_hours: null,
  amount_borrowed: null,
  grades: null, // array of {weight: Number in [0, 1], score: Number in [0, 1]}
  isCheating: null,
  carefulness: null,
  schedulePickerState: null
};

const FALL_ENROLLMENT_DAY = {month: 'October', day_in_month: 20};
const SPRING_ENROLLMENT_DAY = {month: 'March', day_in_month: 20};

function get_random_class_graph(num_credit_hours) {
  let num_credit_hours_in_graph = 0;
  let graph = {};
  while(num_credit_hours_in_graph < num_credit_hours) {
    const num_credit_hours_in_class = [1, 3, 4][weightedRand([0.1, 0.7, 0.2])];
    const dept = weightedRandOfObject({'CS': 0.4, 'Math': 0.3, 'Engl': 0.1, 'Physics': 0.075, 'Philos': 0.025, 'History': 0.025, 'Stat': 0.025, 'CpE': 0.05});
    const number = Math.floor(Math.random() * 4000) + 1000;
    const id = dept + String(number);
    
    let prerequisite_array = [];
    for(let class_id in graph) {
      if(graph[class_id].number < number) {
        if(Math.random() < (graph[class_id].dept === dept ? 0.05 : 0.005)) {
          prerequisite_array.push(class_id);
        }
      }
    }

    graph[id] = {id, dept, number, num_credit_hours: num_credit_hours_in_class, prerequisites: prerequisite_array};

    num_credit_hours_in_graph += num_credit_hours_in_class;
  }
  return graph;
}
function add_math_placement_to_class_graph(class_graph, mathPlacement) {
  const placement_class_number = [1120,1140,1160,null][MATH_PLACEMENT_OPTIONS.indexOf(mathPlacement)];
  if(placement_class_number !== null) {
    const id = 'Math' + placement_class_number;
    class_graph[id] = {dept:'Math', num_credit_hours: 5, id, number: placement_class_number, prerequisites: []};
    for(let class_id in class_graph) {
      if(class_id !== id && class_graph[class_id].dept === 'Math' && class_graph[class_id].prerequisites.length === 0) {
        class_graph[class_id].prerequisites.push(id);
      }
    }
  }
}

function get_num_credit_hours_from_schedule(schedule, class_graph) {
  if(class_graph === undefined) { throw 'zxcv'; }
  return Object.keys(schedule).reduce((acc, curr_class_id) => acc + class_graph[curr_class_id].num_credit_hours, 0);
}
function get_freshman_schedule(class_graph) {
  let schedule = {};
  const math_deficiency_class_number = [1120,1140,1160].find(n => class_graph["Math" + n] !== undefined);
  if(math_deficiency_class_number !== undefined) {
    schedule["Math" + String(math_deficiency_class_number)] = true;
  }
  while(get_num_credit_hours_from_schedule(schedule, class_graph) < 14) {
    const class_id = choose(Object.keys(class_graph));
    if(class_graph[class_id].prerequisites.length === 0 || Math.random() < 0.0001) {
      schedule[class_id] = true;
    }
  }
  return schedule;
}

function get_semesters_from_class_graph(class_graph) {
  let reversed_prereqs = {};
  for(const class_id in class_graph) {
    reversed_prereqs[class_id] = [];
  }
  for(const class_id in class_graph) {
    for(const prereq of class_graph[class_id].prerequisites) {
      reversed_prereqs[prereq].push(class_id);
    }
  }
  let order = Object.keys(class_graph);
  // the sort function doesn't work
  for(let i1 in order) {
    for(let i2 in order) {
      if(i2 > i1 && reversed_prereqs[order[i1]].length < reversed_prereqs[order[i2]].length) {
        const temp = order[i1];
        order[i1] = order[i2];
        order[i2] = temp;
      }
    }
  }
  let num_semesters = 8; // can increase if prereq chain is too long
  let semester_index = 0;
  let num_credit_hours_in_current_sem = 0;
  let sem_of_class = {};
  let keep_going = true;
  while(keep_going) {
    const selected_class = order.find(class_id => {
      if(
        class_id in sem_of_class // class is already in a sem
        || class_graph[class_id].prerequisites.some(prereq =>
          !(prereq in sem_of_class) // prereq is not in a sem yet
            || sem_of_class[prereq] === semester_index // prereq is in the current sem
        )
      ) {
        return false;
      } else {
        return true;
      }
    });
    if(selected_class === undefined) {
      num_semesters++;
      semester_index++;
      num_credit_hours_in_current_sem = 0;
      if(num_semesters > 1000) {
        throw 'asdf';
      }
    } else {
      sem_of_class[selected_class] = semester_index;
      num_credit_hours_in_current_sem += class_graph[selected_class].num_credit_hours;
      if(num_credit_hours_in_current_sem >= 15 && semester_index + 1 < num_semesters) {
        semester_index++;
        num_credit_hours_in_current_sem = 0;
      }
    }
    if(Object.keys(sem_of_class).length === order.length) {
      keep_going = false;
    }
  }

  let semesters = {};
  for(let class_id in sem_of_class) {
    if(semesters[sem_of_class[class_id]] === undefined) {
      semesters[sem_of_class[class_id]] = [];
    }
    semesters[sem_of_class[class_id]].push(class_id);
  }
  return semesters;
}

function draw_class_graph_schedule_difficulty_transcript_grades_temp_next_sem_schedule_and_next_sem_schedule_and_add_listener(
  canvas_selector,
  class_graph,
  schedule,
  class_difficulties,
  transcript,
  grades,
  temp_next_sem_schedule,
  next_sem_schedule,
  click_callback // (class_id) => {Select or deselect class}
) {
  const semesters = get_semesters_from_class_graph(class_graph);
  const SEMESTER_D = 40; // pixels
  const CLASS_D = 100; // pixels
  const OFFSET_FOR_TEXT = 15; // pixels
  const SCHEDULE_HEIGHT = 40;
  canvas_selector[0].height = 
    (SEMESTER_D * Object.keys(semesters).length)
    + SCHEDULE_HEIGHT;
  canvas_selector[0].width =
    CLASS_D *
    Object.keys(semesters)
      .map(k => semesters[k].length)
      .reduce(
        (cur_max, next_val) => next_val > cur_max ? next_val : cur_max,
        Object.keys(schedule).length
      );

  let class_path_by_class_id = {};
  for(const sem_key in semesters) {
    semesters[sem_key].forEach((class_id, index) => {
      class_path_by_class_id[class_id] = [sem_key, index];
    });
  }

  let ctx = canvas_selector[0].getContext('2d');
  ctx.fillStyle = 'rgb(240, 240, 240)';
  ctx.fillRect(0, 0, canvas_selector[0].width, canvas_selector[0].height);

  let y = 0;
  for(const sem_key in semesters) {
    const sem = semesters[sem_key];
    sem.forEach((class_id, index) => {
      ctx.font = "16px Arial";
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillText(class_id, CLASS_D * index, y + OFFSET_FOR_TEXT);
      ctx.font = "12px Arial";
      ctx.fillText(String(class_graph[class_id].num_credit_hours) + " Credit Hours", CLASS_D * index, y + (2 * OFFSET_FOR_TEXT));

      for(const prereq of class_graph[class_id].prerequisites) {
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(CLASS_D * (index + 0.5), y + (0.5 * OFFSET_FOR_TEXT));
        ctx.lineTo(CLASS_D * (class_path_by_class_id[prereq][1] + 0.5), (SEMESTER_D * class_path_by_class_id[prereq][0]) + (0.5 * OFFSET_FOR_TEXT));
        ctx.stroke();
        function drawDot(center_x, center_y) {
          ctx.beginPath();
          ctx.arc(center_x, center_y, 4, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.fill();
        }
        drawDot(CLASS_D * (index + 0.5), y + (0.5 * OFFSET_FOR_TEXT));
        drawDot(CLASS_D * (class_path_by_class_id[prereq][1] + 0.5), (SEMESTER_D * class_path_by_class_id[prereq][0]) + (0.5 * OFFSET_FOR_TEXT));
      }

      if(class_id in schedule) {
        ctx.font = "30px Arial";
        ctx.fillStyle = ctx.strokeStyle = 'rgb(200, 100, 50)';
        ctx.fillText(" IP", CLASS_D * index, y + (2 * OFFSET_FOR_TEXT));
        ctx.lineWidth = 2;
        ctx.strokeRect(CLASS_D * index, y, CLASS_D * 0.8, 0.8 * SEMESTER_D);
        ctx.lineWidth = 1;
      }
      if(class_id in transcript) {
        ctx.font = "25px Arial";
        ctx.fillStyle = {
          A: 'rgb(24, 217, 76)',
          B: 'rgb(189, 182, 0)',
          C: 'rgb(237, 113, 24)',
          D: 'rgb(255, 38, 0)',
          F: 'rgb(255, 0, 170)'
        }[transcript[class_id].letter_grade];
        ctx.fillText(transcript[class_id].letter_grade, CLASS_D * index, y + 25);
      }

      let nss = next_sem_schedule;
      if(temp_next_sem_schedule !== null) {
        nss = temp_next_sem_schedule;
      }
      if(nss !== null && nss[class_id] !== undefined && !(class_id in schedule)) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(CLASS_D * index, y, CLASS_D * 0.8, 0.8 * SEMESTER_D);
        ctx.lineWidth = 1;
      }
    });
    y += SEMESTER_D;
  }

  ctx.fillStyle = 'rgb(220, 220, 220)';
  ctx.fillRect(0, y, canvas_selector[0].width, SCHEDULE_HEIGHT);
  
  Object.keys(schedule).forEach((class_id, index) => {
    ctx.font = "16px Arial";
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillText(class_id, CLASS_D * index, y + OFFSET_FOR_TEXT);
    if(class_difficulties !== null && class_difficulties[class_id] !== undefined) {
      ctx.font = "12px Arial";
      ctx.fillText("Difficulty: " + class_difficulties[class_id].toFixed(2), CLASS_D * index, y + 9 + OFFSET_FOR_TEXT);
    }
    if(grades[class_id] !== undefined) {
      ctx.fillText("Grade: " + getWeightedScore(grades[class_id]).toFixed(2), CLASS_D * index, y + 18 + OFFSET_FOR_TEXT);
    }
  });
  canvas_selector.off();
  canvas_selector[0].addEventListener('click', function(event) {
    const event_x = event.clientX - this.offsetLeft;
    const event_y = event.clientY - this.offsetLeft;
    const sem_index = Math.floor(event_y * 1.0 / SEMESTER_D);
    const class_in_sem_index = Math.floor(event_x * 1.0 / CLASS_D);
    const sem = semesters[sem_index];
    if(sem !== undefined) {
      const class_id = sem[class_in_sem_index];
      if(class_id !== undefined) {
        click_callback(class_id);
      }
    }
  });
}

function getBar(ratio, text, green_on_left=true) {
  let outerDiv = $('<div class="bar" style="background-color: ' + (green_on_left ? 'red' : 'green') + ';"></div>');
  outerDiv.width(BAR_WIDTH);
  let innerDiv = $('<div class="bar" style="background-color: ' + (green_on_left ? 'green' : 'red') + ';"></div>');
  innerDiv.width(BAR_WIDTH * ratio);
  let textDiv = $('<div class="bar"></div>');
  textDiv.width(BAR_WIDTH);
  textDiv.text(text);
  return $('<div></div>').append(outerDiv.append(innerDiv.append(textDiv)));
}

let state;

function increaseHappiness(amount) {
  // amount >= 0
  if(amount < 1 - state.happiness) {
    state.happiness += amount;
  } else {
    state.happiness = 1;
  }
}
function reduceHappiness(amount) {
  // amount >= 0
  if(amount < state.happiness) {
    state.happiness -= amount;
  } else {
    state.happiness = 0;
  }
}

function die() {
  state.mentalHealth = 0;
  state.happiness = 0;
  state.timeCrunchedness = 1;
  state.money = 0;
}


const MIN_CREDIT_HOURS = 12;
const MAX_CREDIT_HOURS = 19;
function showSchedulePicker(optional_passed_message, num_starting_credit_hours) {
  state.schedulePickerState = {optional_passed_message, num_starting_credit_hours};
  const date = getDateFromDay(state.day);
  const num_selected_credit_hours = Object.keys(state.temp_next_sem_schedule).reduce((acc, k) => state.class_graph[k].num_credit_hours + acc, 0);
  const actual_num_starting_credit_hours = num_starting_credit_hours || 0;
  const classes_available_to_take = getTakeableClasses(state.class_graph, state.schedule, state.transcript);
  const classes_available_to_select =
    classes_available_to_take.filter(class_id =>
      state.temp_next_sem_schedule[class_id] !== true
    );
  const num_takeable_ch = classes_available_to_take.reduce((acc, class_id) => acc + state.class_graph[class_id].num_credit_hours, 0);
  const can_take_enough_credit_hours = num_takeable_ch >= MIN_CREDIT_HOURS;
  const ENROLL_TEXT = "Enroll in Selected Classes";
  let message = "It\'s time to pick out classes for next semester.\n"
    + "Click the buttons below OR click on the graph above to build to your schedule for next semester.\n"
    + "The selected classes will be marked in the class graph above.\n"
    + "Try to pick out classes that are prerequisites for other classes (indicated by lines between classes).\n"
    + "When a valid number of credit hours is selected, a button will appear that says " + ENROLL_TEXT + '\n'
    + String(num_selected_credit_hours)
    + " credit hours selected (minimum is " + MIN_CREDIT_HOURS + ", maximum is " + MAX_CREDIT_HOURS + ")";
  if(!can_take_enough_credit_hours && num_takeable_ch !== 0) {
    message = "It\'s time to pick out classes for next semester.\n"
    + "The minimum number of credit hours to be a full time student is "
    + String(MIN_CREDIT_HOURS)
    + ", but only "
    + num_takeable_ch
    + " credit hours are available to take.  "
    + "This means you will not have the privileges of a full-time student.\n"
    + String(num_selected_credit_hours)
    + " credit hours selected";
  } else if(num_takeable_ch === 0) {
    showDecision(construct_decision(
      "It\'s time to pick out classes for next semester, but you don't have to!",
      [construct_option("Continue", advance_day)]));
    state.schedulePickerState = null;
    return;
  }
  if(optional_passed_message !== undefined) {
    message = optional_passed_message + '\n';
    message += String(num_selected_credit_hours) + " credit hours selected";
  }
  showDecision(construct_decision(
    message,
    []
    .concat(
      (
        !can_take_enough_credit_hours
        && num_selected_credit_hours === num_takeable_ch
      ) || (
        num_selected_credit_hours >= MIN_CREDIT_HOURS
        && num_selected_credit_hours <= MAX_CREDIT_HOURS
      )
      ? [construct_option(ENROLL_TEXT, () => {
        state.schedulePickerState = null;
        const num_credit_hours_before = get_num_credit_hours_from_schedule(state.next_sem_schedule, state.class_graph);
        const num_credit_hours_after = get_num_credit_hours_from_schedule(state.temp_next_sem_schedule, state.class_graph);
        state.next_sem_schedule = object_spread({}, state.temp_next_sem_schedule);
        const money_after = state.money + (-0.025) * (num_credit_hours_after - num_credit_hours_before);
        if(money_after < 0) {
          showDecision(construct_decision(
            "You do not have enough money!",
            [
              construct_option("Take out a loan.  It is $300 per credit hour.  It will accrue interest at " + String(INTEREST_RATE_PER_DAY * 100) + "% per day.", () => {
                state.amount_borrowed += 300 * (num_credit_hours_after - num_credit_hours_before);
                advance_day();
              })
            ]));
        } else if(state.money < 0.25) {
          state.money = money_after;
          showDecision(construct_decision(
            "You don't have much money left.  "
            + (state.num_in_school_job_hours === 0
              ? "Do you get a job that will occur during school?"
              : "You are working " + state.num_in_school_job_hours + "hr/week.  Do you change the number of hours you are working?"),
            [0,3,6,12].map(num_hours => construct_option(
              "Work " + String(num_hours) + "hr/week.", () => {
                state.num_in_school_job_hours = num_hours;
                advance_day();
              }
            ))
          ));
        } else {
          state.money = money_after;
          advance_day();
        }
      })]
      : []
    ).concat(
      Object.keys(state.temp_next_sem_schedule)
        .map(class_id => construct_option("Remove " + class_id + " " + String(state.class_graph[class_id].num_credit_hours) + "CH", () => {
          delete state.temp_next_sem_schedule[class_id];
          showSchedulePicker(optional_passed_message, actual_num_starting_credit_hours);
        }))
    ).concat(
      classes_available_to_select.map(class_id => construct_option(
        class_id + " " + String(state.class_graph[class_id].num_credit_hours) + "CH"
        , () => {
          state.temp_next_sem_schedule[class_id] = true;
          showSchedulePicker(optional_passed_message, actual_num_starting_credit_hours);
        }
      ))
    )
  ));
}

function showDecision(decision_object) {
  let div = $('<div></div>');
  if([state.class_graph, state.schedule, state.class_difficulties, state.transcript].every(x => x !== null)) {
    const class_graph_canvas_selector = $('<canvas></canvas>');
    function onClick(class_id) {
      if(state.schedulePickerState !== null) {
        const takeable_classes = getTakeableClasses(state.class_graph, state.schedule, state.transcript);
        if(takeable_classes.indexOf(class_id) !== -1) {
          if(class_id in state.temp_next_sem_schedule) {
            delete state.temp_next_sem_schedule[class_id];
          } else {
            state.temp_next_sem_schedule[class_id] = true;
          }
          showSchedulePicker(
            (state.schedulePickerState || {}).optional_passed_message,
            (state.schedulePickerState || {}).num_starting_credit_hours
          );
        } else {
          alert("You are not allowed to enroll in " + class_id + ".  In order to enroll in a class, you can't be taking it right now, you must not have passed it already, and each prerequisite must either be passed or in progress.");
        }
      }
    }
    draw_class_graph_schedule_difficulty_transcript_grades_temp_next_sem_schedule_and_next_sem_schedule_and_add_listener(
      class_graph_canvas_selector,
      state.class_graph,
      state.schedule,
      state.class_difficulties,
      state.transcript,
      state.grades,
      state.temp_next_sem_schedule,
      state.next_sem_schedule,
      onClick
    );
    div.append(class_graph_canvas_selector);
    div.append($('<br>'));
  }
  div.append($('<span style="float: top; white-space: pre-line"></span>').text(decision_object.text));
  decision_object.options.forEach((option_object, index) => {
    div.append($('<div style="float: top;"></div>').append($('<button></button>')
      .text(option_object.text)
      .click(() => {
        make_decision(decision_object, index)
      })));
  });
  if(state.day !== 0) {
    const date = getDateFromDay(state.day);
    div.append($('<span>' + date.month + ' ' + date.day_in_month + ' Year ' + date.year + '</span><br>'));
  }
  if(state.schedule !== null && state.schedule !== undefined && Object.keys(state.schedule).length > 0) {
    div.append(
      "Currently taking "
      + Object.keys(state.schedule).reduce((acc, key) => acc + state.class_graph[key].num_credit_hours, 0)
      + " credit hours<br>"
    );
  }
  if(state.amount_borrowed !== null) {
    div.append("Debt: $" + String(Math.floor(state.amount_borrowed * 100) / 100));
    div.append($('<br>'));
  }
  if(state.num_in_school_job_hours !== null) {
    div.append("When in school, working " + String(state.num_in_school_job_hours) + " hr/week.");
    div.append($('<br>'));
    div.append("When not in school, working " + NUM_HOURS_WORKED_WHEN_NOT_IN_SCHOOL + " hr/week.");
  }
  const GPA = getGPA(state.transcript);
  if(!isNaN(GPA)) {
    div.append($('<br>'));
    div.append("GPA: " + GPA.toFixed(2) + "/4.0");
  }
  if(state.mentalHealth !== null) {
    div.append(getBar(state.mentalHealth, "Mental Health"));
  }
  if(state.happiness !== null) {
    div.append(getBar(state.happiness, "Happiness"));
  }
  if(state.timeCrunchedness !== null) {
    div.append(getBar(state.timeCrunchedness, "Time Crunchedness", false));
  }
  if(state.money !== null) {
    div.append(getBar(state.money, "Money"));
  }
  $('#content').empty();
  $('#content').append(div);
}

function make_decision(decision_object, selected_option_index) {
  const option_object = decision_object.options[selected_option_index];
  option_object.callback();
}

function advance_day() {
  state.day++;

  let something_happened = false;

  if(getIfSchoolIsInSessionFromDay(state.day)) {
    if(Math.random() > 0.9998) {
      something_happened = true;
      die();
      showDecision(construct_decision('You fell into a booby trap laid by a professor.  '
        + 'When the professor found you, ' + choose(['he', 'she']) + ' '
        + 'had you tortured then killed.  '
        + 'Your family and friends were told that you committed suicide.'
      , [construct_option('Restart Game', () => {
        start_new_game();
      })]));
    } else if(Math.random() > 1 - (getNumDaysSinceSemBeganOrNullFromDate(getDateFromDay(state.day)) / 10000)) {
      for(const class_id in state.schedule) {
        if(Math.random() < 1.0 / (5 + (simpleHash(class_id) % 100))) {
          something_happened = true;
          if(state.grades[class_id] === undefined) {
            state.grades[class_id] = [];
          }
          state.grades[class_id].push({weight: 123456789, score: 0}); // I tried Infinity and it made the grade NaN
          showDecision(construct_decision('You were accused of cheating in ' + class_id + '.\n'
            + 'Your grade was changed to 0.'
          , [construct_option('Continue', () => {
            advance_day();
          })]));
        }
      }
    }
  }

  if(state.class_difficulties === null) {
    state.class_difficulties = {};
  }
  state.timeCrunchedness = 0;
  for(let class_id of Object.keys(state.schedule)) {
    if(!(class_id in state.class_difficulties)) {
      state.class_difficulties[class_id] = Math.random() * 0.1;
    } else {
      state.class_difficulties[class_id] += 0.005 * (Math.random() - 0.4) * state.class_graph[class_id].num_credit_hours;
      state.timeCrunchedness += state.class_difficulties[class_id] * (0.5 + state.carefulness);
    }
  }
  if(getIfSchoolIsInSessionFromDay(state.day)) {
    state.timeCrunchedness += state.num_in_school_job_hours / 70;
    state.money = getDisplaced(state.money, state.num_in_school_job_hours * getWagePerHour(state.transcript));
  } else {
    state.money = getDisplaced(state.money, NUM_HOURS_WORKED_WHEN_NOT_IN_SCHOOL * getWagePerHour(state.transcript));
  }

  for(const class_id in state.schedule) {
    if((simpleHash(class_id) % 100) / 100 < Math.pow(Math.random(), 6)) {
      state.grades[class_id] = state.grades[class_id] || [];
      state.grades[class_id].push(getRandomGradePairFromClassIdAndCarefulness(class_id, state.carefulness));
    }
  }

  state.happiness = getLowerSideSigmoidDisplaced(state.happiness, 16 * Math.pow((1 - state.timeCrunchedness) - 0.5, 11));
  state.mentalHealth = getAdjustedSigmoidDisplaced(state.mentalHealth, 0.0005);
  state.mentalHealth = getLowerSideSigmoidDisplaced(state.mentalHealth, -Math.pow(state.happiness * 100, -2));

  state.amount_borrowed = state.amount_borrowed * (1 + INTEREST_RATE_PER_DAY);

  const date = getDateFromDay(state.day);

  
  if(getIfMonthDayPairsAreEquivalent(date, FALL_ENROLLMENT_DAY) || getIfMonthDayPairsAreEquivalent(date, SPRING_ENROLLMENT_DAY)) {
    state.temp_next_sem_schedule = {};
    state.next_sem_schedule = {};
    showSchedulePicker();
    something_happened = true;
  } else if(
    getIfMonthDayPairsAreEquivalent(date, object_spread(FALL_LAST_DAY, {day_in_month:FALL_LAST_DAY.day_in_month - 1}))
    || getIfMonthDayPairsAreEquivalent(date, object_spread(SPRING_LAST_DAY, {day_in_month:SPRING_LAST_DAY.day_in_month - 1}))
  ) {
    let curved_classes = [];
    for(const class_id in state.schedule) {
      if(getIfClassGetsCurved(class_id)) {
        curved_classes.push(class_id);
        state.grades[class_id] = state.grades[class_id] || [];
        state.grades[class_id].push({
          weight: (0.5 + Math.random()) * state.grades[class_id].reduce((acc, cur_pair) => acc + cur_pair.weight, 0.01/*can't be 0, or the score may be NaN*/),
          score: 1
        });
      }
    }
    if(curved_classes.length !== 0) {
      showDecision(construct_decision(
        'A last-minute curve was applied in the following class(es): '
        + curved_classes.join(', '),
        [construct_option('Continue', advance_day)]
      ));
      something_happened = true;
    }
  } else if(getIfMonthDayPairsAreEquivalent(date, FALL_LAST_DAY) || getIfMonthDayPairsAreEquivalent(date, SPRING_LAST_DAY)) {
    let passed_all_classes = true;
    for(const class_id in state.schedule) {
      if(state.grades[class_id] === undefined || state.grades[class_id].length === 0) {
        state.grades[class_id] = [getRandomGradePairFromClassIdAndCarefulness(class_id, state.carefulness)];
      }
      const class_weighted_score = getWeightedScore(state.grades[class_id]);
      const passed = class_weighted_score >= MIN_PASSING_GRADE;
      state.transcript[class_id] = {
        passed,
        letter_grade: getLetterGradeFromScore(class_weighted_score),
        num_credit_hours: state.class_graph[class_id].num_credit_hours,
      };
      passed_all_classes = passed_all_classes && passed;
    }
    state.schedule = {};
    if(Object.keys(state.class_graph).every(class_id => hasPassed(class_id, state.transcript))) {
      showDecision(construct_decision(
        'Congratulations!\n'
        + 'You graduated with\n'
        + "a debt of $" + String(Math.floor(state.amount_borrowed * 100) / 100) + '\n'
        + 'and a GPA of ' + getGPA(state.transcript).toFixed(2) + ',\n'
        + ' taking ' + (getDateFromDay(state.day).year - (getDateFromDay(state.day).month === 'December' ? 0.5 : 0)) + ' years.\n'
        + 'At the beginning of the game, a quantity called "carefulness" was randomly assigned to the player.\n'
        + 'It does not change during the game.\n'
        + 'Carefulness is between 0 and 1.\n'
        + 'If you have a carefulness closer to 0 it means you can handle more credit hours, but get lower grades.\n'
        + 'If you have a carefulness closer to 1 it means you can handle less credit hours, but get higher grades.\n'
        + 'Your carefulness was ' + state.carefulness.toFixed(3) + '\n'
      , []));
    } else if(passed_all_classes) {
      showDecision(construct_decision(
        'You finished classes for the semester!\n'
        + 'You go to work.  Your economic value (and hence your wage) is determined by your academic achievements.\n'
        + 'Your wage is calculated by (minimum wage) + (constant) * (GPA to the power of ' + GPA_EXPONENT + ') * (the number of classes you have completed).',
        [construct_option("Continue", advance_day)]
      ));
    } else {
      showSchedulePicker('You finished classes for the semester!\n'
        + 'Unfortunately, you didn\'t pass all of them.\n'
        + 'Now you may change your schedule to accommodate the failed class(es).');
    }
    something_happened = true;
  } else if(getIfMonthDayPairsAreEquivalent(date, SPRING_FIRST_DAY) || getIfMonthDayPairsAreEquivalent(date, FALL_FIRST_DAY)) {
    state.schedule = state.next_sem_schedule;
    state.may_not_inform_of_high_tc = false;
    state.next_sem_schedule = {};
    for(const class_id in state.schedule) {
      if(class_id in state.grades) {
        delete state.grades[class_id];
      }
      state.class_difficulties[class_id] = 0;
    }
    showDecision(construct_decision('Classes are starting.', [construct_option("Continue", advance_day)]));
    something_happened = true;
  } else if(Math.random() < Math.pow(state.mentalHealth * 100, -4)) {
    die();
    showDecision(construct_decision(
      'You committed suicide.', [construct_option('Restart Game', () => {
        start_new_game();
      })]
    ));
    something_happened = true;
  } else if(state.timeCrunchedness >= 1 && state.may_not_inform_of_high_tc === false) {
    state.may_not_inform_of_high_tc = true;
    showDecision(construct_decision(
      'You have no more time to dedicate to school!\n'
      + (getIfCanDropClasses(date)
        ? 'The amount of time taken by each class is the difficulty number shown in the bottom row of the diagram above.\n'
        : 'But it\'s too late to drop a class!\n')
      + 'The deadline to drop is November 20 in the fall or April 20 in the spring.\n',
      [
        construct_option('Keep Going.  This risks mental health.', advance_day),
      ].concat(
        Object.keys(state.schedule).filter(class_id =>
          !(state.isCheating[class_id] === true)
          && (simpleHash(class_id) % 100) <= 10 // before changing these numbers, see where the player can be accused of cheating
        ).map(class_id =>
          construct_option(
            'You have a way to cheat and thus reduce the difficulty in ' + class_id + '.\n'
            + 'Click here to exploit it.',
            () => {
              state.class_difficulties[class_id] = 0.5 * state.class_difficulties[class_id];
              state.isCheating[class_id] = true;
              state.may_not_inform_of_high_tc = false;
              advance_day();
            }
          )
        )
      ).concat(
        getIfCanDropClasses(date)
        ? Object.keys(state.schedule).map(class_id =>
          construct_option("Drop " + class_id + " then continue", () => {
            delete state.schedule[class_id];
            state.may_not_inform_of_high_tc = false;
            advance_day();
          }))
        : []
      ).concat(
        [0,3,6,12]
          .filter(n => n < state.num_in_school_job_hours)
          .map(num_hours => construct_option(
            "Work " + String(num_hours) + "hr/week.", () => {
              state.num_in_school_job_hours = num_hours;
              state.may_not_inform_of_high_tc = false;
              advance_day();
            }
          ))
      )
    ));
    something_happened = true;
  }

  if(!something_happened) {
    showDecision(construct_decision('', []));

    setTimeout(advance_day, 100 + (200 * Math.pow(state.timeCrunchedness, 2)));
  }
}

function start_new_game() {
  state = object_spread({}, INITIAL_STATE);
  showDecision(construct_decision('Are you up for the adventure?', [
    construct_option('Yes', () => {
      state.day = 12;
      state.mentalHealth = Math.sqrt(Math.sqrt(Math.random()));
      state.happiness = Math.sqrt(Math.random());
      state.timeCrunchedness = 0;
      state.money = Math.random();
      state.transcript = {};
      state.may_not_inform_of_high_tc = false;
      state.num_in_school_job_hours = 0;
      state.amount_borrowed = 0;
      state.grades = {};
      state.isCheating = {}; // map from class_id to true (undefined => not cheating)
      state.carefulness = Math.random();
      state.schedulePickerState = null;

      state.mathPlacement = choose(O_WEEK_MATH_OPTIONS);
      showDecision(construct_decision(
        "You did robotics in high school, and you saw Missouri S&T's design teams, "
        + "so you decided to go to school at Missouri S&T.  "
        + "You went to PRO (Preview, Registration and Orientation) day and placed in "
        + state.mathPlacement + '.  ' + O_WEEK_MATH_OPTION_MEANINGS[state.mathPlacement]
        + '\n  The values of the meters below were determined from your life before college.\n'
        + 'There are also other numbers assigned to you which you must discover through experience.\n'
        + 'These randomly generated numbers vary from game to game.\n',
      [
        construct_option('Continue', () => {
          state.class_graph = get_random_class_graph(weightedRandOfObject({128: 0.9, 132: 0.1}));
          const did_make_it_to_o_week = [true, false][weightedRand([0.75, 0.25])];
          if(did_make_it_to_o_week) {
            const what_you_actually_did = choose(["study", "socialize"]);
            const asdf = (what_you_chose_to_do) => {
              let next = '';
              if(what_you_chose_to_do === what_you_actually_did) {
                next += "During opening week, you were able to " + what_you_chose_to_do + '.  ';
              } else {
                next += "You wanted to " + what_you_chose_to_do
                  + ' but you found yourself ' + {'study':'studying', 'socialize':'socializing'}[what_you_actually_did]
                  + ' instead.  ';
              }
              if(what_you_actually_did === "study") {
                state.happiness = getAdjustedSigmoidDisplaced(state.happiness, -0.1);
              } else if(what_you_actually_did === "socialize") {
                state.happiness = getAdjustedSigmoidDisplaced(state.happiness, 0.1);
              }
              if(state.mathPlacement !== 'exempt') {
                if(what_you_actually_did === "study") {
                  state.mathPlacement = MATH_PLACEMENT_OPTIONS[weightedRand(MATH_PLACEMENT_O_WEEK_TEST_STUDY_PROBABILITIES[O_WEEK_MATH_OPTIONS.indexOf(state.mathPlacement)])];
                } else if(what_you_actually_did === "socialize") {
                  state.mathPlacement = MATH_PLACEMENT_OPTIONS[weightedRand(MATH_PLACEMENT_O_WEEK_TEST_SOCIALIZE_PROBABILITIES[O_WEEK_MATH_OPTIONS.indexOf(state.mathPlacement)])];
                }
                next += "You re-took the math placement test during O-Week and placed in " + state.mathPlacement + ".";
              } else {
                state.mathPlacement = MATH_PLACEMENT_OPTIONS[3];
              }
              add_math_placement_to_class_graph(state.class_graph, state.mathPlacement);
              state.schedule = get_freshman_schedule(state.class_graph);
              showDecision(construct_decision(
                next,
                [construct_option('Continue to classes', () => {
                  state.day = DAY_OF_AUGUST_WHEN_SCHOOL_BEGINS;
                  advance_day();
                })]
              ));
            };
            showDecision(construct_decision(
              "You go to opening week.  "
              + "Will you study or socialize?"
            , [
              construct_option('study', () => {
                asdf('study');
              }),
              construct_option('socialize', () => {
                asdf('socialize');
              }),
            ]));
          } else {
            state.mathPlacement = MATH_PLACEMENT_OPTIONS[weightedRand(MATH_PLACEMENT_NO_O_WEEK_PROBABILITIES[O_WEEK_MATH_OPTIONS.indexOf(state.mathPlacement)])];
            add_math_placement_to_class_graph(state.class_graph, state.mathPlacement);
            state.schedule = get_freshman_schedule(state.class_graph);
            showDecision(construct_decision(
            'You were not able to attend opening week.  You ended up placing in ' + state.mathPlacement + '.',
            [construct_option('Continue to classes', () => {
              state.day = 20;
              advance_day();
            })]
          ));
          }
        }),
      ]
      ));
    }),
    construct_option('No', () => {
      showDecision(construct_decision("Wise choice.  You can leave now.", []));
    })
  ]));
}

function onLoad() {
  start_new_game();
}
