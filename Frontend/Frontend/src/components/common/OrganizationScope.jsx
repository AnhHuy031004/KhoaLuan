import React,{useEffect} from 'react';
import { Building2, Network } from 'lucide-react';
import {useAuth} from '../../contexts/AuthContext.jsx';
import {useRemote} from '../../hooks/useRemote.js';
import {api,IS_MOCK} from '../../services/api.js';
import {roleLabel} from '../../utils/permissions.js';
import './organization.css';
export default function OrganizationScope(){
 const {user}=useAuth();
 const enabled=IS_MOCK&&['ADMIN','MASTER'].includes(user.role);
 const state=useRemote(()=>enabled?api.request('/organization'):Promise.resolve(null),[user.id,user.masterLevel,user.wardId,user.clubId]);
 useEffect(()=>enabled?api.subscribeResource?.('permissions',state.reload):undefined,[enabled,state.reload]);
 if(!enabled||!state.data)return null;
 const d=state.data,ward=d.wards.find(w=>w.id===user.wardId),club=d.clubs.find(c=>c.id===user.clubId);
 return <section className="organization-scope" aria-label="Phạm vi quản lý">
  <span className="organization-symbol"><Network size={22}/></span>
  <div className="organization-copy"><strong>{roleLabel(user)}</strong><p>{d.province?.name}{ward?' / '+ward.name:''}{club?' / '+club.name:''}</p></div>
  <span className="organization-count"><Building2 size={16}/>{d.classCount} lớp</span>
 </section>;
}
