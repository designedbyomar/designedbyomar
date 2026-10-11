import { useEffect, useRef, useState } from 'react';
import { AppIcon, Check, ChevronDown } from '../ui-icons.jsx';
import './select-field.css';

// Presentation only: callers own values, validation, and submission.
export const SelectField = ({ id, name, value, options, placeholder = 'Choose an option', onChange, disabled = false, required = false, 'aria-invalid': invalid, 'aria-describedby': describedBy }) => {
  const choices = [{ value: '', label: placeholder }, ...options.map(option => ({ value: option, label: option }))];
  const selected = Math.max(0, choices.findIndex(option => option.value === value));
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({ above: false, height: 0 });
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const search = useRef({ text: '', time: 0 });
  const open = expanded && !disabled;
  const listId = `${id}-options`;

  const measure = () => {
    const rect = trigger.current.getBoundingClientRect();
    const styles = getComputedStyle(trigger.current);
    const gap = parseFloat(styles.getPropertyValue('--space-2'));
    const preferred = parseFloat(styles.getPropertyValue('--select-menu-max-height'));
    const below = window.innerHeight - rect.bottom - gap * 2;
    const above = rect.top - gap * 2;
    const useAbove = below < preferred && above > below;
    setPlacement({ above: useAbove, height: Math.max(0, useAbove ? above : below) });
  };
  const show = (index = selected) => {
    measure();
    setActive(index);
    search.current = { text: '', time: 0 };
    setExpanded(true);
  };
  const close = () => { setExpanded(false); search.current = { text: '', time: 0 }; };
  const commit = index => { onChange(choices[index].value); close(); };

  useEffect(() => {
    if (disabled) { setExpanded(false); return; }
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setExpanded(false); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, disabled]);

  useEffect(() => {
    if (!open) return;
    const option = menu.current?.children[active];
    if (!option) return;
    // Scroll only the popup, never the document or another enclosing surface.
    const bottom = option.offsetTop + option.offsetHeight;
    if (option.offsetTop < menu.current.scrollTop) menu.current.scrollTop = option.offsetTop;
    else if (bottom > menu.current.scrollTop + menu.current.clientHeight) menu.current.scrollTop = bottom - menu.current.clientHeight;
  }, [active, open]);

  const keyDown = event => {
    if (event.key === 'Tab') { if (open) commit(active); return; }
    if (event.key === 'Escape') { if (open) { event.preventDefault(); event.stopPropagation(); close(); } return; }
    if (event.key === 'Enter' || (event.key === ' ' && (!search.current.text || Date.now() - search.current.time >= 700))) {
      event.preventDefault();
      if (open) commit(active); else show();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1
        : Math.max(0, Math.min(choices.length - 1, (open ? active : selected) + (event.key === 'ArrowDown' ? 1 : -1)));
      if (open) setActive(next); else show(event.key === 'Home' || event.key === 'End' ? next : selected || next);
      return;
    }
    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const now = Date.now();
      const text = (now - search.current.time < 700 ? search.current.text : '') + event.key.toLowerCase();
      const repeated = [...text].every(char => char === text[0]);
      const prefix = repeated ? text[0] : text;
      const start = open ? active : selected;
      const indices = Array.from({ length: choices.length }, (_, offset) => (start + offset + (repeated ? 1 : 0)) % choices.length);
      const found = indices.find(index => choices[index].label.toLowerCase().startsWith(prefix));
      if (!open) show(found ?? selected); else if (found !== undefined) setActive(found);
      search.current = { text, time: now };
    }
  };

  return <div className="select-field" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <button id={id} ref={trigger} type="button" role="combobox" className="select-field__trigger"
      aria-labelledby={`${id}-label`} aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? listId : undefined}
      aria-activedescendant={open ? `${id}-option-${active}` : undefined} aria-required={required || undefined}
      aria-invalid={invalid} aria-describedby={describedBy} disabled={disabled}
      onClick={() => open ? close() : show()} onKeyDown={keyDown}>
      <span className={!value ? 'select-field__placeholder' : undefined}>{choices[selected].label}</span>
      <AppIcon icon={ChevronDown} size={16} />
    </button>
    <input type="hidden" name={name} value={value} disabled={disabled} />
    {open && <ul ref={menu} id={listId} role="listbox" aria-labelledby={`${id}-label`}
      className={`select-field__menu${placement.above ? ' select-field__menu--above' : ''}`}
      style={{ '--select-menu-available-height': `${placement.height}px` }}>
      {choices.map((option, index) => <li key={option.value} id={`${id}-option-${index}`} role="option"
        aria-selected={index === selected} data-active={index === active} className="select-field__option"
        onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()}
        onClick={() => { commit(index); trigger.current.focus(); }}>
        <span>{option.label}</span>{index === selected && <AppIcon icon={Check} size={16} />}
      </li>)}
    </ul>}
  </div>;
};
