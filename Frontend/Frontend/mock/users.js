export const MOCK_PASSWORD = 'Vovinam123!';
export const additionalAccounts = [
  {id:'u-master-ward-2',fullName:'Võ sư Nguyễn Thành Sơn',email:'vosuphuong2@vovinam.test',role:'MASTER',masterLevel:'WARD',provinceId:'province-1',wardId:'ward-2',clubId:'',status:'ACTIVE'},
  {id:'u-master-club-2',fullName:'Võ sư Trần Quốc Hùng',email:'vosuclb2@vovinam.test',role:'MASTER',masterLevel:'CLUB',provinceId:'province-1',wardId:'ward-1',clubId:'club-2',status:'ACTIVE'},
  {id:'u-master-club-3',fullName:'Võ sư Phan Minh Hải',email:'vosuclb3@vovinam.test',role:'MASTER',masterLevel:'CLUB',provinceId:'province-1',wardId:'ward-2',clubId:'club-3',status:'ACTIVE'},
  {id:'u-master-club-4',fullName:'Võ sư Đỗ Thanh Bình',email:'vosuclb4@vovinam.test',role:'MASTER',masterLevel:'CLUB',provinceId:'province-1',wardId:'ward-2',clubId:'club-4',status:'ACTIVE'},
  {id:'u-coach-2',fullName:'Lê Thùy Dương',email:'duong@example.test',role:'INSTRUCTOR',provinceId:'province-1',status:'ACTIVE'},
  {id:'u-coach-3',fullName:'Nguyễn Anh Tuấn',email:'tuan@example.test',role:'INSTRUCTOR',provinceId:'province-1',status:'ACTIVE'},
  {id:'u-student-3',fullName:'Phạm Ngọc Linh',email:'vosinh3@example.test',role:'STUDENT',provinceId:'province-1',studentId:'s-3',status:'ACTIVE'},
  {id:'u-student-4',fullName:'Lê Hoàng Nam',email:'vosinh4@example.test',role:'STUDENT',provinceId:'province-1',studentId:'s-4',status:'ACTIVE'},
];
export const accounts = [
  {
    id: 'u-admin',
    fullName: 'Nguyễn Quản Trị',
    email: 'admin@vovinam.test',
    role: 'ADMIN',
    provinceId: 'province-1',
    status: 'ACTIVE',
  },
  {
    id: 'u-master',
    fullName: 'Võ sư Nguyễn Quốc Việt',
    email: 'vosu@vovinam.test',
    role: 'MASTER',
    masterLevel: 'PROVINCE',
    provinceId: 'province-1',
    status: 'ACTIVE',
  },
  {id:'u-master-ward',fullName:'Võ sư Phạm Thành Long',email:'vosuphuong@vovinam.test',role:'MASTER',masterLevel:'WARD',provinceId:'province-1',wardId:'ward-1',clubId:'',status:'ACTIVE'},
  {id:'u-master-club',fullName:'Võ sư Lê Minh Đức',email:'vosuclb@vovinam.test',role:'MASTER',masterLevel:'CLUB',provinceId:'province-1',wardId:'ward-1',clubId:'club-1',status:'ACTIVE'},
  {
    id: 'u-coach',
    fullName: 'Trần Minh Huấn',
    email: 'hlv@vovinam.test',
    role: 'INSTRUCTOR',
    status: 'ACTIVE',
  },
  {
    id: 'u-student',
    fullName: 'Nguyễn Minh An',
    email: 'vosinh@vovinam.test',
    role: 'STUDENT',
    studentId: 's-1',
    status: 'ACTIVE',
  },
  ...additionalAccounts,
];
export const createUsers = () =>
  accounts.map((a) => ({ ...a, password: MOCK_PASSWORD }));
