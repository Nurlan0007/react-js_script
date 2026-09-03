function renderTask(title,resultHTML) {
    const app = document.getElementById('app');
    const card = document.createElement('section');
    card.className = 'task-card';
    card.innerHTML = `
      <h2>${title}</h2>
      <div class="result">${resultHTML}</div>
    `;
    app.appendChild(card);
}

const studentName = "Aleksei";
const age = 25;
const isActive = true;
const courses = ["Math", "Science", "History"];
const address = {city:"Almaty", street:"Abay", number: 123};
let nullExample = null;
let undefinedExample;

const sentence = `Студент ${studentName}, возраст: ${age}, активен: ${isActive}. Проживает в г. ${address.city}.`;

renderTask(
  "1. Variables and Data Types",
  `studentName: ${studentName} (${typeof studentName})\n` +
  `age: ${age} (${typeof age})\n` +
  `isActive: ${isActive} (${typeof isActive})\n` +
  `courses: ${JSON.stringify(courses)} (${typeof courses})\n` +
  `address: ${JSON.stringify(address)} (${typeof address})\n` +
  `nullExample: ${nullExample} (${typeof nullExample})\n` +
  `undefinedExample: ${undefinedExample} (${typeof undefinedExample})\n\n` +
  `Sentence: "${sentence}"`
);

// 2. Arrays
const numbers = [3, 7, 2, 10, 5];
const multiplied = numbers.map(num => num * 2);
const greaterThanFive = numbers.filter(num => num > 5);
const firstGreaterThanFive = numbers.find(num => num > 5);
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
const hasTen = numbers.includes(10);

renderTask(
  "2. Arrays",
  `Original: [${numbers.join(', ')}]\n` +
  `Multiplied by 2: [${multiplied.join(', ')}]\n` +
  `Greater than 5: [${greaterThanFive.join(', ')}]\n` +
  `First > 5: ${firstGreaterThanFive}\n` +
  `Sum: ${sum}\n` +
  `Includes 10: ${hasTen}`
);

// 3. Arrays of Objects
const students = [
  { id: 1, name: "Anna", grade: 85 },
  { id: 2, name: "John", grade: 62 },
  { id: 3, name: "Sara", grade: 91 },
  { id: 4, name: "Mike", grade: 55 }
];

const highGrades = students.filter(s => s.grade >= 70);
const studentNames = students.map(s => s.name);
const studentId3 = students.find(s => s.id === 3);
const topStudent = students.reduce((max, s) => s.grade > max.grade ? s : max, students[0]);
const avgGrade = students.reduce((acc, s) => acc + s.grade, 0) / students.length;
const studentsWithPassed = students.map(s => ({ ...s, passed: s.grade >= 60 }));

renderTask(
  "3. Arrays of Objects",
  `Grades >= 70: ${JSON.stringify(highGrades)}\n` +
  `Names: ${JSON.stringify(studentNames)}\n` +
  `ID = 3: ${JSON.stringify(studentId3)}\n` +
  `Top Student: ${JSON.stringify(topStudent)}\n` +
  `Average Grade: ${avgGrade}\n` +
  `With Passed status: ${JSON.stringify(studentsWithPassed, null, 2)}`
);

// 4. Objects
const user = {
  id: 101,
  name: "Дмитрий",
  age: 25,
  address: { city: "Алматы", street: "Достык" }
};

const userNameRead = user.name;
const userCityRead = user.address.city;

const updatedUser = { ...user, age: 26, email: "dmitry@example.com" };
delete updatedUser.address.street;

const { name: userName, age: userAge } = user;
const { address: { city: nestedCity } } = user;

renderTask(
  "4. Objects",
  `Read: Name = ${userNameRead}, City = ${userCityRead}\n` +
  `Destructured: userName = ${userName}, userAge = ${userAge}\n` +
  `Nested Destructured: nestedCity = ${nestedCity}\n` +
  `Updated User: ${JSON.stringify(updatedUser, null, 2)}`
);

// 5. Values and References
let original = { name: "Alice", score: 10 };
let copy = original;
copy.score = 20;

let originalSpread = { name: "Alice", score: 10 };
let copySpread = { ...originalSpread };
copySpread.score = 20;

let nestedUser = { name: "Alice", address: { city: "Almaty" } };
let deepCopy = { ...nestedUser, address: { ...nestedUser.address } };
deepCopy.address.city = "Astana";

renderTask(
  "5. Values and References",
  `Direct Copy modification affects original: original.score = ${original.score}\n` +
  `Spread Copy modification: originalSpread.score = ${originalSpread.score}, copySpread.score = ${copySpread.score}\n` +
  `Deep Copy modification: nestedUser.address.city = ${nestedUser.address.city}, deepCopy.address.city = ${deepCopy.address.city}`
);

// 6. Functions
function isEven(num) {
  return num % 2 === 0;
}
const getFullName = (firstName, lastName) => `${firstName} ${lastName}`;
const calculatePrice = (price, quantity) => price * quantity;
const calculateDiscount = (price, percent) => price - (price * (percent / 100));
const getMax = (a, b) => (a > b ? a : b);

