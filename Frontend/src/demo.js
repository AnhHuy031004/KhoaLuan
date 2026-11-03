const studentId = "10000000-0000-4000-8000-000000000001",
  classId = "20000000-0000-4000-8000-000000000001";
export const demoUser = {
  id: "demo",
  email: "thuha@example.test",
  role: "ADMIN",
  emailVerified: true,
  mfaEnabled: false,
};
const students = [
  "Nguyễn Minh An",
  "Trần Gia Bảo",
  "Phạm Ngọc Linh",
  "Nguyễn Thanh Mai",
].map((fullName, i) => ({
  id: i ? studentId.slice(0, -1) + (i + 1) : studentId,
  fullName,
  dob: "2008-05-14",
  gender: i === 2 ? "FEMALE" : "MALE",
  currentBeltRankId: (i % 2) + 1,
  status: i === 3 ? "PAUSED" : "ACTIVE",
  phone: "0901234567",
  address: "TP. Hồ Chí Minh",
  joinedAt: "2026-01-05",
  hasLinkedAccount: true,
}));
export const demoData = {
  students,
  classes: [
    {
      id: classId,
      name: "Cơ bản A1",
      instructorId: "demo",
      location: "Sân A",
      capacity: 30,
      status: "ACTIVE",
      activeEnrollmentCount: 28,
      schedules: [
        {
          id: "slot-1",
          weekday: 1,
          startTime: "18:00",
          endTime: "19:30",
          effectiveFrom: "2026-01-01",
        },
        {
          id: "slot-2",
          weekday: 3,
          startTime: "18:00",
          endTime: "19:30",
          effectiveFrom: "2026-01-01",
        },
      ],
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      name: "Nâng cao B1",
      location: "Sân B",
      capacity: 24,
      status: "ACTIVE",
      activeEnrollmentCount: 20,
      schedules: [],
    },
  ],
  ranks: [
    {
      id: 1,
      code: "LAM",
      name: "Lam đai",
      rankGroup: "LAM",
      orderIndex: 1,
      isActive: true,
    },
    {
      id: 2,
      code: "LAM_1",
      name: "Lam đai nhất cấp",
      rankGroup: "LAM",
      orderIndex: 2,
      isActive: true,
    },
  ],
  invoices: [
    {
      id: "invoice-demo-1",
      invoiceNo: "HD1026-001",
      studentId,
      type: "TUITION",
      periodMonth: 10,
      periodYear: 2026,
      total: 450000,
      subtotal: 450000,
      discount: 0,
      status: "PAID",
      dueDate: "2026-10-25",
      items: [
        {
          description: "Học phí tháng 10",
          quantity: 1,
          unitAmount: 450000,
          amount: 450000,
        },
      ],
    },
    {
      id: "invoice-demo-2",
      invoiceNo: "HD1026-002",
      studentId,
      type: "TUITION",
      periodMonth: 10,
      total: 450000,
      status: "UNPAID",
      dueDate: "2026-10-25",
    },
  ],
  announcements: [
    {
      id: "notice-demo",
      title: "Kỳ thi thăng đai tháng 10",
      body: "Võ sinh kiểm tra điều kiện đăng ký thi và chuẩn bị đầy đủ võ phục.",
      audience: "ALL",
      publishedAt: "2026-10-18",
    },
  ],
  leaves: [
    {
      id: "leave-demo",
      studentName: "Phạm Ngọc Linh",
      className: "Cơ bản A1",
      sessionDate: "2026-10-21",
      reason: "Bận việc gia đình",
      status: "PENDING",
    },
  ],
  promotions: [
    {
      id: "promotion-demo",
      studentName: "Nguyễn Minh An",
      proposedRank: { name: "Lam đai nhị cấp" },
      note: "Đã hoàn thành chương trình",
      status: "PENDING",
    },
  ],
  exams: [
    {
      id: "exam-demo",
      title: "Thi thăng đai tháng 10",
      examDate: "2026-10-25",
      targetRank: { name: "Lam đai nhị cấp" },
      feeAmount: 200000,
      status: "OPEN",
      registeredCount: 18,
    },
  ],
  evaluations: [
    {
      id: "evaluation-demo",
      studentId,
      studentName: "Nguyễn Minh An",
      periodMonth: 10,
      periodYear: 2026,
      rating: 8,
      comment: "Tiến bộ tốt, cần rèn thêm tấn pháp.",
    },
  ],
  users: [
    demoUser,
    {
      id: "demo-coach",
      email: "hlv@example.test",
      role: "INSTRUCTOR",
      isActive: true,
      emailVerified: true,
    },
  ],
  notifications: [
    {
      id: "notif-demo",
      templateCode: "CLASS_ANNOUNCEMENT",
      payload: { title: "Lịch thi thăng đai" },
      channel: "IN_APP",
      createdAt: "2026-10-19",
      readAt: null,
    },
  ],
  children: students.slice(0, 2),
  enrollments: [
    {
      id: "enrollment-demo",
      student: students[0],
      classId,
      className: "Cơ bản A1",
      enrolledAt: "2026-09-01",
      leftAt: null,
    },
  ],
  payments: [
    {
      id: "payment-demo",
      invoiceId: "invoice-demo-1",
      orderRef: "PAY1026-001",
      gateway: "BANK_TRANSFER",
      amount: 450000,
      status: "SUCCESS",
      paidAt: "2026-10-18",
    },
  ],
  consent: [
    {
      id: "consent-demo",
      purpose: "DATA_PROCESSING",
      active: true,
      consentedAt: "2026-09-01",
    },
  ],
  sessions: [
    {
      id: "demo-session",
      deviceName: "Máy tính cá nhân",
      ip: "127.0.0.1",
      userAgent: "Demo",
      lastActiveAt: "2026-10-19",
    },
  ],
  audit: [],
  discounts: [],
  "exam-results": [],
  "attendance-history": [
    {
      id: "record-demo",
      sessionDate: "2026-10-19",
      status: "PRESENT",
      note: "Đúng giờ",
    },
  ],
};
export function getDemoList(id, query = {}) {
  let items = [...(demoData[id] || [])];
  if (query.search)
    items = items.filter((x) =>
      JSON.stringify(x).toLowerCase().includes(query.search.toLowerCase()),
    );
  if (query.status) items = items.filter((x) => x.status === query.status);
  if (query.role) items = items.filter((x) => x.role === query.role);
  const total = items.length,
    limit = Number(query.limit || 20),
    page = Number(query.page || 1);
  return {
    items: items.slice((page - 1) * limit, page * limit),
    total,
    page,
    limit,
  };
}
