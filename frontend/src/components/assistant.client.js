import {assistantReply} from './assistant.model.js';
export async function askAssistant(message,context,{configured=false,api,history=[]}={}){
  const local=assistantReply(message,context);
  const fixed=/offer|coupon|discount|promo|deliver|shipping|arriv|payment|upi|card|emi|pay|order|track|cancel|prescription|medicine|dose|symptom|upload|publish/i.test(message);
  if(!configured||fixed||local.products?.length||local.departments?.length)return {...local,source:'store-guide'};
  try{
    const recent=history.filter(row=>['user','assistant'].includes(row.role)&&typeof row.text==='string'&&row.text.trim()).slice(-6).map(row=>({role:row.role,text:row.text.slice(0,500)}));
    const result=await api('/api/assistant/chat',{method:'POST',timeoutMs:30000,body:{message:message.trim().slice(0,500),department:context.department,history:recent}});
    if(typeof result.text!=='string'||!result.text.trim())throw new Error('Empty assistant response');
    return {text:result.text.slice(0,4000),source:result.source==='gemini'?'gemini':'store-guide'};
  }catch(error){const note={GEMINI_BUSY:'Gemini is busy right now. Try again shortly. Showing the store guide.',GEMINI_RATE_LIMITED:'Gemini usage limit reached. Try again later. Showing the store guide.',SESSION_EXPIRED:'Sign in again to use Gemini. Showing the store guide.',GEMINI_NETWORK_ERROR:'Could not reach Gemini right now. Showing the store guide.'}[error?.code]||'Gemini is unavailable right now. Showing the store guide.';return {...local,source:'store-guide',note};}
}
