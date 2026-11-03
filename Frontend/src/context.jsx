import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import { listData } from "./api/schema";
const Context = createContext(null);
export function LookupProvider({
  children
}) {
  const {
    user
  } = useAuth();
  const [data, setData] = useState({}),
    [errors, setErrors] = useState([]),
    [studentId, setStudentId] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setData({});
    setErrors([]);
    setStudentId("");
    if (!user) return;
    const role = user.role;
    const loads = [["classes", "/classes", {
      limit: 100
    }], ["ranks", "/belt-ranks"]];
    if (["ADMIN", "INSTRUCTOR"].includes(role)) loads.push(["students", "/students", {
      limit: 100
    }]);
    if (role === "ADMIN") loads.push(["users", "/users", {
      limit: 100,
      role: "INSTRUCTOR"
    }]);
    if (role === "STUDENT") loads.push(["students", "/students/me"]);
    if (role === "PARENT") loads.push(["students", "/parents/me/children"]);
    if (["ADMIN", "STUDENT", "PARENT"].includes(role)) loads.push(["invoices", "/invoices", {
      limit: 100
    }]);
    Promise.allSettled(loads.map(async ([key, path, query]) => ({
      key,
      items: listData(await api.request(path, {
        query
      })).items
    }))).then(results => {
      if (!active) return;
      const out = {},
        warnings = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled") out[r.value.key] = r.value.items;else warnings.push({
          key: loads[i][0],
          message: r.reason.message
        });
      });
      setData(out);
      setErrors(warnings);
      if (["STUDENT", "PARENT"].includes(role)) setStudentId(out.students?.[0]?.id || "");
    });
    return () => {
      active = false;
    };
  }, [user?.id, user?.role, false, version]);
  return <Context.Provider value={{
    lookups: data,
    lookupErrors: errors,
    studentId,
    setStudentId,
    reloadLookups: () => setVersion(v => v + 1)
  }}>
      {children}
    </Context.Provider>;
}
export const useLookups = () => useContext(Context);
