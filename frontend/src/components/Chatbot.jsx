import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, ArrowUpRight } from 'lucide-react';
import { PRODUCTS } from '../data.js';
import useBuyerCatalogue from '../sellers/useBuyerCatalogue';

import {askAssistant} from './assistant.client.js';
import {backend} from '../integrations/api.client.js';
import './shopping-assistant.css';
const native = Object.fromEntries([...new Set(PRODUCTS.map(p=>p.category))].map(d=>[d,PRODUCTS.filter(p=>p.category===d)]));
const money = amount => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(amount);
export default function Chatbot({ department='electronics', seller=false }) {
  const products = useBuyerCatalogue(department,native[department] || []);
  const [open,setOpen] = useState(false), [input,setInput] = useState('');
  const [gemini,setGemini]=useState(false),[pending,setPending]=useState(false);
  const live=useRef(true),busy=useRef(false);
  useEffect(()=>{live.current=true;if(backend.configured)backend.api('/api/assistant/config').then(result=>{if(live.current)setGemini(result.configured===true);}).catch(()=>{});return()=>{live.current=false;};},[]);
  const [messages,setMessages] = useState([{role:'assistant',text:seller ? 'Welcome to your seller studio. I can help with listings, photos, stock and offers.' : 'Hello! Let’s find something you’ll love. Ask about products, offers or delivery.'}]);
  const trigger=useRef(null),field=useRef(null),conversation=useRef(null);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  useEffect(()=>{if(!open)return;field.current?.focus();const key=e=>{if(e.key==='Escape'){e.preventDefault();close();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[open]);
  useEffect(()=>{if(conversation.current)conversation.current.scrollTop=conversation.current.scrollHeight;},[messages,open]);
  const ask=async message=>{const value=message.trim().slice(0,500);if(!value||busy.current)return;busy.current=true;setPending(true);setMessages(old=>[...old,{role:'user',text:value}].slice(-30));setInput('');try{const reply=await askAssistant(value,{department,products,seller},{configured:gemini,api:backend.api,history:messages});if(live.current)setMessages(old=>[...old,{role:'assistant',...reply}].slice(-30));}finally{busy.current=false;if(live.current)setPending(false);}};
  return <div className="em-assistant"><button className="em-assistant-trigger" ref={trigger} aria-expanded={open} aria-controls="em-assistant-panel" onClick={()=>open?close():setOpen(true)}><MessageCircle size={21}/><span>Ask EdgeMart</span></button>{open && <section id="em-assistant-panel" role="dialog" aria-label="EdgeMart shopping assistant"><header><div><span className="em-assistant-mark"><MessageCircle size={21}/></span><div><strong>EdgeMart assistant</strong><small>{gemini?'Gemini AI':seller?'Your seller guide':'Your shopping guide'} · {department}</small></div></div><button onClick={close} aria-label="Close shopping assistant"><X size={18}/></button></header><div className="em-assistant-conversation" ref={conversation} role="log" aria-live="polite">{messages.map((m,index)=><article key={index} className={`em-assistant-message ${m.role}`}><p>{m.text}</p>{m.note&&<small>{m.note}</small>}{m.products?.map(p=><a key={p.id} href={`/?department=${department}&${department==='electronics'?`page=product&product=${encodeURIComponent(p.id)}`:`q=${encodeURIComponent(p.name)}`}`}><span><strong>{p.name}</strong><small>{Number.isFinite(p.price)?money(p.price):'Choose a pack for pricing'} · {p.inStock?'Available':'Unavailable'}</small></span><ArrowUpRight size={15}/></a>)}{m.departments?.map(d=><a key={d.url} href={d.url}><strong>{d.name}</strong><ArrowUpRight size={15}/></a>)}</article>)}{pending&&<p className="em-assistant-typing" role="status">Thinking…</p>}</div><div className="em-assistant-quick">{(seller?['Upload photo','Publish product','Offers']:['Offers','Delivery','Payment']).map(q=><button key={q} disabled={pending} onClick={()=>ask(q)}>{q}</button>)}</div><form onSubmit={e=>{e.preventDefault();ask(input);}}><input ref={field} value={input} maxLength={500} onChange={e=>setInput(e.target.value)} aria-label="Message the shopping assistant" placeholder="How can I help?"/><button type="submit" disabled={pending||!input.trim()} aria-label="Send message"><Send size={18}/></button></form>{gemini&&<small className="em-assistant-disclosure">AI messages and public product details are sent to Google.</small>}</section>}</div>;
}
