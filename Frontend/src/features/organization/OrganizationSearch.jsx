import React from 'react';
import {Search,X} from 'lucide-react';
export default function OrganizationSearch({value,onChange,kind,count,total}) {
  const label=kind==='phường'?'Tìm kiếm phường':kind==='câu lạc bộ'?'Tìm kiếm câu lạc bộ':'Tìm kiếm chức năng';
  return <div className="unit-search-toolbar">
    <label className="unit-search-field">
      <Search size={19} aria-hidden="true"/>
      <input type="search" aria-label={label} placeholder={kind==='câu lạc bộ'?'Tìm CLB theo tên, địa chỉ...':kind==='phường'?'Tìm phường theo tên...':'Tìm chức năng quản lý...'} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')onChange('');}}/>
      {value&&<button type="button" aria-label="Xóa tìm kiếm" title="Xóa tìm kiếm" onClick={()=>onChange('')}><X size={17}/></button>}
    </label>
    <span className="unit-search-count" role="status" aria-live="polite" aria-atomic="true"><strong>{count}</strong> / {total} {kind}</span>
  </div>;
}