renderTask(
  "6. Functions",
  `isEven(4): ${isEven(4)}\n` +
  `getFullName('Иван', 'Иванов'): ${getFullName('Иван', 'Иванов')}\n` +
  `calculatePrice(100, 3): ${calculatePrice(100, 3)}\n` +
  `calculateDiscount(1000, 15): ${calculateDiscount(1000, 15)}\n` +
  `getMax(10, 25): ${getMax(10, 25)}`
);

// 7. Functions as Values
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;
const calculate = (a, b, operation) => operation(a, b);

renderTask(
  "7. Functions as Values",
  `calculate(5, 3, add): ${calculate(5, 3, add)}\n` +
  `calculate(5, 3, multiply): ${calculate(5, 3, multiply)}`
);

// 8. Scope
const globalMessage = "global";
let scopeLogs = [];

function testScope() {
  const functionMessage = "function";
  if (true) {
    const blockMessage = "block";
    var varVariable = "var in block";
    scopeLogs.push(`Block level: ${globalMessage}, ${functionMessage}, ${blockMessage}`);
  }
  scopeLogs.push(`Function level: ${varVariable}`);
}
testScope();

renderTask(
  "8. Scope",
  scopeLogs.join('\n')
);

// 9. Closure
function createCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

const counter1 = createCounter();
const counter2 = createCounter();

function createAdder(value) {
  return function(number) {
    return value + number;
  };
}
const addFive = createAdder(5);

renderTask(
  "9. Closure",
  `counter1(): ${counter1()}\n` +
  `counter1(): ${counter1()}\n` +
  `counter2(): ${counter2()}\n` +
  `addFive(10): ${addFive(10)}\n` +
  `addFive(20): ${addFive(20)}`
);

// 10. Destructuring, Spread and Rest
const origNumbers = [10, 20, 30, 40];
const [firstNum, secondNum] = origNumbers;

const origUser = { id: 1, name: "Anna", age: 21 };
const { name: destName, age: destAge } = origUser;

const newNumbers = [...origNumbers, 50];
const newUser = { ...origUser, age: 22, email: "anna@example.com" };
const combinedArray = [...origNumbers, ...newNumbers];

function sumAll(...args) {
  return args.reduce((acc, curr) => acc + curr, 0);
}

renderTask(
  "10. Destructuring, Spread and Rest",
  `Array Destructuring: first = ${firstNum}, second = ${secondNum}\n` +
  `Object Destructuring: name = ${destName}, age = ${destAge}\n` +
  `New Numbers: [${newNumbers.join(', ')}]\n` +
  `New User: ${JSON.stringify(newUser)}\n` +
  `sumAll(1, 2) = ${sumAll(1, 2)}\n` +
  `sumAll(1, 2, 3, 4) = ${sumAll(1, 2, 3, 4)}`
);

// 11. Optional Chaining and Default Values
const userWithAddr = { name: "Олег", address: { city: "Алматы" } };
const userWithoutAddr = { name: "Игорь" };

const city1 = userWithAddr?.address?.city ?? "City not specified";
const city2 = userWithoutAddr?.address?.city ?? "City not specified";

const falsyValues = [0, "", false, null, undefined];
const comparisonResults = falsyValues.map(val => 
  `Value: ${JSON.stringify(val)} | ||: ${val || "default"} | ??: ${val ?? "default"}`
).join('\n');

renderTask(
  "11. Optional Chaining and Default Values",
  `City user 1: ${city1}\n` +
  `City user 2: ${city2}\n\n` +
  `Comparison || vs ??:\n${comparisonResults}`
);

// Final Task
const finalStudents = [
  { id: 1, name: "Алихан", age: 20, grades: [80, 90, 85] },
  { id: 2, name: "Дана", age: 21, grades: [60, 65, 70] },
  { id: 3, name: "Мадияр", age: 19, grades: [95, 98, 100] },
  { id: 4, name: "София", age: 22, grades: [50, 55, 40] },
  { id: 5, name: "Ернур", age: 20, grades: [75, 80, 70] }
];

const getAverage = (grades) => grades.reduce((acc, g) => acc + g, 0) / grades.length;
const getStudentAverage = (student) => getAverage(student.grades);
const getPassedStudents = (studentsList) => studentsList.filter(s => getStudentAverage(s) >= 60);
const getStudentNames = (studentsList) => studentsList.map(s => s.name);
const findStudent = (studentsList, id) => studentsList.find(s => s.id === id);

const getTopStudent = (studentsList) => {
  return studentsList.reduce((top, current) => {
    return getStudentAverage(current) > getStudentAverage(top) ? current : top;
  }, studentsList[0]);
};

const processedStudents = finalStudents.map(student => {
  const avg = Number(getStudentAverage(student).toFixed(2));
  return {
    id: student.id,
    name: student.name,
    average: avg,
    passed: avg >= 60
  };
});

renderTask(
  "Final Task",
  `Processed Array:\n${JSON.stringify(processedStudents, null, 2)}\n\n` +
  `Top Student: ${getTopStudent(finalStudents).name}\n` +
  `Passed Students: ${getStudentNames(getPassedStudents(finalStudents)).join(', ')}`
);