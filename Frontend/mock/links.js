import { accounts } from './users.js';
export function createLinks(context) {
  const {
    students
  } = context;
  return [{
    parentId: accounts[3].id,
    studentId: students[0].id
  }, {
    parentId: accounts[3].id,
    studentId: students[1].id
  }];
}
