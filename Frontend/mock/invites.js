export function createInvites(context) {
  const {
    students
  } = context;
  return {
    'VOVINAM-MOCK-001': students[0].id,
    'VOVINAM-MOCK-002': students[1].id
  };
}
