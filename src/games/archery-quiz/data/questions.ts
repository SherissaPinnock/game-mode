import type { Question } from '../types'

/** Full pool of tech-trivia questions. A random subset is picked each game. */
export const questions: Question[] = [
  {
    id: 1,
    question: 'What does CSS stand for?',
    options: ['Cascading Style Sheets', 'Computer Style Syntax', 'Creative Styling System', 'Coded Sheet Styling'],
    correctIndex: 0,
  },
  {
    id: 2,
    question: 'Which data structure operates on a LIFO (Last In, First Out) principle?',
    options: ['Queue', 'Linked List', 'Stack', 'Tree'],
    correctIndex: 2,
  },
  {
    id: 3,
    question: 'What does API stand for?',
    options: ['Advanced Programming Interface', 'Application Programming Interface', 'Automated Process Integration', 'App Protocol Interface'],
    correctIndex: 1,
  },
  {
    id: 4,
    question: 'Which HTTP status code means "Not Found"?',
    options: ['200', '301', '500', '404'],
    correctIndex: 3,
  },
  {
    id: 5,
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
    correctIndex: 2,
  },
  {
    id: 6,
    question: 'Which of these is NOT a JavaScript framework or library?',
    options: ['React', 'Angular', 'Django', 'Vue'],
    correctIndex: 2,
  },
  {
    id: 7,
    question: 'What does SQL stand for?',
    options: ['Structured Query Language', 'System Query Logic', 'Scalable Query Language', 'Structured Queue Logic'],
    correctIndex: 0,
  },
  {
    id: 8,
    question: 'What is the default port for HTTPS?',
    options: ['80', '8080', '443', '3000'],
    correctIndex: 2,
  },
  {
    id: 9,
    question: 'Which sorting algorithm has the best average-case time complexity?',
    options: ['Bubble Sort', 'Merge Sort', 'Insertion Sort', 'Selection Sort'],
    correctIndex: 1,
  },
  {
    id: 10,
    question: 'What does DOM stand for in web development?',
    options: ['Document Object Model', 'Data Output Method', 'Digital Object Management', 'Domain Object Model'],
    correctIndex: 0,
  },
  {
    id: 11,
    question: 'Which keyword declares a block-scoped variable in JavaScript?',
    options: ['var', 'let', 'def', 'dim'],
    correctIndex: 1,
  },
  {
    id: 12,
    question: 'What does "git stash" do?',
    options: ['Deletes uncommitted changes', 'Temporarily shelves uncommitted changes', 'Creates a new branch', 'Merges two branches'],
    correctIndex: 1,
  },
]
