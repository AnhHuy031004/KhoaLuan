import OrganizationSearch from './OrganizationSearch.jsx';
import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {Building2,MapPin,Layers,Users,ChevronRight,ArrowLeft,ArrowUpRight,LayoutGrid,LockKeyhole,RefreshCw,CalendarDays,ClipboardCheck,CalendarOff,UserPlus,BadgeCheck,TrendingUp,Trophy,Medal,Wallet,ReceiptText,CreditCard,ArrowLeftRight,FileCheck2,Tag,Bell,ChartNoAxesCombined} from 'lucide-react';
import {useAuth} from '../../contexts/AuthContext.jsx';
import {api} from '../../services/api.js';
import {useRemote} from '../../hooks/useRemote.js';
import {organizationQuery,FINANCIAL_MODULES,matchesOrganizationSearch,organizationEntryLevel} from './navigation.js';
import Loading from '../../components/common/Loading.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import './organization-navigation.css';

const functionIcons={instructors:Users,students:Users,classes:Layers,enrollments:UserPlus,schedules:CalendarDays,attendance:ClipboardCheck,leaves:CalendarOff,evaluations:BadgeCheck,promotions:TrendingUp,'exam-results':Trophy,'belt-history':Medal,tuition:Wallet,invoices:ReceiptText,'online-payments':CreditCard,transactions:ArrowLeftRight,'payment-confirmations':FileCheck2,discounts:Tag,announcements:Bell};
export default function OrganizationNavigator({moduleId='classes',hub=false,children}) {
  const {user}=useAuth();
  const [query,setQuery]=useSearchParams();
  const [search,setSearch]=useState('');
  useEffect(()=>setSearch(''),[moduleId,user.id,query.get('wardId'),query.get('clubId'),query.get('view')]);
  const remote=useRemote(signal=>api.request('/organization/navigation',{query:{module:moduleId},signal}),[moduleId,user.id,user.masterLevel,user.wardId,user.clubId]);
  useEffect(()=>api.subscribeResource?.('permissions',remote.reload),[remote.reload]);
  const data=remote.data;
  if(remote.loading)return <Loading/>;
  if(remote.error)return <ErrorState error={remote.error} retry={remote.reload}/>;
  if(!data)return null;
  const clubId=query.get('clubId')||(user.masterLevel==='CLUB'?user.clubId:'');
  const club=data.clubs.find(c=>c.id===clubId);
  const wardId=query.get('wardId')||club?.wardId||(['WARD','CLUB'].includes(user.masterLevel)?user.wardId:'');
  const ward=data.wards.find(w=>w.id===wardId);
  const allWards=organizationEntryLevel(user)==='wards';
  const choose=(next)=>setQuery({... (hub&&FINANCIAL_MODULES.includes(moduleId)?{module:moduleId}:{}),...next});
  if(clubId&&(!club||club.wardId!==wardId)||wardId&&!ward)return <ErrorState error={{status:403,message:'Đơn vị này không nằm trong phạm vi truy cập của bạn.'}} retry={()=>choose({})}/>;
  const availableFunctions=data.functions;
  const functions=availableFunctions.filter(m=>matchesOrganizationSearch(m,search));
  const groups=[...new Set(functions.map(m=>m.group))];
  const selection={wardId,clubId};
  const unitNav=<nav className="unit-breadcrumb" aria-label="Đơn vị quản lý">
    <button disabled={!allWards} onClick={()=>choose(user.masterLevel==='WARD'?{wardId:user.wardId,view:'wards'}:{})}><MapPin size={15}/>{data.province?.name||'Các phường'}</button>
    {ward&&<><ChevronRight size={14}/><button disabled={user.masterLevel==='CLUB'} onClick={()=>choose({wardId})}>{ward.name}</button></>}
    {club&&<><ChevronRight size={14}/><span aria-current="location">{club.name}</span></>}
  </nav>;
  const showWards=!wardId||query.get('view')==='wards'&&allWards;
  const units=showWards?data.wards:data.clubs.filter(c=>c.wardId===wardId);
  const visibleUnits=units.filter(unit=>matchesOrganizationSearch(unit,search,showWards?data.province?.name:ward?.name));
  const unitKind=showWards?'phường':'câu lạc bộ';
  if(!club||showWards)return <div className="organization-browser">
    {unitNav}
    <header className="unit-page-heading">
      <div className="unit-heading-title">
        <span className="eyebrow">QUẢN LÝ ĐƠN VỊ</span>
        <h1>{showWards?'Các phường trong tỉnh':'Câu lạc bộ tại '+ward.name}</h1>
        <p>{showWards?data.province?.name:ward.name}</p>
      </div>
      <div className="unit-heading-actions">
        {(showWards&&(user.role==='ADMIN'||user.masterLevel==='PROVINCE')||!showWards&&user.masterLevel!=='CLUB'&&(user.masterLevel!=='WARD'||wardId===user.wardId))&&
          <Link className="btn btn-secondary" to={'/app/'+(showWards?'wards':'clubs')+'?view=records'}>Quản lý {showWards?'phường':'câu lạc bộ'}</Link>}
        <button className="icon-btn" aria-label="Tải lại đơn vị" title="Tải lại đơn vị" onClick={remote.reload}><RefreshCw size={18}/></button>
      </div>
    </header>
    {!showWards&&allWards&&<button className="unit-back" onClick={()=>choose(user.masterLevel==='WARD'?{view:'wards'}:{})}><ArrowLeft size={16}/>Các phường</button>}
    <OrganizationSearch value={search} onChange={setSearch} kind={unitKind} count={visibleUnits.length} total={units.length}/>
    <div className="unit-card-grid">
      {visibleUnits.map(unit=><button className={'unit-card '+(showWards?'ward-card':'club-card')} key={unit.id} onClick={()=>choose(showWards?{wardId:unit.id}:{wardId,clubId:unit.id})}>
        <div className="unit-card-top"><span className="unit-card-icon">{showWards?<MapPin size={25}/>:<Building2 size={25}/>}</span><span className={'unit-status '+(unit.status==='ACTIVE'?'active':'paused')}>{unit.status==='ACTIVE'?'Hoạt động':'Tạm dừng'}</span></div>
        <small>{showWards?'PHƯỜNG':'CÂU LẠC BỘ'} · {String(units.indexOf(unit)+1).padStart(2,'0')}</small><h2>{unit.name}</h2><p>{showWards?data.province?.name:unit.address||ward.name}</p>
        <div className="unit-card-stats">{showWards&&<span><Building2 size={15}/><b>{unit.clubCount}</b> CLB</span>}<span><Layers size={15}/><b>{unit.classCount}</b> lớp</span><span><Users size={15}/><b>{unit.studentCount}</b> học viên</span></div>
        <div className="unit-card-footer"><span>{unit.readOnly?'Xem dữ liệu':showWards?'Xem câu lạc bộ':'Mở quản lý'}</span>{unit.readOnly?<LockKeyhole size={17}/>:<ArrowUpRight size={19}/>}</div>
      </button>)}
    </div>
    {!visibleUnits.length&&<><EmptyState text={units.length?'Không tìm thấy '+unitKind:'Chưa có đơn vị'} description={units.length?'Thử tên khác hoặc xóa nội dung tìm kiếm.':'Chưa có đơn vị thuộc phạm vi tài khoản này.'}/>{search&&<button className="btn btn-secondary unit-search-reset" onClick={()=>setSearch('')}>Xóa tìm kiếm</button>}</>}
  </div>;
  return <div className="organization-browser">
    {unitNav}
    <div className="selected-unit"><span className="unit-card-icon"><Building2 size={24}/></span><div><small>{ward.name}</small><strong>{club.name}</strong></div><div className="selected-unit-actions">{club.readOnly&&<span className="unit-readonly"><LockKeyhole size={14}/>Chỉ xem</span>}{!hub&&<Link className="btn btn-secondary" to={'/app/management'+organizationQuery(selection)+'&module='+moduleId}><LayoutGrid size={16}/>Chức năng CLB</Link>}{user.masterLevel!=='CLUB'&&<button className="btn btn-secondary" onClick={()=>choose({wardId})}>Đổi câu lạc bộ</button>}</div></div>
    {hub?<><div className="page-heading"><div><span className="eyebrow">ĐIỀU HÀNH CÂU LẠC BỘ</span><h1>Chức năng quản lý</h1><p>{club.classCount} lớp · {club.studentCount} học viên đang học</p></div></div><OrganizationSearch value={search} onChange={setSearch} kind="chức năng" count={functions.length} total={availableFunctions.length}/>{groups.map(group=><section className="unit-function-group" key={group}><h2>{group}</h2><div className="unit-function-grid">{functions.filter(m=>m.group===group).map(m=>{const Icon=functionIcons[m.id]||ChartNoAxesCombined;return <Link className="unit-function-card" key={m.id} to={'/app/'+m.id+organizationQuery(selection)}><span className="unit-function-icon"><Icon size={19}/></span><strong>{m.title}</strong><ChevronRight size={18}/></Link>;})}</div></section>)}{!functions.length&&<><EmptyState text={availableFunctions.length?'Không tìm thấy chức năng':'Chưa có chức năng được cấp quyền'} description={availableFunctions.length?'Thử tên khác hoặc xóa nội dung tìm kiếm.':'Tài khoản chưa được cấp chức năng tại đơn vị này.'}/>{search&&<button className="btn btn-secondary unit-search-reset" onClick={()=>setSearch('')}>Xóa tìm kiếm</button>}</>}</>:<div key={wardId+':'+clubId}>{children}</div>}
  </div>;
}
