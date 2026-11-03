import React from 'react';
import './rankBadge.css';
export default function RankBadge({rank}){
 if(!rank)return <span className="rank-unknown">Chưa gán cấp đai</span>;
 const color=/^#[0-9a-f]{6}$/i.test(rank.color||'')?rank.color:'#8caac0';
 return <span className="rank-badge" style={{'--rank-color':color}} title={`${rank.name} · Cấp độ ${rank.level}`}><i aria-hidden="true"/><span>{rank.name}</span></span>;
}
