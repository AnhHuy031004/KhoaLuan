import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesOrganizationSearch as matches} from '../src/features/organization/navigation.js';
test('Vietnamese names match accents, no accents, uppercase and separate words',()=>{
 const ward={name:'Phường Trấn Biên'};
 for(const term of ['tran bien','TRẤN BIÊN','  Biên   Trấn  ','Phường'])assert(matches(ward,term),term);
 assert(!matches(ward,'Long Bình'));
 assert(matches({name:'Phường Đông Hòa'},'dong hoa'));
});
test('clubs can be found by name, address and ward context',()=>{
 const club={name:'CLB Thanh niên',address:'Đường Đồng Khởi'};
 assert(matches(club,'thanh nien'));assert(matches(club,'dong khoi'));assert(matches(club,'tran bien','Phường Trấn Biên'));assert(!matches(club,'long binh','Phường Trấn Biên'));
});
test('function search uses titles and groups without inventing extra results',()=>{
 const functions=[{id:'attendance',title:'Điểm danh',group:'ĐÀO TẠO'},{id:'invoices',title:'Hóa đơn học phí',group:'TÀI CHÍNH'}];
 assert.deepEqual(functions.filter(m=>matches(m,'diem danh')).map(m=>m.id),['attendance']);
 assert.deepEqual(functions.filter(m=>matches(m,'tai chinh')).map(m=>m.id),['invoices']);
 assert.deepEqual(functions.filter(m=>matches(m,'khong ton tai')),[]);
});
test('empty search restores every available item and never mutates source records',()=>{
 const items=[{name:'Phường Trấn Biên'},{name:'Phường Long Bình'}],before=JSON.stringify(items);
 assert.equal(items.filter(m=>matches(m,'  ')).length,2);assert.equal(items.filter(m=>matches(m,'long')).length,1);assert.equal(items.filter(m=>matches(m,'')).length,2);assert.equal(JSON.stringify(items),before);
});
