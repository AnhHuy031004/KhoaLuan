import React from "react";
import { Link } from "react-router-dom";
import { Users, Layers, Wallet, ArrowUpRight, CalendarDays } from "lucide-react";
import { useAuth } from "./auth";
import { api } from "./api";
import { useRemote } from "./hooks";
import { listData } from "./api/schema";
import { Loading, ErrorState, Empty } from "./components";
import { ROLE_LABEL } from "./labels";
export default function Dashboard() {
  const {
    user
  } = useAuth();
  const state = useRemote(async signal => {
    const requests = [["classes", "/classes", {
      limit: 5
    }], ["announcements", "/announcements", {
      limit: 4
    }]];
    if (["ADMIN", "INSTRUCTOR"].includes(user.role)) requests.push(["students", "/students", {
      limit: 1
    }]);
    if (user.role === "PARENT") requests.push(["students", "/parents/me/children"]);
    if (["ADMIN", "STUDENT", "PARENT"].includes(user.role)) requests.push(["invoices", "/invoices", {
      limit: 1,
      status: "UNPAID"
    }]);
    const values = await Promise.allSettled(requests.map(async ([key, path, query]) => [key, await api.request(path, {
      query,
      signal
    })]));
    const result = {
      errors: []
    };
    values.forEach((r, i) => {
      if (r.status === "fulfilled") result[r.value[0]] = r.value[1];else result.errors.push({
        name: requests[i][0],
        error: r.reason
      });
    });
    return result;
  }, [user.id, user.role, false]);
  const d = state.data || {};
  const classes = listData(d.classes),
    students = listData(d.students),
    invoices = listData(d.invoices),
    notices = listData(d.announcements);
  const stats = [{
    title: user.role === "PARENT" ? "Võ sinh đã liên kết" : "Võ sinh trong phạm vi",
    value: d.students ? students.total : "—",
    icon: Users,
    to: user.role === "PARENT" ? "children" : user.role === "STUDENT" ? "profile" : "students"
  }, {
    title: "Lớp học có thể xem",
    value: d.classes ? classes.total : "—",
    icon: Layers,
    to: "classes"
  }, ...(user.role !== "INSTRUCTOR" ? [{
    title: "Hóa đơn chưa thanh toán",
    value: d.invoices ? invoices.total : "—",
    icon: Wallet,
    to: "invoices"
  }] : [{
    title: "Lịch tập trong tuần",
    value: d.classes ? classes.items.reduce((n, c) => n + (c.schedules?.length || 0), 0) : "—",
    icon: CalendarDays,
    to: "schedules"
  }])];
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KHÔNG GIAN QUẢN LÝ</span>
          <h1>Tổng quan Vovinam</h1>
          <p>
            {ROLE_LABEL[user.role]} ·{" "}
            {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
          })}
          </p>
        </div>
        <Link className="secondary" to="/app/schedules">
          <CalendarDays size={16} />
          Xem lịch tập
        </Link>
      </div>
      <section className="welcome">
        <div>
          <span className="eyebrow">VOVINAM · VIỆT VÕ ĐẠO</span>
          <h2>
            Kỷ luật hôm nay.
            <br />
            Bản lĩnh ngày mai.
          </h2>
          <p>
            Chào {user.email.split("@")[0]}, cùng theo dõi hoạt động và hành
            trình tập luyện.
          </p>
        </div>
        <div className="welcome-emblem" aria-hidden="true">
          <img src="/assets/vovinam-logo.png" alt="" width="132" height="132" />
        </div>
      </section>
      {state.loading ? <Loading /> : state.error ? <ErrorState error={state.error} retry={state.reload} /> : <>
          {d.errors?.map(x => <ErrorState key={x.name} error={x.error} retry={state.reload} />)}
          <div className="stat-grid">
            {stats.map(({
          title,
          value,
          icon: Icon,
          to
        }) => <Link to={"/app/" + to} className="stat panel" key={title}>
                <div className="stat-label">
                  {title}
                  <Icon size={18} />
                </div>
                <strong>{value}</strong>
                <span>
                  Xem danh sách <ArrowUpRight size={13} />
                </span>
              </Link>)}
          </div>
          <div className="dashboard-columns">
            <section className="panel">
              <div className="panel-heading">
                <h2>Nhịp tập luyện của bạn</h2>
                <Link to="/app/classes">Xem lớp học</Link>
              </div>
              {classes.items.length ? classes.items.slice(0, 4).map(c => <Link to="/app/schedules" key={c.id} className="class-preview">
                    <span className="class-icon">
                      <Layers size={20} />
                    </span>
                    <div>
                      <strong>{c.name}</strong>
                      <p>
                        {c.location || "Chưa cập nhật địa điểm"} ·{" "}
                        {c.schedules?.length || 0} khung giờ mỗi tuần
                      </p>
                    </div>
                    <ArrowUpRight size={17} />
                  </Link>) : <Empty text="Chưa có lớp học để hiển thị." />}
              <div className="quiet-note">
                Lịch trên trang tổng quan là lịch tập định kỳ của lớp. Mở Điểm
                danh để ghi nhận từng buổi tập thực tế.
              </div>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>Thông báo mới</h2>
                <Link to="/app/announcements">Xem tất cả</Link>
              </div>
              {notices.items.length ? notices.items.map(n => <article className="announcement" key={n.id}>
                    <small>
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("vi-VN") : "Thông báo lớp võ"}
                    </small>
                    <h3>{n.title}</h3>
                    <p>{n.body}</p>
                  </article>) : <Empty text="Chưa có thông báo mới." />}
            </section>
          </div>
        </>}
    </>;
}
