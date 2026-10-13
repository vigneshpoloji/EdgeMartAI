import React, { useEffect, useRef } from 'react';
import { cursorColour } from './dashboard-colours.js';
import './dashboard-effects.css';
import Chatbot from './Chatbot';
export default function DashboardEffects({ children, department, seller=false }) {
  const surface = useRef(null), frame = useRef(null);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const clear = () => {
    cancelAnimationFrame(frame.current);
    if (!surface.current) return;
    surface.current.removeAttribute('data-cursor-colour');
    surface.current.style.removeProperty('--cursor-colour');
  };
  const move = event => {
    if (event.pointerType !== 'mouse') return;
    const element = surface.current, { left, width } = element.getBoundingClientRect();
    const colour = cursorColour(event.clientX, left, width);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (!element.isConnected) return;
      element.style.setProperty('--cursor-colour', colour.hex);
      element.setAttribute('data-cursor-colour', colour.name);
    });
  };
  return <div ref={surface} className="em-cursor-shell" onPointerMove={move} onPointerLeave={clear}>{children}<Chatbot department={department} seller={seller}/></div>;
}
