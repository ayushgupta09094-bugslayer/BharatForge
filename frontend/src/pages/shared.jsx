import React from 'react';
export const API=import.meta.env.VITE_API_URL||'http://localhost:5000/api';
export async function api(path,opts={}){const isForm=opts.body instanceof FormData; const headers=isForm?{}:{'Content-Type':'application/json'}; const r=await fetch(API+path,{...opts,headers:{...headers,...(opts.headers||{})}}); const type=r.headers.get('content-type')||''; const data=type.includes('application/json')?await r.json():await r.text(); if(!r.ok)throw Error(data?.error||'Request failed'); return data;}
export function Card({label,value}){return <div className="card"><div className="muted">{label}</div><strong>{value}</strong></div>}
export function Progress({label,value}){const n=Math.max(0,Math.min(100,Number(value)||0));return <div className="progress"><div><span>{label}</span><b>{n}%</b></div><div className="bar"><i style={{width:`${n}%`}}/></div></div>}
export function Risk({value}){return <span className={'risk '+String(value||'').toLowerCase()}>{value}</span>}
export function Loading(){return <div className="loading">Loading…</div>}
export function ErrorBox({message}){return message?<div className="errorbox">{message}</div>:null}
