import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockFetch,DB_KEY} from '../mock/api.js';
import {accounts,MOCK_PASSWORD} from '../mock/users.js';

test('active mock provider works offline, persists sessions and rejects unauthenticated resource access',async()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const fetch=createMockFetch({storage});
 const call=async(path,method='GET',body,token)=>{
  const r=await fetch('/backend'+path,{method,headers:token?{Authorization:'Bearer '+token}:{},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,...await r.json()};
 };
 assert.equal((await call('/students')).status,401);
 for(const account of accounts){
  const login=await call('/auth/login','POST',{email:account.email,password:MOCK_PASSWORD});
  assert.equal(login.status,200,account.email);assert.equal(login.data.user.password,undefined);
  const token=login.data.tokens.accessToken;
  const persisted=createMockFetch({storage});
  const me=await persisted('/backend/auth/me',{headers:{Authorization:'Bearer '+token}});
  assert.equal((await me.json()).data.id,account.id);
  assert.equal((await call('/auth/logout','POST',{},token)).status,200);
  assert.equal((await call('/auth/me','GET',null,token)).status,401);
 }
 assert(storage.getItem(DB_KEY));
});
