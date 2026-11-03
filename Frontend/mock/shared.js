export const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const period = (offset = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const names = [
  'Nguyễn Minh An',
  'Trần Gia Bảo',
  'Phạm Ngọc Linh',
  'Lê Hoàng Nam',
  'Võ Thảo Nguyên',
  'Đặng Khánh Duy',
  'Nguyễn Bảo Ngọc',
  'Trần Hải Đăng',
  'Phan Gia Hân',
  'Lê Quốc Huy',
  'Hoàng Minh Khang',
  'Đỗ Nhật Minh',
  'Nguyễn Phương Anh',
  'Trương Tuấn Kiệt',
  'Vũ Ngọc Mai',
  'Bùi Đức Anh',
  'Trần Thanh Trúc',
  'Lê Minh Quân',
  'Phạm Anh Thư',
  'Nguyễn Đức Huy',
  'Võ Khánh Linh',
  'Lý Quốc Bảo',
  'Đặng Gia Minh',
  'Ngô Thảo My',
];
